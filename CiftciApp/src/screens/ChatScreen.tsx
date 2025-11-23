import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar } from 'react-native';
import { Send, Bot, User, History } from 'lucide-react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendMessageToAI } from '../services/apiService';
import { ChatMessage } from '../types';

export default function ChatScreen({ navigation }: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Merhaba! Ben Çiftçi Asistan. Tarlanız, hava durumu veya bitki hastalıkları hakkında bana her şeyi sorabilirsiniz.",
      sender: 'ai'
    }
  ]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), text: text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setText('');
    setLoading(true);

    try {
      let lat = null;
      let lon = null;

      try {
        // Konum İzni ve Alma (Zaman Aşımlı)
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
           const locationPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
           const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000));
           const location: any = await Promise.race([locationPromise, timeoutPromise]);
           lat = location.coords.latitude;
           lon = location.coords.longitude;
        }
      } catch (e) {
        console.log("Konum alınamadı, devam ediliyor.");
      }

      const response = await sendMessageToAI(userMsg.text, lat, lon);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), text: response, sender: 'ai' };
      setMessages(prev => [...prev, aiMsg]);

    } catch (e) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Üzgünüm, sunucuyla bağlantı kurulamadı.",
        sender: 'ai'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#16a34a" />

      {/* Yeşil Header */}
      <View style={styles.header}>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={styles.headerTitle}>Çiftçi Asistan</Text>
          <Text style={styles.headerSubtitle}>Yapay Zeka Destekli</Text>
        </View>

        {/* Geçmiş Butonu */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ChatHistory')}
          style={styles.historyBtn}
        >
          <History size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Klavye Yönetimi */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.contentContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            renderItem={({ item }) => (
              <View style={[styles.msgRow, item.sender === 'user' ? styles.userRow : styles.aiRow]}>
                <View style={[styles.avatar, item.sender === 'user' ? styles.userAvatar : styles.aiAvatar]}>
                  {item.sender === 'user' ? <User size={18} color="#15803d" /> : <Bot size={18} color="#fff" />}
                </View>
                <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.msgText, item.sender === 'user' ? styles.userText : styles.aiText]}>{item.text}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={{ padding: 16, paddingBottom: 20, paddingTop: 20 }}
          />

          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              placeholder="Bir soru sorun..."
              value={text}
              onChangeText={setText}
              multiline
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading || !text.trim()}>
              {loading ? <ActivityIndicator color="#fff" size="small"/> : <Send size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#16a34a' },

  header: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#15803d',
    elevation: 4,
    zIndex: 10,
    position: 'relative'
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#dcfce7', fontSize: 12, marginTop: 2 },
  historyBtn: { position: 'absolute', right: 20 },

  keyboardView: { flex: 1, backgroundColor: '#f9fafb' },
  contentContainer: { flex: 1, justifyContent: 'space-between' },

  msgRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  userRow: { flexDirection: 'row-reverse' },
  aiRow: { flexDirection: 'row' },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  userAvatar: { backgroundColor: '#dcfce7' },
  aiAvatar: { backgroundColor: '#16a34a' },
  bubble: { maxWidth: '75%', padding: 14, borderRadius: 20 },
  userBubble: { backgroundColor: '#16a34a', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: '#374151' },

  inputArea: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#f3f4f6', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, maxHeight: 100, fontSize: 15 },
  sendBtn: { width: 44, height: 44, backgroundColor: '#16a34a', borderRadius: 22, justifyContent: 'center', alignItems: 'center' }
});