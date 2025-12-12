import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Search, Map as MapIcon } from 'lucide-react-native';
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tarla Haritası</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Şehir veya İlçe Girin (Örn: Konya)"
            value={city}
            onChangeText={setCity}
            placeholderTextColor="#9ca3af"
          />
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => fetchMap(city)}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Search size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

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
                    <Text style={{marginTop:10, color:'#666'}}>Uydu görüntüleri alınıyor...</Text>
                </View>
            )}
          />
        ) : (
          <View style={styles.placeholder}>
            <View style={styles.iconCircle}>
                <MapIcon size={48} color="#16a34a" />
            </View>
            <Text style={styles.placeholderText}>
              Görüntülemek istediğiniz konumu yukarıya yazın.
            </Text>
            <Text style={styles.subText}>
                Uydu görüntüleri ve toprak analizi için bölge seçimi yapın.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  searchContainer: { flexDirection: 'row', padding: 16, gap: 10 },
  inputWrapper: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center' },
  input: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1f2937' },
  searchBtn: { backgroundColor: '#16a34a', width: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mapContainer: { flex: 1, backgroundColor: '#e5e7eb', margin: 16, marginTop: 0, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#d1d5db' },
  webview: { flex: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#fff' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  placeholderText: { fontSize: 18, fontWeight: 'bold', color: '#374151', textAlign: 'center', marginBottom: 8 },
  subText: { fontSize: 14, color: '#9ca3af', textAlign: 'center' }
});