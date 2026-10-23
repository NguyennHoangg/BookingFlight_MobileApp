import "./global.css";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  const [departure, setDeparture] = useState("SGN - TP. Hồ Chí Minh");
  const [destination, setDestination] = useState("HAN - Hà Nội");

  const sampleFlights = [
    {
      id: "1",
      airline: "Vietnam Airlines",
      flightNumber: "VN-210",
      fromTime: "07:30",
      toTime: "09:45",
      duration: "2h 15m",
      price: "1.850.000 ₫",
      tag: "Phổ biến nhất",
      badgeColor: "bg-blue-600",
    },
    {
      id: "2",
      airline: "Vietjet Air",
      flightNumber: "VJ-152",
      fromTime: "11:00",
      toTime: "13:10",
      duration: "2h 10m",
      price: "1.250.000 ₫",
      tag: "Giá tốt nhất",
      badgeColor: "bg-red-500",
    },
    {
      id: "3",
      airline: "Bamboo Airways",
      flightNumber: "QH-204",
      fromTime: "14:00",
      toTime: "16:15",
      duration: "2h 15m",
      price: "1.690.000 ₫",
      tag: "Dịch vụ chuẩn 4*",
      badgeColor: "bg-emerald-600",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <StatusBar style="light" />

      {/* Header Banner */}
      <View className="bg-blue-600 pt-12 pb-8 px-5 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-xs font-semibold uppercase tracking-widest opacity-80">
              Flight Booking App
            </Text>
            <Text className="text-white text-2xl font-bold mt-1">
              Khám Phá Chuyến Bay
            </Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
            <Text className="text-white font-bold text-base">✈️</Text>
          </View>
        </View>

        {/* Quick Search Card */}
        <View className="bg-white rounded-2xl p-4 mt-6 shadow-md border border-slate-100">
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <View className="flex-1">
              <Text className="text-xs text-slate-400 font-medium">Điểm đi</Text>
              <TextInput
                value={departure}
                onChangeText={setDeparture}
                className="text-slate-800 font-bold text-base mt-1"
              />
            </View>
            <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mx-2">
              <Text className="text-blue-600 font-bold">⇄</Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-xs text-slate-400 font-medium">Điểm đến</Text>
              <TextInput
                value={destination}
                onChangeText={setDestination}
                className="text-slate-800 font-bold text-base mt-1 text-right"
              />
            </View>
          </View>

          <View className="flex-row justify-between items-center pt-3">
            <View>
              <Text className="text-xs text-slate-400">Ngày bay</Text>
              <Text className="text-slate-800 font-semibold text-sm mt-0.5">
                Hôm nay, 24 Th10
              </Text>
            </View>
            <TouchableOpacity className="bg-blue-600 px-5 py-2.5 rounded-xl shadow-sm">
              <Text className="text-white font-semibold text-sm">Tìm Chuyến</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Flight Results */}
      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-slate-800 font-bold text-lg">Chuyến bay gợi ý</Text>
          <Text className="text-blue-600 text-xs font-semibold">Xem tất cả</Text>
        </View>

        {sampleFlights.map((flight) => (
          <View
            key={flight.id}
            className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-200/60"
          >
            {/* Airline Header */}
            <View className="flex-row justify-between items-center pb-3 border-b border-slate-100">
              <View className="flex-row items-center">
                <Text className="text-slate-800 font-bold text-base">
                  {flight.airline}
                </Text>
                <Text className="text-slate-400 text-xs ml-2 font-medium">
                  {flight.flightNumber}
                </Text>
              </View>
              <View className={`${flight.badgeColor} px-2.5 py-0.5 rounded-full`}>
                <Text className="text-white text-[10px] font-semibold">
                  {flight.tag}
                </Text>
              </View>
            </View>

            {/* Flight Times & Route */}
            <View className="flex-row items-center justify-between py-4">
              <View>
                <Text className="text-slate-900 font-extrabold text-xl">
                  {flight.fromTime}
                </Text>
                <Text className="text-slate-400 text-xs font-medium">SGN</Text>
              </View>

              <View className="items-center flex-1 px-4">
                <Text className="text-slate-400 text-[11px] font-medium mb-1">
                  {flight.duration}
                </Text>
                <View className="w-full flex-row items-center">
                  <View className="h-[1.5px] bg-slate-300 flex-1" />
                  <Text className="text-blue-500 mx-1 text-xs">✈</Text>
                  <View className="h-[1.5px] bg-slate-300 flex-1" />
                </View>
                <Text className="text-emerald-600 text-[11px] font-medium mt-1">
                  Bay thẳng
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-slate-900 font-extrabold text-xl">
                  {flight.toTime}
                </Text>
                <Text className="text-slate-400 text-xs font-medium">HAN</Text>
              </View>
            </View>

            {/* Price & Book Action */}
            <View className="flex-row items-center justify-between pt-3 border-t border-slate-100">
              <View>
                <Text className="text-slate-400 text-[11px]">Giá mỗi hành khách</Text>
                <Text className="text-blue-600 font-extrabold text-lg">
                  {flight.price}
                </Text>
              </View>
              <TouchableOpacity className="bg-slate-900 px-4 py-2.5 rounded-xl">
                <Text className="text-white font-semibold text-xs">Chọn Vé</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
