import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, CheckCircle, Circle, Clock, ThumbsUp, Trash2 } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { getTasks, updateTaskStatus, deleteTask } from '../services/apiService';
import { Task } from '../types';

export default function ScheduleScreen({ navigation }: any) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );

  const fetchTasks = async () => {
    try {
      const data = await getTasks();

      // Bildirim mantığı (daha önce eklemiştik)
      const pendingCount = data.filter(t => t.status === 'pending').length;
      if (pendingCount > 0 && !loading && data.length > tasks.length) {
         sendRecommendationNotification(pendingCount);
      }

      setTasks(data);
    } catch (error) {
      console.error("Görevleri alma hatası:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendRecommendationNotification = async (count: number) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Yeni Plan Önerisi! 🚜",
          body: `Asistanınız onayınızı bekleyen ${count} yeni görev oluşturdu.`,
          sound: true,
        },
        trigger: null,
      });
    } catch (e) {
      console.log("Bildirim gönderilemedi:", e);
    }
  };

  const handleDelete = (task: Task) => {
      Alert.alert(
          "Görevi Sil",
          "Bu görevi silmek istediğinize emin misiniz?",
          [
              { text: "Vazgeç", style: "cancel" },
              {
                  text: "Sil",
                  style: "destructive",
                  onPress: async () => {
                      // Optimistic Update
                      setTasks(prev => prev.filter(t => t.id !== task.id));
                      try {
                          await deleteTask(task.id);
                      } catch (error) {
                          Alert.alert("Hata", "Görev silinemedi.");
                          fetchTasks(); // Geri yükle
                      }
                  }
              }
          ]
      );
  };

  const handleStatusChange = async (task: Task) => {
    if (task.status === 'pending') {
        Alert.alert(
            "Görevi Onayla",
            "Bu görevi planınıza kalıcı olarak eklemek istiyor musunuz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Onayla",
                    onPress: async () => {
                        await updateTask(task.id, 'approved');
                    }
                }
            ]
        );
    }
    else if (task.status === 'approved') {
        await updateTask(task.id, 'completed');
    }
    else if (task.status === 'completed') {
        await updateTask(task.id, 'approved');
    }
  };

  const updateTask = async (id: number, status: 'approved' | 'completed') => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      try {
          await updateTaskStatus(id, status);
      } catch (error) {
          Alert.alert("Hata", "Durum güncellenemedi.");
          fetchTasks();
      }
  };

  const renderItem = ({ item }: { item: Task }) => {
    let iconColor = "#d1d5db";
    let IconComponent = Circle;
    let cardStyle = styles.card;
    let statusText = "";

    if (item.status === 'completed') {
        iconColor = "#16a34a";
        IconComponent = CheckCircle;
    } else if (item.status === 'approved') {
        iconColor = "#2563eb";
        IconComponent = Clock;
    } else if (item.status === 'pending') {
        iconColor = "#f59e0b";
        IconComponent = ThumbsUp;
        cardStyle = {...styles.card, borderLeftWidth: 4, borderLeftColor: '#f59e0b'};
        statusText = "Onay Bekliyor";
    }

    return (
      <TouchableOpacity style={cardStyle} onPress={() => handleStatusChange(item)}>
        <View style={styles.checkArea}>
          <IconComponent size={24} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[
              styles.title,
              item.status === 'completed' && styles.titleCompleted,
              item.status === 'pending' && styles.titlePending
          ]}>
            {item.title}
          </Text>

          <View style={styles.dateRow}>
            <Calendar size={14} color="#9ca3af" />
            <Text style={styles.date}>{item.date_text}</Text>
            {item.status === 'pending' && (
                <View style={styles.pendingBadgeContainer}>
                    <Text style={styles.pendingBadge}>{statusText}</Text>
                </View>
            )}
          </View>
        </View>

        {/* SİLME BUTONU */}
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planlanan Görevler</Text>
      </View>

      {loading ? (
          <View style={styles.center}>
              <ActivityIndicator size="large" color="#16a34a" />
          </View>
      ) : (
          <FlatList
            data={tasks}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchTasks();}} colors={["#16a34a"]} />
            }
            renderItem={renderItem}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Clock size={48} color="#e5e7eb" />
                    <Text style={styles.emptyText}>Henüz bir planınız yok.</Text>
                    <Text style={styles.emptySubText}>Asistanınızla konuşarak yeni görevler oluşturabilirsiniz.</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    elevation: 2
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    gap: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3
  },
  checkArea: { padding: 4 },
  title: { fontWeight: 'bold', color: '#1f2937', fontSize: 16 },
  titleCompleted: { textDecorationLine: 'line-through', color: '#9ca3af' },
  titlePending: { color: '#d97706' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  date: { color: '#6b7280', fontSize: 13 },
  pendingBadgeContainer: { marginLeft: 'auto' },
  pendingBadge: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: 'bold',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden'
  },
  deleteBtn: { padding: 8, marginLeft: 'auto' }, // Silme butonu stili
  emptyState: { alignItems: 'center', marginTop: 80, padding: 20 },
  emptyText: { color: '#374151', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubText: { color: '#9ca3af', fontSize: 14, marginTop: 8, textAlign: 'center' }
});