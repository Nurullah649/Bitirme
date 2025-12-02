import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ScanLine, MessageSquare } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';

// Ekranları Import Et
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ChatScreen from './src/screens/ChatScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ChatHistoryScreen from './src/screens/ChatHistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';

// --- 1. BİLDİRİM YÖNETİCİSİ AYARI ---
// Uygulama açıkken bildirim gelirse nasıl davranılacağını belirler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
        tabBarStyle: { height: 65, paddingBottom: 10, paddingTop: 10 }
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />
        }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{
          tabBarLabel: 'Analiz',
          tabBarIcon: ({ color }) => <ScanLine size={24} color={color} />
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: 'Asistan',
          tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  // NOT: Token alma ve sunucuya kaydetme işlemini "DashboardScreen.tsx" içine taşıdık.
  // Bu dosya artık sadece navigasyon yapısını kurmaktan sorumlu.

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Schedule" component={ScheduleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}