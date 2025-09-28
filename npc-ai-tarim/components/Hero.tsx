import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sprout, Users, TrendingUp, ArrowRight } from 'lucide-react-native';

export function Hero() {
  return (
    <View className="w-full bg-gray-50 py-16 px-4">
      <View className="items-center text-center">
        <View className="mb-8 items-center justify-center">
          <View className="flex-row items-center gap-2 rounded-full bg-green-200 px-4 py-2">
            <Sprout className="text-green-800" size={16} />
            <Text className="text-sm font-medium text-green-800">Yapay Zeka Destekli Tarım Çözümleri</Text>
          </View>
        </View>
        <Text className="mb-6 text-4xl font-bold tracking-tight text-center text-gray-900">
          Tarımda <Text className="text-green-600">Geleceği</Text> Keşfedin
        </Text>
        <Text className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 text-center">
          ÇiftçiAI ile mahsul yönetiminden hastalık tespitine, tüm tarımsal ihtiyaçlarınız için akıllı çözümler.
        </Text>
        <View className="flex-col gap-4 w-full">
          <TouchableOpacity className="flex-row items-center justify-center h-12 px-6 bg-green-600 rounded-md">
            <Text className="text-base text-white font-medium">Hemen Başla</Text>
            <ArrowRight className="ml-2 text-white" size={16} />
          </TouchableOpacity>
          <TouchableOpacity className="h-12 px-6 bg-transparent border border-gray-300 rounded-md items-center justify-center">
            <Text className="text-base text-gray-800 font-medium">Demo İzle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}