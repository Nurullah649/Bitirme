import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, ChevronDown, ChevronUp, Calendar, MessageCircle } from 'lucide-react-native';
import { getChatHistory, clearChatHistory } from '../services/apiService';

// Android için animasyon aktivasyonu
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Mesaj Tipleri
interface HistoryItem {
  id: string;
  role: 'user' | 'ai';
  message: string;
  created_at: string;
}

// --- Alt Bileşen: Tarih Grubu Kartı ---
const DateGroup = ({ title, messages }: { title: string, messages: HistoryItem[] }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.groupContainer}>
      {/* Tarih Başlığı (Tıklanabilir Kart) */}
      <TouchableOpacity
        onPress={toggleExpand}
        style={[styles.groupHeader, expanded && styles.groupHeaderActive]}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, expanded ? styles.iconBoxActive : styles.iconBoxInactive]}>
             <Calendar size={20} color={expanded ? "#fff" : "#16a34a"} />
          </View>
          <View>
             <Text style={styles.groupTitle}>{title}</Text>
             <Text style={styles.groupSubtitle}>{messages.length} Mesaj</Text>
          </View>
        </View>
        {expanded ? <ChevronUp size={20} color="#6b7280" /> : <ChevronDown size={20} color="#9ca3af" />}
      </TouchableOpacity>

      {/* Mesajlar Listesi (Sadece expanded ise görünür) */}
      {expanded && (
        <View style={styles.messagesList}>
          {messages.map((item, index) => {
            const isUser = item.role === 'user';
            return (
              <View key={item.id || index} style={[styles.msgRow, isUser ? styles.rowUser : styles.rowAi]}>
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
                  <Text style={[styles.msgText, isUser ? styles.textUser : styles.textAi]}>
                    {item.message}
                  </Text>
                  <Text style={[styles.timeText, isUser ? styles.timeUser : styles.timeAi]}>
                    {new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' })}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default function ChatHistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
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
      "Tüm sohbet kayıtlarınız silinecek. Bu işlem geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Evet, Sil",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await clearChatHistory();
              setHistory([]); // Listeyi boşalt
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

  // Veriyi Tarihe Göre Grupla
  const groupedHistory = useMemo(() => {
    if (!history.length) return [];

    const grouped: { title: string; data: HistoryItem[] }[] = [];
    let currentTitle = "";
    let currentData: HistoryItem[] = [];

    history.forEach((item) => {
      const date = new Date(item.created_at);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let title = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

      const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
      const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

      if (isToday) title = "Bugün";
      else if (isYesterday) title = "Dün";

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

    if (currentTitle) {
      grouped.push({ title: currentTitle, data: currentData });
    }

    return grouped;
  }, [history]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sohbet Geçmişi</Text>

        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory} style={styles.clearBtn}>
            <Trash2 size={22} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#16a34a"/></View>
      ) : (
        <FlatList
          data={groupedHistory}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <DateGroup title={item.title} messages={item.data} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                 <MessageCircle size={48} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>Henüz Sohbet Yok</Text>
              <Text style={styles.emptyText}>Asistanla yaptığınız konuşmalar burada tarihe göre gruplanarak saklanır.</Text>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', flex: 1 },
  clearBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 8 },

  // Date Group Card
  groupContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff'
  },
  groupHeaderActive: {
    backgroundColor: '#f8fafc', // Açılınca hafif renk değişsin
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconBoxInactive: { backgroundColor: '#dcfce7' },
  iconBoxActive: { backgroundColor: '#16a34a' },

  groupTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  groupSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  // Messages List inside Group
  messagesList: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },

  // Mesaj Baloncukları (ChatScreen ile uyumlu Modern Tasarım)
  msgRow: { marginVertical: 6, width: '100%' },
  rowUser: { alignItems: 'flex-end' },
  rowAi: { alignItems: 'flex-start' },

  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#16a34a',
    borderBottomRightRadius: 2
  },
  bubbleAi: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },

  msgText: { fontSize: 14, lineHeight: 20 },
  textUser: { color: '#fff' },
  textAi: { color: '#334155' },

  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  timeUser: { color: 'rgba(255,255,255,0.8)' },
  timeAi: { color: '#94a3b8' },

  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconBox: {
    width: 100,
    height: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  emptyText: { color: '#6b7280', fontSize: 15, textAlign: 'center', lineHeight: 22 }
});