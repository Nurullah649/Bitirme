import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Keyboard, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Search, Map as MapIcon, Locate, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';
import { getMapHtml, getUserProfile } from '../services/apiService';

export default function MapScreen({ navigation }: any) {
  const [city, setCity] = useState('');
  const [mapHtml, setMapHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDefaultLocation();
  }, []);

  const loadDefaultLocation = async () => {
    try {
      const profile = await getUserProfile();
      if (profile.location) {
        setCity(profile.location);
        fetchMap(profile.location);
      }
    } catch (e) {
      // Profil çekilemezse varsayılan boş kalır
    }
  };

  const fetchMap = async (locationName: string) => {
    if (!locationName.trim()) return;

    Keyboard.dismiss();
    setLoading(true);
    try {
      const html = await getMapHtml(locationName);
      setMapHtml(html);
    } catch (error) {
      Alert.alert("Hata", "Harita yüklenirken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Konumumu Bul Fonksiyonu
  const handleCurrentLocation = async () => {
    setLoading(true);
    Keyboard.dismiss();
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Reddedildi', 'Konumunuzu bulabilmek için izin vermeniz gerekiyor.');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (address && address.length > 0) {
        const place = address[0];
        // Adres önceliği: İlçe -> Şehir -> Bölge
        const locationName = place.subregion || place.city || place.region;

        if (locationName) {
            setCity(locationName);
            fetchMap(locationName);
        } else {
            Alert.alert('Hata', 'Konum ismi tespit edilemedi.');
            setLoading(false);
        }
      }
    } catch (error) {
      Alert.alert('Hata', 'GPS konumu alınamadı.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tarla Haritası</Text>
      </View>

      {/* Arama Alanı */}
      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Şehir/İlçe Ara..."
            value={city}
            onChangeText={setCity}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Konumumu Bul Butonu (Mavi) */}
        <TouchableOpacity
          style={[styles.iconBtn, styles.locationBtn]}
          onPress={handleCurrentLocation}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Navigation size={22} color="#fff" />}
        </TouchableOpacity>

        {/* Ara Butonu (Yeşil) */}
        <TouchableOpacity
          style={[styles.iconBtn, styles.searchBtn]}
          onPress={() => fetchMap(city)}
          disabled={loading}
        >
          <Search size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Harita Alanı */}
      <View style={styles.mapContainer}>
        {mapHtml ? (
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.webview}
            startInLoadingState={true}
            renderLoading={() => (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#16a34a" />
                    <Text style={styles.loadingText}>Uydu görüntüleri yükleniyor...</Text>
                </View>
            )}
          />
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.iconCircle}>
                <MapIcon size={56} color="#16a34a" />
            </View>
            <Text style={styles.placeholderTitle}>Konum Seçin</Text>
            <Text style={styles.placeholderText}>
              Haritayı görüntülemek için bir yer arayın veya konumunuzu kullanın.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    // borderBottomWidth: 1,
    // borderBottomColor: '#f3f4f6'
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },

  // Arama Alanı
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 4,
    gap: 10,
    alignItems: 'center'
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    // Hafif gölge ve gri zemin alternatifi
    backgroundColor: '#f3f4f6',
    height: 48,
    justifyContent: 'center'
  },
  input: {
    paddingHorizontal: 20,
    fontSize: 15,
    color: '#1f2937',
    height: '100%'
  },

  // Butonlar
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  locationBtn: { backgroundColor: '#3b82f6' }, // Mavi
  searchBtn: { backgroundColor: '#16a34a' },   // Yeşil

  // Harita Kutusu
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 28,
    overflow: 'hidden',
    // Modern Gölge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  loadingText: { marginTop: 12, color: '#6b7280', fontWeight: '500' },

  // Boş Durum (Placeholder)
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff'
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  placeholderTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  placeholderText: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 }
});