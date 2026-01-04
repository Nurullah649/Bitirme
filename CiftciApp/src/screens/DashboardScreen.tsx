import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform, StatusBar } from 'react-native';
import { CloudSun, Droplets, Wind, ScanLine, Calendar, AlertTriangle, MapPin, Bell, User, Map } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { getWeatherData, savePushToken } from '../services/apiService';
import { WeatherData } from '../types';

export default function DashboardScreen({ navigation }: any) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const data = await getWeatherData(location.coords.latitude, location.coords.longitude);
      setWeather(data);
    } catch (error) {
      console.error("Dashboard Veri Hatası:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const registerDeviceForPushNotifications = async () => {
    if (!Device.isDevice) return;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? "f18467ff-fc40-4c69-9e71-e47056d31b33";
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      await savePushToken(tokenData.data);
    } catch (error) {
      console.log("Token hatası:", error);
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  };

  useEffect(() => {
    fetchDashboardData();
    registerDeviceForPushNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }} // Alt menü için ekstra boşluk
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Ana Menü</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconBtn}>
              <Bell size={22} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.iconBtn}>
              <User size={22} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hava Durumu - Modern & Flat */}
        <View style={styles.weatherCard}>
          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ padding: 20 }} />
          ) : (
            <>
              <View style={styles.weatherTopRow}>
                <View>
                   <View style={styles.locationBadge}>
                      <MapPin size={12} color="#dcfce7" style={{marginRight:4}}/>
                      <Text style={styles.weatherLoc}>{weather?.location || "Konum..."}</Text>
                   </View>
                   <Text style={styles.weatherTemp}>{weather?.temp ?? "--"}°</Text>
                   <Text style={styles.weatherCond}>{weather?.condition || "Yükleniyor..."}</Text>
                </View>
                <CloudSun size={80} color="#bbf7d0" style={styles.weatherIcon} />
              </View>

              <View style={styles.weatherStats}>
                <View style={styles.statItem}>
                  <Droplets size={18} color="#dcfce7" />
                  <Text style={styles.statText}>%{weather?.humidity ?? "--"} Nem</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Wind size={18} color="#dcfce7" />
                  <Text style={styles.statText}>{weather?.wind ?? "--"} km/s</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Hızlı İşlemler - Clean Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Analysis')}>
              <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                <ScanLine size={26} color="#16a34a" />
              </View>
              <Text style={styles.actionText}>Bitki Analizi</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Schedule')}>
              <View style={[styles.iconBox, { backgroundColor: '#dbeafe' }]}>
                <Calendar size={26} color="#2563eb" />
              </View>
              <Text style={styles.actionText}>Planlama</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Map')}>
              <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                <Map size={26} color="#d97706" />
              </View>
              <Text style={styles.actionText}>Harita</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* İpucu - Soft Alert */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Günün İpucu</Text>
          <View style={styles.alertCard}>
            <View style={styles.alertIconBox}>
               <AlertTriangle size={24} color="#f97316" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Durum Analizi</Text>
              <Text style={styles.alertDesc}>
                {weather && weather.temp > 28
                  ? "Sıcaklık yüksek seyrediyor. Sulama sıklığını artırmayı değerlendirin."
                  : weather && weather.temp < 5
                  ? "Don riski olabilir. Hassas bitkilerinizi korumaya alın."
                  : "Hava koşulları mevsim normallerinde. Düzenli bakıma devam edebilirsiniz."}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' }, // Hafif gri zemin

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#f9fafb'
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  dateText: { fontSize: 14, color: '#6b7280', marginTop: 2, textTransform: 'capitalize', fontWeight: '500' },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 50, borderWidth: 1, borderColor: '#e5e7eb' },

  // Weather Card (Minimalist & Flat)
  weatherCard: {
    margin: 24,
    marginTop: 10,
    padding: 28,
    backgroundColor: '#16a34a', // Mat Yeşil
    borderRadius: 32, // Daha oval
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  weatherTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8 },
  weatherLoc: { color: '#fff', fontSize: 13, fontWeight: '600' },
  weatherTemp: { color: '#fff', fontSize: 56, fontWeight: '800', letterSpacing: -1 },
  weatherCond: { color: '#dcfce7', fontSize: 16, fontWeight: '500', marginTop: -4 },
  weatherIcon: { opacity: 0.9 },

  weatherStats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 20, padding: 16, justifyContent: 'space-around', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  statDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Sections
  section: { paddingHorizontal: 24, marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 16 },

  // Action Grid
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    // Soft Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  iconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontWeight: '600', color: '#374151', fontSize: 13, textAlign: 'center' },

  // Alert Card
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    gap: 16,
    alignItems: 'flex-start',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  alertIconBox: { backgroundColor: '#fff7ed', padding: 12, borderRadius: 16 },
  alertContent: { flex: 1 },
  alertTitle: { color: '#9a3412', fontWeight: '700', fontSize: 15, marginBottom: 6 },
  alertDesc: { color: '#4b5563', fontSize: 13, lineHeight: 20 }
});