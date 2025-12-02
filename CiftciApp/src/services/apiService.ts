import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AnalysisResult, WeatherData, Task } from '../types';

// GÜVENLİK NOTU:
// Gerçek sunucunuzun IP adresini kullanıyoruz.
// Android emülatör için 10.0.2.2, fiziksel cihaz için bilgisayarınızın yerel IP'si (örn: 192.168.1.X) veya sunucu IP'si gerekir.
// Şu anki ayar: 78.135.85.128
const API_BASE_URL = "http://78.135.85.128";

const TOKEN_KEY = 'auth_token';

// --- GÜVENLİ DEPOLAMA YARDIMCILARI ---
async function saveToken(token: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
}

async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken() {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

// --- YARDIMCI: HEADER OLUŞTURMA ---
const getAuthHeaders = async () => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// --- HATA YÖNETİMİ ---
const handleApiError = async (response: Response, endpointName: string) => {
  if (!response.ok) {
    console.log(`API Hatası (${endpointName}):`, response.status);
    if (response.status === 401) {
      await removeToken();
      throw new Error('Oturum süresi doldu.');
    }
    const text = await response.text();
    try {
        const json = JSON.parse(text);
        throw new Error(json.detail || `Sunucu hatası: ${response.status}`);
    } catch (e) {
        throw new Error(`Sunucu hatası (${response.status})`);
    }
  }
  return response.json();
};

// --- KİMLİK DOĞRULAMA ---
export const loginUser = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleApiError(response, 'Login');
  if (data.access_token) {
    await saveToken(data.access_token);
  }
  return data;
};

export const logoutUser = async () => {
  await removeToken();
};

export const deleteMyAccount = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'DELETE',
    headers
  });
  return await handleApiError(response, 'DeleteAccount');
};

// --- PROFİL ---
export const getUserProfile = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/auth/profile`, { headers });
  return await handleApiError(response, 'GetProfile');
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
  return await handleApiError(response, 'UpdateProfile');
};

// --- GÖREV (PLAN) YÖNETİMİ ---
export const getTasks = async (): Promise<Task[]> => {
  const headers = await getAuthHeaders();
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, { headers });
    return await handleApiError(response, 'GetTasks');
  } catch (error) {
    console.log("Görev çekme hatası:", error);
    // Hata durumunda boş dizi dön ki uygulama çökmesin
    return [];
  }
};

export const updateTaskStatus = async (taskId: number, status: 'approved' | 'completed') => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status })
  });
  return await handleApiError(response, 'UpdateTask');
};

export const deleteTask = async (taskId: number) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers
  });
  return await handleApiError(response, 'DeleteTask');
};

// --- SOHBET VE AI ---
export const getChatHistory = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/chat/history`, { headers });
  return await handleApiError(response, 'ChatHistory');
};

export const clearChatHistory = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/chat/history`, {
    method: 'DELETE',
    headers
  });
  return await handleApiError(response, 'ClearChatHistory');
};

export const sendMessageToAI = async (question: string, lat?: number | null, lon?: number | null) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      question,
      lat: lat || null,
      lon: lon || null
    })
  });

  if (!response.ok) {
      throw new Error(`API Hatası: ${response.status}`);
  }
  // Backend PlainTextResponse dönüyor
  return await response.text();
};

export const getWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}`);
    if (!response.ok) throw new Error("Hava durumu alınamadı");
    return await response.json();
  } catch (error) {
    return {
      temp: 0,
      condition: 'Veri Yok',
      humidity: 0,
      wind: 0,
      location: 'Hata'
    };
  }
};

export const uploadImageForAnalysis = async (imageUri: string): Promise<AnalysisResult> => {
  // Mock implementation for analysis
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    id: Date.now().toString(),
    imageUri,
    timestamp: new Date().toISOString(),
    diseaseName: "Sağlıklı Bitki",
    confidence: 0.98,
    recommendation: "Bitkiniz sağlıklı görünüyor.",
    status: 'healthy'
  };
};

// --- BİLDİRİM (PUSH TOKEN) KAYDETME ---
export const savePushToken = async (pushToken: string) => {
  const headers = await getAuthHeaders();
  try {
    // Backend endpoint: /auth/save-push-token
    // Beklenen JSON formatı: { "token": "..." }
    const response = await fetch(`${API_BASE_URL}/auth/save-push-token`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token: pushToken }),
    });

    return await handleApiError(response, 'SavePushToken');
  } catch (error) {
    console.log("Token sunucuya kaydedilemedi:", error);
    // Hata olsa bile uygulamayı durdurmuyoruz
  }
};