import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Calendar, ArrowLeft, Clock } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { getTasks } from '../services/apiService';
import { Task } from '../types';

export default function NotificationsScreen({ navigation }: any) {
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    try {
      const allTasks = await getTasks();

      // Şimdiki zaman
      const now = new Date();
      // 1 Hafta sonrası
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);

      // Filtreleme
      const filtered = allTasks.filter(t => {
        try {
            const taskDate = new Date(t.date_text.replace(' ', 'T'));
            return !isNaN(taskDate.getTime()) && taskDate >= now && taskDate <= nextWeek && (t.status === 'approved' || t.status === 'pending');
        } catch (e) {
            return false;
        }
      });

      // Sıralama
      filtered.sort((a, b) => {
          return new Date(a.date_text).getTime() - new Date(b.date_text).getTime();
      });

      setUpcomingTasks(filtered);
      scheduleReminders(filtered);

    } catch (error) {
      console.log("Bildirim yükleme hatası:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- DÜZELTİLEN KISIM BURASI ---
  const scheduleReminders = async (tasks: Task[]) => {
      await Notifications.cancelAllScheduledNotificationsAsync();

      for (const task of tasks) {
          try {
              const taskDate = new Date(task.date_text.replace(' ', 'T'));

              if (taskDate > new Date()) {
                  await Notifications.scheduleNotificationAsync({
                      content: {
                          title: "Göreviniz Var! 🚜",
                          body: `${task.title} zamanı geldi.`,
                          sound: true,
                          data: { taskId: task.id }
                      },
                      // ESKİ KOD (Hatalı olan):
                      // trigger: taskDate,

                      // YENİ KOD (Doğru olan):
                      trigger: {
                          type: 'date',
                          date: taskDate
                      },
                  });
              }
          } catch (e) {
              console.log("Bildirim kurulamadı:", task.title);
          }
      }
  };
  // --------------------------------

  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: item.status === 'approved' ? '#dbeafe' : '#fef3c7' }]}>
        {item.status === 'approved' ? (
            <Clock size={24} color="#2563eb" />
        ) : (
            <Bell size={24} color="#d97706" />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.time}>{new Date(item.date_text).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</Text>
        </View>
        <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
            <Calendar size={14} color="#6b7280" />
            <Text style={styles.desc}>
                {new Date(item.date_text).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
        </View>
        <Text style={[styles.status, { color: item.status === 'approved' ? '#2563eb' : '#d97706' }]}>
            {item.status === 'approved' ? 'Planlandı' : 'Onay Bekliyor'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yaklaşan Görevler</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#16a34a"/></View>
      ) : (
        <FlatList
          data={upcomingTasks}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
             <RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); loadNotifications();}} />
          }
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell size={40} color="#d1d5db" />
              <Text style={styles.emptyText}>Önümüzdeki 1 hafta için plan bulunmuyor.</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center', gap: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: 'bold', color: '#1f2937', fontSize: 16, flex: 1 },
  desc: { color: '#6b7280', fontSize: 14 },
  time: { color: '#16a34a', fontWeight:'bold', fontSize: 12 },
  status: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { color: '#9ca3af', fontSize: 16 }
});