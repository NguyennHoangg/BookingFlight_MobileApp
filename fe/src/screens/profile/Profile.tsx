import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
      <Text className="text-4xl mb-3">👤</Text>
      <Text className="text-slate-800 font-bold text-lg">Tài khoản</Text>
      <Text className="text-slate-400 text-sm mt-1">Đang phát triển...</Text>
    </SafeAreaView>
  );
}
