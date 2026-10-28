import { navigate } from "../../navigation/routes";
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";

// Mock data dựa trên schema Prisma (bảng Flight, Airline, Airport, FareClass)
const INITIAL_FAVORITES = [
  {
    id: "f-1",
    airline: { code: "VN", name: "Vietnam Airlines" },
    flightNumber: "VN123",
    aircraft: "Airbus A321",
    type: "Bay thẳng",
    departure: { time: "08:30", code: "SGN", name: "Tân Sơn Nhất" },
    arrival: { time: "10:40", code: "HAN", name: "Nội Bài" },
    duration: "2g 10p",
    statusTag: "Đúng giờ",
    statusColor: "text-blue-600",
    date: "Thứ Tư, 18/11/2026",
    baggage: "23kg ký gửi",
    meal: "Suất ăn",
    price: 1850000,
    originalPrice: 2000000,
    alertTag: "Giá đang giảm • Tiết kiệm 150.000 ₫",
    alertColor: "bg-emerald-50 text-emerald-700",
    alertIcon: "trending-down",
    alertIconColor: "#059669",
  },
  {
    id: "f-2",
    airline: { code: "QH", name: "Bamboo Airways" },
    flightNumber: "QH244",
    aircraft: "Embraer 190",
    type: "Bay thẳng",
    departure: { time: "11:20", code: "SGN", name: "Tân Sơn Nhất" },
    arrival: { time: "13:30", code: "HAN", name: "Nội Bài" },
    duration: "2g 10p",
    statusTag: "Hạng Phổ thông",
    statusColor: "text-gray-500",
    date: "Thứ Tư, 18/11/2026",
    baggage: "20kg ký gửi",
    meal: "7kg xách tay",
    price: 1720000,
    originalPrice: null,
    alertTag: "Chỉ còn 3 vé giá này",
    alertColor: "bg-amber-50 text-amber-700",
    alertIcon: "time-outline",
    alertIconColor: "#D97706",
  },
  {
    id: "f-3",
    airline: { code: "VJ", name: "Vietjet Air" },
    flightNumber: "VJ168",
    aircraft: "Airbus A321",
    type: "Bay thẳng",
    departure: { time: "06:15", code: "SGN", name: "Tân Sơn Nhất" },
    arrival: { time: "08:25", code: "HAN", name: "Nội Bài" },
    duration: "2g 10p",
    statusTag: "Eco Tiết kiệm",
    statusColor: "text-gray-500",
    date: "Thứ Tư, 18/11/2026",
    baggage: "7kg xách tay",
    meal: "Hỗ trợ đổi ngày",
    price: 1340000,
    originalPrice: null,
    alertTag: "Giá rẻ nhất trong ngày",
    alertColor: "bg-blue-50 text-blue-700",
    alertIcon: "pricetag-outline",
    alertIconColor: "#2563EB",
  },
];

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState(INITIAL_FAVORITES);

  const toggleFavorite = (flightId: string) => {
    setFavorites((prev) => prev.filter((flight) => flight.id !== flightId));
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN") + " ₫";
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["left", "right"]}>

      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* TITLE SECTION */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-black text-gray-900 tracking-tight">
              Chuyến bay yêu thích
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Theo dõi và nhận ưu đãi mới nhất
            </Text>
          </View>
          <View className="bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-blue-700">
              {favorites.length} chuyến
            </Text>
          </View>
        </View>

        {/* INFO BANNER */}
        <View className="bg-blue-50/70 rounded-2xl p-4 flex-row items-start mb-5 border border-blue-100">
          <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mt-0.5">
            <Ionicons name="notifications" size={16} color="#2563EB" />
          </View>
          <Text className="flex-1 ml-3 text-xs text-gray-600 font-medium leading-5">
            Theo dõi biến động giá và nhận thông báo ngay khi có ưu đãi cho các chuyến bay bạn quan tâm.
          </Text>
        </View>

        {/* LIST FAVORITES */}
        {favorites.map((flight) => (
          <View
            key={flight.id}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-5 overflow-hidden"
          >
            {/* Top Area: Alert Tag & Favorite Icon */}
            <View className="flex-row justify-between items-center p-4 pb-0">
              <View
                className={`flex-row items-center px-2.5 py-1 rounded-lg ${flight.alertColor}`}
              >
                <Ionicons
                  name={flight.alertIcon as any}
                  size={14}
                  color={flight.alertIconColor}
                />
                <Text className="text-xs font-bold ml-1.5">
                  {flight.alertTag}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleFavorite(flight.id)}
                className="w-8 h-8 rounded-full bg-red-50 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="heart" size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>

            {/* Airline Info */}
            <View className="flex-row justify-between items-center px-4 mt-3">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 items-center justify-center">
                  <Text className="font-black text-blue-600 text-xs">
                    {flight.airline.code}
                  </Text>
                </View>
                <View className="ml-3">
                  <Text className="font-bold text-gray-900 text-sm">
                    {flight.airline.name}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {flight.flightNumber} • {flight.aircraft}
                  </Text>
                </View>
              </View>
              <View className="bg-gray-100 px-2.5 py-1 rounded-md">
                <Text className="text-[11px] font-semibold text-gray-600">
                  {flight.type}
                </Text>
              </View>
            </View>

            {/* Time & Route (Tuyến bay) */}
            <View className="flex-row justify-between items-center px-4 mt-4">
              <View className="items-start flex-1">
                <Text className="text-2xl font-black text-gray-900">
                  {flight.departure.time}
                </Text>
                <Text className="font-bold text-blue-600 text-sm mt-0.5">
                  {flight.departure.code}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                  {flight.departure.name}
                </Text>
              </View>

              <View className="px-3 items-center justify-center">
                <Text className="text-[11px] text-gray-400 mb-1 font-semibold">
                  {flight.duration}
                </Text>
                <View className="flex-row items-center w-20">
                  <View className="h-[2px] bg-blue-100 flex-1 rounded-full" />
                  <Ionicons
                    name="airplane"
                    size={16}
                    color="#2563EB"
                    className="mx-1"
                  />
                  <View className="h-[2px] bg-blue-100 flex-1 rounded-full" />
                </View>
                <Text className="text-[10px] font-bold text-emerald-600 mt-1">
                  {flight.statusTag}
                </Text>
              </View>

              <View className="items-end flex-1">
                <Text className="text-2xl font-black text-gray-900">
                  {flight.arrival.time}
                </Text>
                <Text className="font-bold text-blue-600 text-sm mt-0.5">
                  {flight.arrival.code}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                  {flight.arrival.name}
                </Text>
              </View>
            </View>

            {/* Sub Info: Date & Services */}
            <View className="flex-row items-center justify-between px-4 mt-4 mb-3 pt-3 border-t border-gray-50">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text className="text-xs text-gray-600 ml-1.5 font-medium">
                  {flight.date}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-xs text-gray-600 font-medium">
                  {flight.baggage}
                </Text>
                <View className="w-1 h-1 rounded-full bg-gray-300 mx-2" />
                <Text className="text-xs text-gray-600 font-medium">
                  {flight.meal}
                </Text>
              </View>
            </View>

            {/* Dotted Notch Cutout Divider */}
            <View className="relative w-full h-4 justify-center overflow-hidden">
              <View className="w-full border-t border-dashed border-gray-200" />
            </View>

            {/* Bottom: Price & Button */}
            <View className="flex-row items-center justify-between p-4 pt-2 bg-gray-50/50">
              <View>
                <Text className="text-xl font-black text-blue-600">
                  {formatCurrency(flight.price)}
                </Text>
                <View className="flex-row items-center mt-0.5">
                  {flight.originalPrice && (
                    <Text className="text-xs text-gray-400 line-through mr-1">
                      {formatCurrency(flight.originalPrice)}
                    </Text>
                  )}
                  <Text className="text-xs text-gray-500">/ khách</Text>
                </View>
              </View>

              <TouchableOpacity
                className="bg-blue-600 px-4 py-2.5 rounded-xl flex-row items-center shadow-sm"
                activeOpacity={0.8}
                onPress={() =>
                  navigate("FlightDetail", {
                    flightId: flight.id,
                  })
                }
              >
                <Text className="font-bold text-white mr-1 text-sm">
                  Xem chi tiết
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {favorites.length === 0 && (
          <View className="items-center justify-center py-20 mt-6">
            <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-3">
              <Ionicons name="heart-dislike-outline" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-base font-bold text-gray-700">
              Chưa có chuyến bay yêu thích
            </Text>
            <Text className="text-xs text-gray-400 mt-1 text-center px-10">
              Hãy bấm vào biểu tượng trái tim ở danh sách chuyến bay để lưu lại đây
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
