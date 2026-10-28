import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function CheckinScreen() {
  const [bookingCode, setBookingCode] = useState('');
  const [passengerLastName, setPassengerLastName] = useState('');

  const handleCheckin = () => {
    // Xử lý tra cứu check-in
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["left", "right"]}>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-5 pt-5"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Card giới thiệu */}
          <View className="bg-[#2563EB] rounded-2xl p-5 mb-5 shadow-sm">
            <View className="flex-row items-center mb-2">
              <MaterialCommunityIcons name="airplane-check" size={24} color="#93C5FD" />
              <Text className="text-white font-bold text-base ml-2">
                Làm thủ tục trực tuyến nhanh chóng
              </Text>
            </View>
            <Text className="text-blue-100 text-xs leading-5">
              Tiết kiệm thời gian tại sân bay. Mở trước 24 giờ và đóng 60 phút trước giờ khởi hành dự kiến.
            </Text>
          </View>

          {/* Form nhập thông tin tra cứu */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
            <Text className="text-gray-900 font-bold text-base mb-4">
              Thông tin chuyến bay
            </Text>

            {/* Mã đặt chỗ (PNR) */}
            <View className="mb-4">
              <Text className="text-gray-600 text-xs font-semibold uppercase mb-1.5">
                Mã đặt chỗ (PNR) hoặc Số vé
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl px-3.5 py-3 bg-gray-50 focus:border-blue-500">
                <Ionicons name="barcode-outline" size={20} color="#6B7280" />
                <TextInput
                  value={bookingCode}
                  onChangeText={(text) => setBookingCode(text.toUpperCase())}
                  placeholder="Ví dụ: VNA889, ABCDEF"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  className="flex-1 ml-2.5 text-gray-900 font-semibold text-sm"
                />
              </View>
            </View>

            {/* Họ của hành khách */}
            <View className="mb-6">
              <Text className="text-gray-600 text-xs font-semibold uppercase mb-1.5">
                Họ của hành khách
              </Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl px-3.5 py-3 bg-gray-50 focus:border-blue-500">
                <Ionicons name="person-outline" size={20} color="#6B7280" />
                <TextInput
                  value={passengerLastName}
                  onChangeText={setPassengerLastName}
                  placeholder="Ví dụ: NGUYEN"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  className="flex-1 ml-2.5 text-gray-900 font-semibold text-sm"
                />
              </View>
            </View>

            {/* Nút Check-in */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCheckin}
              className="bg-[#2563EB] rounded-xl py-3.5 items-center justify-center flex-row shadow-sm shadow-blue-300"
            >
              <Ionicons name="search" size={18} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                Tìm kiếm đặt chỗ
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quy định & Hướng dẫn */}
          <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <Text className="text-gray-900 font-bold text-sm mb-3">
              Quy định làm thủ tục trực tuyến
            </Text>

            <View className="flex-row items-start mb-2.5">
              <Ionicons name="time-outline" size={16} color="#2563EB" className="mt-0.5" />
              <Text className="text-gray-600 text-xs ml-2 flex-1 leading-5">
                Áp dụng từ 24 tiếng đến 60 phút trước giờ khởi hành đối với chuyến bay nội địa.
              </Text>
            </View>

            <View className="flex-row items-start mb-2.5">
              <Ionicons name="phone-portrait-outline" size={16} color="#2563EB" className="mt-0.5" />
              <Text className="text-gray-600 text-xs ml-2 flex-1 leading-5">
                Thẻ lên máy bay điện tử (e-Boarding Pass) được gửi về email và lưu trong ứng dụng.
              </Text>
            </View>

            <View className="flex-row items-start">
              <Ionicons name="bag-handle-outline" size={16} color="#2563EB" className="mt-0.5" />
              <Text className="text-gray-600 text-xs ml-2 flex-1 leading-5">
                Nếu không có hành lý ký gửi, bạn có thể đến thẳng cửa kiểm tra an ninh tại sân bay.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
