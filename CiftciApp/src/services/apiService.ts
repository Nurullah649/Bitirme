import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisResult, WeatherData } from '../types';

// Sunucunun IP Adresi
const API_BASE_URL = "http://78.135.85.128";

// --- YARDIMCI: TOKEN AL ---
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// --- KİMLİK DOĞRULAMA ---
export const loginUser = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Giriş başarısız');
  }

  const data = await response.json();
  await AsyncStorage.setItem('token', data.access_token);
  return data;
};

// --- PROFİL İŞLEMLERİ ---
export const getUserProfile = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/auth/profile`, { headers });

  if (!response.ok) throw new Error('Profil alınamadı');
  return await response.json();
};

export const updateUserProfile = async (data: { firstName: string, lastName: string, location: string }) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      first_name: data.firstName,
      last_name: data.lastName,
      location: data.location
    }),
  });

  if (!response.ok) throw new Error('Profil güncellenemedi');
  return await response.json();
};

// --- SOHBET GEÇMİŞİ ---
export const getChatHistory = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/chat/history`, { headers });

  if (!response.ok) throw new Error('Geçmiş alınamadı');
  return await response.json();
};

// --- AKILLI ASİSTAN (CHAT) ---
export const sendMessageToAI = async (question: string, lat?: number | null, lon?: number | null) => {
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question,
        lat: lat || null,
        lon: lon || null
      }),
    });

    if (!response.ok) throw new Error('Cevap alınamadı');
    return await response.text(); // Backend düz metin dönüyor
  } catch (error) {
    console.error("API Hatası:", error);
    throw error;
  }
};

// --- ANA EKRAN İÇİN HAVA DURUMU ---
export const getWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Hava durumu alınamadı');
    return await response.json();
  } catch (error) {
    console.error("Hava Durumu Hatası:", error);
    return {
      temp: 0,
      condition: 'Veri Yok',
      humidity: 0,
      wind: 0,
      location: 'Konum Bulunamadı'
    };
  }
};

// --- GÖRÜNTÜ ANALİZİ (MOCK) ---
export const uploadImageForAnalysis = async (imageUri: string): Promise<AnalysisResult> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const isHealthy = Math.random() > 0.5;

  return {
    id: Date.now().toString(),
    imageUri: imageUri,
    timestamp: new Date().toISOString(),
    diseaseName: isHealthy ? "Sağlıklı Bitki" : "Septoria Yaprak Lekesi",
    confidence: 0.94,
    recommendation: isHealthy
      ? "Bitkiniz gayet sağlıklı görünüyor. Düzenli bakıma devam edin."
      : "Mantar kaynaklı bir hastalık belirtisi. Fungisit uygulaması önerilir.",
    status: isHealthy ? 'healthy' : 'critical'
  };
};