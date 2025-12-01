import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bot, User, MessageSquare, Trash2 } from 'lucide-react-native';
import { getChatHistory, clearChatHistory } from '../services/apiService';

export default function ChatHistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getChatHistory();
      setHistory(data);
    } catch (error) {
      console.log("Geçmiş yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
      Alert.alert(
          "Geçmişi Temizle",
          "Tüm sohbet geçmişiniz silinecek. Emin misiniz?",
          [
              { text: "Vazgeç", style: "cancel" },
              {
                  text: "Temizle",
                  style: "destructive",
                  onPress: async () => {
                      setLoading(true);
                      try {
                          await clearChatHistory();
                          setHistory([]);
                      } catch (error) {
                          Alert.alert("Hata", "Geçmiş temizlenemedi.");
                      } finally {
                          setLoading(false);
                      }
                  }
              }
          ]
      );
  };

  // Mesajları tarihe göre gruplayan fonksiyon
  const sections = useMemo(() => {
    if (!history.length) return [];

    const grouped: { title: string; data: any[] }[] = [];
    let currentTitle = "";
    let currentData: any[] = [];

    // Veri zaten sunucudan "En Yeniden -> En Eskiye" doğru sıralı geliyor.
    history.forEach((item) => {
      const date = new Date(item.created_at);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let title = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

      // Tarih başlıklarını belirle (Bugün, Dün kontrolü)
      const isToday = date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();

      const isYesterday = date.getDate() === yesterday.getDate() &&
                          date.getMonth() === yesterday.getMonth() &&
                          date.getFullYear() === yesterday.getFullYear();

      if (isToday) {
        title = "Bugün";
      } else if (isYesterday) {
        title = "Dün";
      }

      // Yeni bir tarih grubuna geçildiyse
      if (title !== currentTitle) {
        if (currentTitle) {
          grouped.push({ title: currentTitle, data: currentData });
        }
        currentTitle = title;
        currentData = [item];
      } else {
        currentData.push(item);
      }
    });

    // Son grubu ekle
    if (currentTitle) {
      grouped.push({ title: currentTitle, data: currentData });
    }

    return grouped;
  }, [history]);

  const renderItem = ({ item }: any) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.userRow : styles.aiRow]}>
        <View style={[styles.avatar, isUser ? styles.userAvatar : styles.aiAvatar]}>
          {isUser ? <User size={14} color="#15803d" /> : <Bot size={14} color="#fff" />}
        </View>
        <View style={{flex: 1, alignItems: isUser ? 'flex-end' : 'flex-start'}}>
           <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
             <Text style={[styles.msgText, isUser ? styles.userText : styles.aiText]}>{item.message}</Text>
           </View>
           <Text style={styles.dateText}>
             {new Date(item.created_at).toLocaleTimeString('tr-TR', {
               hour: '2-digit', minute:'2-digit'
             })}
           </Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View style={styles.sectionHeaderContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sohbet Geçmişi</Text>

        {/* Temizleme Butonu */}
        {history.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory} style={styles.clearBtn}>
                <Trash2 size={24} color="#ef4444" />
            </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#16a34a"/></View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageSquare size={40} color="#d1d5db" />
              <Text style={styles.emptyText}>Henüz kaydedilmiş bir sohbet yok.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor:'#f3f4f6' },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', flex: 1 },
  clearBtn: { padding: 4 },

  // Section Header Stilleri
  sectionHeaderContainer: { alignItems: 'center', marginVertical: 16 },
  sectionHeader: { backgroundColor: '#e5e7eb', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  sectionHeaderText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },

  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' },
  userRow: { flexDirection: 'row-reverse' },
  aiRow: { flexDirection: 'row' },
  avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginHorizontal: 8, marginTop: 4 },
  userAvatar: { backgroundColor: '#dcfce7' },
  aiAvatar: { backgroundColor: '#16a34a' },
  bubble: { padding: 12, borderRadius: 16, maxWidth: '100%' },
  userBubble: { backgroundColor: '#16a34a', borderTopRightRadius: 2 },
  aiBubble: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderTopLeftRadius: 2 },
  msgText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#fff' },
  aiText: { color: '#374151' },
  dateText: { fontSize: 10, color: '#9ca3af', marginTop: 4, marginHorizontal: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { color: '#9ca3af', fontSize: 16 }
});