import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform } from 'react-native';
import { CloudSun, Droplets, Wind, ScanLine, Calendar, AlertTriangle, MapPin, Bell, User } from 'lucide-react-native';
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

  // Hava Durumu Verisini Çek
  const fetchDashboardData = async () => {
    try {
      // 1. Konum İzni
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // İzin yoksa varsayılan veya boş veri gösterilebilir
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // 2. Konumu Al
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      // 3. API'den Veriyi Çek
      const data = await getWeatherData(
        location.coords.latitude,
        location.coords.longitude
      );

      setWeather(data);
    } catch (error) {
      console.error("Dashboard Veri Hatası:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Bildirim Token'ını Alıp Backend'e Kaydetme
  const registerDeviceForPushNotifications = async () => {
    if (!Device.isDevice) {
      console.log('Fiziksel cihazda çalışmalısınız (Emulator push desteklemez)');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Bildirim izni verilmedi!');
        return;
      }

      // Proje ID'sini güvenli şekilde al (app.json'daki ID)
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? "f18467ff-fc40-4c69-9e71-e47056d31b33";

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      const token = tokenData.data;
      console.log("🔥 CİHAZ TOKENI ALINDI:", token);

      // Backend'e Gönder
      await savePushToken(token);
      console.log("✅ Token başarıyla sunucuya kaydedildi.");

    } catch (error) {
      console.log("Token alma/kaydetme hatası:", error);
    }

    // Android için kanal ayarı
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
    // Sayfa açılınca bildirim kaydını da başlat
    registerDeviceForPushNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Ana Panel</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          
          {/* Sağ Üst Butonlar */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
              <Bell size={24} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <User size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hava Durumu Kartı */}
        <View style={styles.weatherCard}>
          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={{ padding: 20 }} />
          ) : (
            <>
              <View style={styles.weatherInfo}>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom:4}}>
                   <MapPin size={14} color="#dcfce7" style={{marginRight:4}}/>
                   <Text style={styles.weatherLoc}>{weather?.location || "Konum Bekleniyor..."}</Text>
                </View>
                <Text style={styles.weatherTemp}>{weather?.temp ?? "--"}°C</Text>
                <Text style={styles.weatherCond}>{weather?.condition || "Yükleniyor..."}</Text>
              </View>
              
              <CloudSun size={64} color="#bbf7d0" style={styles.weatherIcon} />
              
              <View style={styles.weatherStats}>
                <View style={styles.statItem}>
                  <Droplets size={16} color="#bbf7d0" />
                  <Text style={styles.statText}>%{weather?.humidity ?? "--"} Nem</Text>
                </View>
                <View style={styles.statItem}>
                  <Wind size={16} color="#bbf7d0" />
                  <Text style={styles.statText}>{weather?.wind ?? "--"} km/s</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Hızlı İşlemler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Analysis')}>
              <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                <ScanLine size={28} color="#16a34a" />
              </View>
              <Text style={styles.actionText}>Bitki Analizi</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Schedule')}>
              <View style={[styles.iconBox, { backgroundColor: '#dbeafe' }]}>
                <Calendar size={28} color="#2563eb" />
              </View>
              <Text style={styles.actionText}>Planlama</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Uyarı Kartı */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Günün İpucu</Text>
          <View style={styles.alertCard}>
            <AlertTriangle size={24} color="#f97316" />
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  dateText: { fontSize: 14, color: '#6b7280', marginTop: 4, textTransform: 'capitalize' },
  
  weatherCard: { margin: 20, padding: 24, backgroundColor: '#16a34a', borderRadius: 24, position: 'relative', overflow: 'hidden', elevation: 4, shadowColor: "#16a34a", shadowOpacity: 0.3, shadowRadius: 8 },
  weatherInfo: { marginBottom: 20, zIndex: 2 },
  weatherLoc: { color: '#dcfce7', fontSize: 14, fontWeight: '500' },
  weatherTemp: { color: '#fff', fontSize: 48, fontWeight: 'bold' },
  weatherCond: { color: '#f0fdf4', fontSize: 16 },
  weatherIcon: { position: 'absolute', right: 20, top: 30, opacity: 0.9 },
  weatherStats: { flexDirection: 'row', gap: 16, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 16, alignItems: 'center', gap: 12, elevation: 2 },
  iconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontWeight: '600', color: '#374151' },
  
  alertCard: { flexDirection: 'row', backgroundColor: '#fff7ed', padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#fb923c', gap: 12, elevation: 1 },
  alertContent: { flex: 1 },
  alertTitle: { color: '#9a3412', fontWeight: 'bold', marginBottom: 4 },
  alertDesc: { color: '#c2410c', fontSize: 13, lineHeight: 20 }
});