import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bot, User, MessageSquare } from 'lucide-react-native';
import { getChatHistory } from '../services/apiService';

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
             {new Date(item.created_at).toLocaleDateString('tr-TR', {
               day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'
             })}
           </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sohbet Geçmişi</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#16a34a"/></View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={renderItem}
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  msgRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start' },
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