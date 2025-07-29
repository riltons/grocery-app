import React from 'react';
import { View, Text } from 'react-native';

export default function TestNativeWind() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-blue-500">
        NativeWind está funcionando!
      </Text>
      <Text className="text-lg text-gray-700 mt-4">
        Se você estiver vendo este texto com estilos, o NativeWind está configurado corretamente.
      </Text>
    </View>
  );
}
