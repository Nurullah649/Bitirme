import React from 'react';
import { View, Text } from 'react-native';
import { Cloud, Bug, BarChart3, Calendar, MapPin, Smartphone, Leaf } from 'lucide-react-native';

const features = [
  { icon: Cloud, title: "Hava Durumu Analizi", description: "Gelişmiş meteoroloji verileri ile 7 günlük detaylı hava durumu tahmini." },
  { icon: Bug, title: "Hastalık Tespiti", description: "Yapay zeka ile bitki hastalıklarını erken tespit edin ve etkili tedavi önerileri alın." },
  { icon: BarChart3, title: "Verim Analizi", description: "Geçmiş veriler ve AI modelleri ile mahsul veriminizi optimize edin." },
];

export function Features() {
  return (
    <View className="w-full bg-white py-16 px-4">
      <View className="text-center mb-12">
        <View className="mb-4 flex-row justify-center">
          <View className="flex-row items-center gap-2 rounded-full bg-green-100 px-4 py-2">
            <Leaf className="text-green-700" size={16} />
            <Text className="text-sm font-medium text-green-700">Özellikler</Text>
          </View>
        </View>
        <Text className="text-3xl font-bold tracking-tight text-center text-gray-900">Tarımsal Başarınız İçin<Text className="text-green-600"> Akıllı Araçlar</Text></Text>
      </View>
      <View className="flex-col gap-6">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <View key={index} className="bg-gray-50/70 border border-gray-200 rounded-xl p-6">
              <View className="mb-4">
                <View className="h-12 w-12 items-center justify-center rounded-lg bg-green-100 mb-3">
                  <IconComponent className="text-green-600" size={24} />
                </View>
                <Text className="text-xl font-semibold text-gray-900">{feature.title}</Text>
              </View>
              <View>
                <Text className="text-base leading-relaxed text-gray-600">{feature.description}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}