import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, CheckCircle, Circle } from 'lucide-react-native';

export default function ScheduleScreen({ navigation }: any) {
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Mısır tarlası sulama', date: 'Bugün, 16:00', completed: false },
    { id: '2', title: 'Gübre siparişi ver', date: 'Yarın, 09:00', completed: false },
    { id: '3', title: 'Traktör bakımı', date: '25 Kasım', completed: true },
  ]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planlanan Görevler</Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => toggleTask(item.id)}>
            <View style={styles.checkArea}>
              {item.completed ? <CheckCircle size={24} color="#16a34a" /> : <Circle size={24} color="#d1d5db" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, item.completed && styles.titleCompleted]}>{item.title}</Text>
              <View style={styles.dateRow}>
                <Calendar size={14} color="#9ca3af" />
                <Text style={styles.date}>{item.date}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center', gap: 16, elevation: 1 },
  checkArea: { padding: 4 },
  title: { fontWeight: 'bold', color: '#1f2937', fontSize: 16 },
  titleCompleted: { textDecorationLine: 'line-through', color: '#9ca3af' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  date: { color: '#9ca3af', fontSize: 12 }
});