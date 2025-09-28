// App.tsx dosyasının son hali
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Features } from './components/Features';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="auto" />
        
        {/* Header'ımız en üstte sabit kalacak */}
        <Header />

        {/* Geri kalan içerik kaydırılabilir olacak */}
        <ScrollView>
          <Hero />
          <Features />
          {/* Buraya daha sonra diğer bileşenler (Chat, Footer vb.) gelecek */}
        </ScrollView>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}