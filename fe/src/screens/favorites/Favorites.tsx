import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Mock data dựa trên schema Prisma (bảng Flight, Airline, Airport, FareClass)
const INITIAL_FAVORITES = [
  {
    id: 'f-1',
    airline: { code: 'VN', name: 'Vietnam Airlines' },
    flightNumber: 'VN123',
    aircraft: 'Airbus A321',
    type: 'Bay thẳng',
    departure: { time: '08:30', code: 'SGN', name: 'Tân Sơn Nhất' },
    arrival: { time: '10:40', code: 'HAN', name: 'Nội Bài' },
    duration: '2g 10p',
    statusTag: 'Đúng giờ',
    statusColor: 'text-blue-600',
    date: 'Thứ Tư, 18/11/2026',
    baggage: '23kg ký gửi',
    meal: 'Suất ăn',
    price: 1850000,
    originalPrice: 2000000,
    alertTag: 'Giá đang giảm • Tiết kiệm 150.000 ₫',
    alertColor: 'bg-emerald-50 text-emerald-600',
    alertIcon: 'trending-down'
  },
  {
    id: 'f-2',
    airline: { code: 'QH', name: 'Bamboo Airways' },
    flightNumber: 'QH244',
    aircraft: 'Embraer 190',
    type: 'Bay thẳng',
    departure: { time: '11:20', code: 'SGN', name: 'Tân Sơn Nhất' },
    arrival: { time: '13:30', code: 'HAN', name: 'Nội Bài' },
    duration: '2g 10p',
    statusTag: 'Hạng Phổ thông',
    statusColor: 'text-gray-500',
    date: 'Thứ Tư, 18/11/2026',
    baggage: '20kg ký gửi',
    meal: '7kg xách tay',
    price: 1720000,
    originalPrice: null,
    alertTag: 'Chỉ còn 3 vé giá này',
    alertColor: 'bg-orange-50 text-orange-600',
    alertIcon: 'time-outline'
  },
  {
    id: 'f-3',
    airline: { code: 'VJ', name: 'Vietjet Air' },
    flightNumber: 'VJ168',
    aircraft: 'Airbus A321',
    type: 'Bay thẳng',
    departure: { time: '06:15', code: 'SGN', name: 'Tân Sơn Nhất' },
    arrival: { time: '08:25', code: 'HAN', name: 'Nội Bài' },
    duration: '2g 10p',
    statusTag: 'Eco Tiết kiệm',
    statusColor: 'text-gray-500',
    date: 'Thứ Tư, 18/11/2026',
    baggage: '7kg xách tay',
    meal: 'Hỗ trợ đổi ngày',
    price: 1340000,
    originalPrice: null,
    alertTag: 'Giá rẻ nhất trong ngày',
    alertColor: 'bg-blue-50 text-blue-600',
    alertIcon: 'pricetag-outline'
  }
];

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const [favorites, setFavorites] = useState(INITIAL_FAVORITES);

  const toggleFavorite = (flightId: string) => {
    // Nếu bấm vào icon tim, sẽ loại bỏ chuyến bay khỏi danh sách yêu thích
    setFavorites(favorites.filter(flight => flight.id !== flightId));
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    // 1. Đổi SafeAreaView thành View
    <View className="flex-1 bg-[#F9FAFB]">
      {/* HEADER: App Logo & Notification */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-2 bg-white">
        <View className="flex-row items-center">
          {/* Logo ứng dụng từ assets */}
          <Image 
            source={require('../../../../fe/assets/Splash_icon.png')} 
            className="max-w-12 max-h-12"
            resizeMode="cover"
          />
          <Text className="text-xl font-bold text-[#2563EB] ml-2">SkyJourney</Text>
        </View>
        <TouchableOpacity className="relative p-2">
          <Ionicons name="notifications-outline" size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {/* 2. Thêm contentContainerStyle vào ScrollView */}
      <ScrollView 
        className="flex-1 px-5 pt-2" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        
        {/* TITLE SECTION */}
        <View className="flex-row items-end justify-between mt-2 mb-4">
          <Text className="text-2xl font-extrabold text-gray-900">Chuyến bay yêu thích</Text>
          <View className="bg-blue-100 px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-blue-700">{favorites.length} chuyến</Text>
          </View>
        </View>

        {/* INFO BANNER */}
        <View className="bg-blue-50/50 rounded-2xl p-4 flex-row items-start mb-6 border border-blue-100">
          <Ionicons name="notifications" size={20} color="#3B82F6" className="mt-0.5" />
          <Text className="flex-1 ml-3 text-sm text-gray-600 font-medium leading-5">
            Theo dõi biến động giá và nhận thông báo khi có ưu đãi cho các chuyến bay bạn quan tâm.
          </Text>
        </View>

        {/* LIST FAVORITES */}
        {favorites.map((flight) => (
          <View key={flight.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
            
            {/* Top Area: Alert Tag & Favorite Icon */}
            <View className="flex-row justify-between items-center p-4 pb-0">
              <View className={`flex-row items-center px-2 py-1 rounded-lg ${flight.alertColor}`}>
                <Ionicons name={flight.alertIcon as any} size={14} color="currentColor" />
                <Text className="text-xs font-bold ml-1">{flight.alertTag}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleFavorite(flight.id)} className="p-1">
                <Ionicons name="heart" size={24} color="#DC2626" />
              </TouchableOpacity>
            </View>

            {/* Airline Info */}
            <View className="flex-row justify-between items-center px-4 mt-3">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded bg-blue-50 border border-blue-100 items-center justify-center">
                  <Text className="font-bold text-blue-600 text-xs">{flight.airline.code}</Text>
                </View>
                <View className="ml-3">
                  <Text className="font-bold text-gray-900">{flight.airline.name}</Text>
                  <Text className="text-xs text-gray-500">{flight.flightNumber} • {flight.aircraft}</Text>
                </View>
              </View>
              <Text className="text-xs font-medium text-gray-500">{flight.type}</Text>
            </View>

            {/* Time & Route (Tuyến bay) */}
            <View className="flex-row justify-between items-center px-4 mt-5">
              <View className="items-start">
                <Text className="text-xl font-black text-gray-900">{flight.departure.time}</Text>
                <Text className="font-bold text-blue-600 text-base">{flight.departure.code}</Text>
                <Text className="text-xs text-gray-500">{flight.departure.name}</Text>
              </View>

              <View className="flex-1 px-4 items-center justify-center">
                <Text className="text-[10px] text-gray-500 mb-1 font-medium">{flight.duration}</Text>
                <View className="flex-row items-center w-full">
                  <View className="h-[2px] bg-gray-200 flex-1 rounded-full" />
                  <Ionicons name="airplane" size={16} color="#3B82F6" className="mx-1" />
                  <View className="h-[2px] bg-gray-200 flex-1 rounded-full" />
                </View>
                <Text className={`text-[10px] font-bold mt-1 ${flight.statusColor}`}>{flight.statusTag}</Text>
              </View>

              <View className="items-end">
                <Text className="text-xl font-black text-gray-900">{flight.arrival.time}</Text>
                <Text className="font-bold text-blue-600 text-base">{flight.arrival.code}</Text>
                <Text className="text-xs text-gray-500">{flight.arrival.name}</Text>
              </View>
            </View>

            {/* Sub Info: Date & Services */}
            <View className="flex-row items-center justify-between px-4 mt-5 mb-4">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text className="text-xs text-gray-600 ml-1">Khởi hành: {flight.date}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-xs text-gray-600">{flight.baggage}</Text>
                <View className="w-1 h-1 rounded-full bg-gray-300 mx-2" />
                <Text className="text-xs text-gray-600">{flight.meal}</Text>
              </View>
            </View>

            {/* Dotted Divider */}
            <View className="relative w-full h-[1px] overflow-hidden my-1">
              <View className="absolute left-[-5px] top-[-5px] w-3 h-3 rounded-full bg-[#F9FAFB] z-10" />
              <View className="absolute right-[-5px] top-[-5px] w-3 h-3 rounded-full bg-[#F9FAFB] z-10" />
              <View className="w-full h-full border-t border-dashed border-gray-200" />
            </View>

            {/* Bottom: Price & Button */}
            <View className="flex-row items-center justify-between p-4 bg-gray-50/50">
              <View>
                <Text className="text-2xl font-black text-blue-600">{formatCurrency(flight.price)}</Text>
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
                className="bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-xl flex-row items-center"
                onPress={() => navigation.navigate('FlightDetail' as never, { flightId: flight.id } as never)}
              >
                <Text className="font-bold text-blue-600 mr-1 text-sm">Xem chi tiết</Text>
                <Ionicons name="chevron-forward" size={16} color="#2563EB" />
              </TouchableOpacity>
            </View>
            
          </View>
        ))}

        {favorites.length === 0 && (
          <View className="items-center justify-center py-20 mt-10">
            <Ionicons name="heart-dislike-outline" size={64} color="#D1D5DB" />
            <Text className="text-lg font-bold text-gray-400 mt-4">Chưa có chuyến bay yêu thích</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}