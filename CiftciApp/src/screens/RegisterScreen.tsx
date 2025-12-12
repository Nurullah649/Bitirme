import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { UserPlus, ArrowLeft } from 'lucide-react-native';
import { registerUser } from '../services/apiService';

export default function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Basit Validasyon
    if (!formData.email || !formData.password || !formData.firstName) {
      Alert.alert("Eksik Bilgi", "Lütfen en az Ad, E-posta ve Şifre alanlarını doldurun.");
      return;
    }

    setLoading(true);
    try {
      await registerUser(formData);
      Alert.alert(
        "Kayıt Başarılı",
        "Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.",
        [{ text: "Giriş Yap", onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      // Hata mesajını backend'den veya genel hatadan al
      const msg = error.message || "Kayıt işlemi başarısız.";
      Alert.alert("Hata", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Geri Dön Butonu */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>

            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <UserPlus size={40} color="#16a34a" />
              </View>
              <Text style={styles.title}>Hesap Oluştur</Text>
              <Text style={styles.subtitle}>Çiftçi Asistanına Katılın</Text>

              <View style={styles.form}>
                <View style={styles.row}>
                    <View style={{flex:1, marginRight:8}}>
                        <Text style={styles.label}>Ad</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="Ali"
                        placeholderTextColor="#9ca3af"
                        value={formData.firstName}
                        onChangeText={(t) => setFormData({...formData, firstName: t})}
                        />
                    </View>
                    <View style={{flex:1, marginLeft:8}}>
                        <Text style={styles.label}>Soyad</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="Yılmaz"
                        placeholderTextColor="#9ca3af"
                        value={formData.lastName}
                        onChangeText={(t) => setFormData({...formData, lastName: t})}
                        />
                    </View>
                </View>

                <Text style={styles.label}>E-posta</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ornek@email.com"
                  placeholderTextColor="#9ca3af"
                  value={formData.email}
                  onChangeText={(t) => setFormData({...formData, email: t})}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={styles.label}>Şifre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(t) => setFormData({...formData, password: t})}
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Kayıt Ol</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Giriş Yap</Text>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  backBtn: { marginBottom: 20 },
  content: { flex: 1, justifyContent: 'center' },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#dcfce7',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'center'
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 32, textAlign: 'center' },
  form: { gap: 16 },
  row: { flexDirection: 'row' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937'
  },
  button: {
    backgroundColor: '#16a34a',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  buttonDisabled: { backgroundColor: '#86efac' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { color: '#6b7280', fontSize: 15 },
  loginLink: { color: '#16a34a', fontWeight: 'bold', fontSize: 15 }
});