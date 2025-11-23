import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Camera, Upload, X, CheckCircle, AlertOctagon, Info } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageForAnalysis } from '../services/apiService';
import { AnalysisResult } from '../types';

export default function AnalysisScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const pickImage = async (useCamera: boolean) => {
    // İzin İste
    const { status } = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert("İzin Gerekli", "Bu özelliği kullanmak için izin vermelisiniz.");
      return;
    }

    let result;
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 0.7,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 0.7,
      });
    }

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const data = await uploadImageForAnalysis(image);
      setResult(data);
    } catch (error) {
      Alert.alert("Hata", "Analiz sırasında bir sorun oluştu.");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!image ? (
        <View style={styles.uploadArea}>
          <View style={styles.iconCircle}>
            <Camera size={48} color="#16a34a" />
          </View>
          <Text style={styles.title}>Bitki Analizi</Text>
          <Text style={styles.subtitle}>
            Hastalık teşhisi için bitkinin etkilenen bölgesinin net bir fotoğrafını yükleyin.
          </Text>

          <TouchableOpacity style={styles.btnPrimary} onPress={() => pickImage(true)}>
            <Camera size={20} color="#fff" style={{marginRight:8}} />
            <Text style={styles.btnText}>Fotoğraf Çek</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} onPress={() => pickImage(false)}>
            <Upload size={20} color="#16a34a" style={{marginRight:8}} />
            <Text style={[styles.btnText, {color: '#16a34a'}]}>Galeriden Seç</Text>
          </TouchableOpacity>

          <View style={styles.infoRow}>
            <Info size={16} color="#9ca3af" />
            <Text style={styles.infoText}>İyi Işık • Net Odak • Yakın Çekim</Text>
          </View>
        </View>
      ) : (
        <View style={styles.resultArea}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.previewImage} />
            {!analyzing && !result && (
              <TouchableOpacity style={styles.closeBtn} onPress={reset}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            )}

            {analyzing && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Yapay Zeka İnceliyor...</Text>
              </View>
            )}
          </View>

          {!result && !analyzing && (
            <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze}>
              <Upload size={20} color="#fff" style={{marginRight:8}} />
              <Text style={styles.btnText}>Analizi Başlat</Text>
            </TouchableOpacity>
          )}

          {result && (
            <View style={[styles.card, result.status === 'healthy' ? styles.cardGreen : styles.cardRed]}>
              <View style={styles.cardHeader}>
                {result.status === 'healthy' ? (
                  <CheckCircle size={32} color="#22c55e" />
                ) : (
                  <AlertOctagon size={32} color="#ef4444" />
                )}
                <View style={{marginLeft: 12, flex: 1}}>
                  <Text style={styles.diseaseName}>{result.diseaseName}</Text>
                  <Text style={styles.confidence}>%{Math.round(result.confidence * 100)} Doğruluk</Text>
                </View>
              </View>

              <View style={styles.recBox}>
                <Text style={styles.recTitle}>Öneri ve Tedavi:</Text>
                <Text style={styles.recText}>{result.recommendation}</Text>
              </View>

              <TouchableOpacity style={styles.newBtn} onPress={reset}>
                <Text style={styles.newBtnText}>Yeni Analiz Yap</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f9fafb', padding: 20 },
  uploadArea: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 32, borderStyle: 'dashed', borderWidth: 2, borderColor: '#d1d5db' },
  iconCircle: { width: 90, height: 90, backgroundColor: '#f0fdf4', borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  subtitle: { textAlign: 'center', color: '#6b7280', marginBottom: 32, lineHeight: 22 },
  btnPrimary: { flexDirection: 'row', backgroundColor: '#16a34a', width: '100%', padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12, elevation: 2 },
  btnSecondary: { flexDirection: 'row', backgroundColor: '#fff', width: '100%', padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#16a34a' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 32, gap: 8, opacity: 0.7 },
  infoText: { color: '#6b7280', fontSize: 13, fontWeight: '500' },

  resultArea: { flex: 1 },
  imageContainer: { height: 350, borderRadius: 24, overflow: 'hidden', marginBottom: 24, backgroundColor: '#e5e7eb', position: 'relative', elevation: 3 },
  previewImage: { width: '100%', height: '100%' },
  closeBtn: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 16, fontWeight: 'bold', fontSize: 16 },
  analyzeBtn: { flexDirection: 'row', backgroundColor: '#16a34a', padding: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 3 },

  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, borderLeftWidth: 6, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  cardGreen: { borderLeftColor: '#22c55e' },
  cardRed: { borderLeftColor: '#ef4444' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  diseaseName: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  confidence: { color: '#6b7280', fontSize: 14, fontWeight: '600', marginTop: 2 },
  recBox: { backgroundColor: '#f3f4f6', padding: 16, borderRadius: 16, marginBottom: 20 },
  recTitle: { fontWeight: 'bold', color: '#111', marginBottom: 8, fontSize: 15 },
  recText: { color: '#374151', lineHeight: 22, fontSize: 15 },
  newBtn: { padding: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, alignItems: 'center', backgroundColor: '#fafafa' },
  newBtnText: { color: '#4b5563', fontWeight: 'bold', fontSize: 15 }
});