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
  Keyboard,
  StatusBar,
  Image // <--- 1. Image import edildi
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native'; // Tractor kaldırıldı
import { loginUser } from '../services/apiService';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Uyarı", "Lütfen e-posta ve şifrenizi giriniz.");
      return;
    }

    setLoading(true);
    try {
      await loginUser(email, password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error: any) {
      const message = error.message === 'Network request failed'
        ? 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.'
        : 'Giriş yapılamadı. E-posta veya şifre hatalı olabilir.';

      Alert.alert("Giriş Başarısız", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

            <View style={styles.content}>
              {/* Logo Alanı */}
              <View style={styles.headerContainer}>
                <View style={styles.iconContainer}>
                  {/* 2. Traktör yerine Logo Resmi */}
                  <Image
                    source={require('../../assets/icon.png')}
                    style={styles.logoImage}
                  />
                </View>
                <Text style={styles.title}>Hoş Geldiniz</Text>
                <Text style={styles.subtitle}>Güvenli Çiftçi Asistanınız</Text>
              </View>

              {/* Form Alanı */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>E-posta</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ornek@email.com"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Şifre</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="••••••"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                      hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
                    >
                      {showPassword ? (
                        <EyeOff size={22} color="#6b7280" />
                      ) : (
                        <Eye size={22} color="#6b7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Giriş Yap</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Kayıt Ol Linki */}
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>Hesabınız yok mu? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.registerLink}>Hemen Kayıt Olun</Text>
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
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { flex: 1, padding: 30, justifyContent: 'center' },

  headerContainer: { alignItems: 'center', marginBottom: 40 },
  iconContainer: {
    width: 110, // Biraz büyüttük
    height: 110,
    backgroundColor: '#fff', // Logo zemini beyaz olsun (PNG transparan değilse şık durur)
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    // Hafif gölge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6'
  },
  // 3. Logo Stili
  logoImage: {
    width: '70%',
    height: '70%',
    resizeMode: 'contain', // Resim bozulmadan sığsın
  },
  title: { fontSize: 30, fontWeight: '800', color: '#111827', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#6b7280', fontWeight: '500' },

  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginLeft: 4 },

  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    padding: 18,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500'
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    paddingHorizontal: 18,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500'
  },
  eyeIcon: {
    padding: 4,
  },

  button: {
    backgroundColor: '#16a34a',
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#86efac',
    shadowOpacity: 0.1,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32
  },
  registerText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '500'
  },
  registerLink: {
    color: '#16a34a',
    fontWeight: '700',
    fontSize: 15
  }
});