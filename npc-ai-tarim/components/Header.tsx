import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Leaf, Menu } from 'lucide-react-native';

export function Header() {
  return (
    <View className="w-full h-20 bg-white border-b border-gray-200 px-4 flex-row items-center justify-between pt-8">
      <View className="flex-row items-center gap-2">
        <View className="h-10 w-10 items-center justify-center rounded-lg bg-green-600">
          <Leaf className="text-white" size={24} />
        </View>
        <View>
          <Text className="text-lg font-bold text-gray-900">ÇiftçiAI</Text>
          <Text className="text-xs text-gray-500">Tarım Destek Asistanı</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        <TouchableOpacity className="h-8 bg-green-600 px-3 rounded-md items-center justify-center">
          <Text className="text-white text-sm font-medium">Başla</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Menu className="text-gray-700" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}