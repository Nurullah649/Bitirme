import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, CloudRain, Sprout, ArrowLeft } from 'lucide-react-native';

export default function NotificationsScreen({ navigation }: any) {
  // Örnek Veriler
  const notifications = [
    { id: '1', title: 'Analiz Tamamlandı', desc: 'Domates yaprağı analiziniz sonuçlandı.', time: '10:45', type: 'analysis' },
    { id: '2', title: 'Hava Durumu Uyarısı', desc: 'Bölgenizde bu gece don bekleniyor.', time: 'Dün', type: 'weather' },
    { id: '3', title: 'Sulama Hatırlatması', desc: '3 numaralı tarlanın sulama vakti geldi.', time: 'Dün', type: 'reminder' },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'weather': return <CloudRain size={24} color="#f97316" />;
      case 'analysis': return <Sprout size={24} color="#16a34a" />;
      default: return <Bell size={24} color="#2563eb" />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirimler</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.iconBox, styles[`icon_${item.type}` as keyof typeof styles]]}>
              {getIcon(item.type)}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, alignItems: 'center', gap: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  icon_weather: { backgroundColor: '#fff7ed' },
  icon_analysis: { backgroundColor: '#f0fdf4' },
  icon_reminder: { backgroundColor: '#eff6ff' },
  title: { fontWeight: 'bold', color: '#1f2937', fontSize: 16 },
  desc: { color: '#6b7280', fontSize: 14, marginTop: 2 },
  time: { color: '#9ca3af', fontSize: 12 }
});