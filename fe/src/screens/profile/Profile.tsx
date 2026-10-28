import { navigate } from "../../navigation/routes";
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../../hook/useAuth';

export default function ProfileScreen() {
  const { user, profile, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Tự động tải thông tin mới nhất khi vào trang
  useEffect(() => {
    profile();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await profile();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["left", "right"]}>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
        }
      >
        {/* The thong tin nguoi dung */}
        <View className="mx-5 mt-4 bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-5">
            <Image 
              source={user?.avatarUrl ? { uri: user.avatarUrl } : require('../../../assets/default_avt.jpg')}
              className="w-16 h-16 rounded-full"
            />
            <View className="ml-4 flex-1">
              <Text className="text-lg font-bold text-gray-900">{user?.fullName}</Text>
              <Text className="text-sm text-gray-500 mt-0.5">{user?.email}</Text>
              <Text className="text-sm text-gray-500">{user?.phone}</Text>
              <View className="bg-blue-50 px-3 py-1 rounded-full self-start mt-2 flex-row items-center border border-blue-100">
                <Ionicons name="star" size={12} color="#2563EB" />
                <Text className="text-xs font-semibold text-blue-600 ml-1">{user?.membershipTier}</Text>
              </View>
            </View>
          </View>

          <View className="flex-row justify-between">
            <View className="flex-1 bg-gray-50 rounded-2xl p-3 mr-2 flex-row items-center">
              <View className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                <Ionicons name="airplane-outline" size={20} color="#2563EB" />
              </View>
              <View className="ml-3">
                <Text className="text-base font-bold text-gray-900">{user?.upcomingFlights ?? 0} </Text>
                <Text className="text-[10px] text-gray-500 font-medium">Chuyến bay sắp tới</Text>
              </View>
            </View>
            
            <View className="flex-1 bg-gray-50 rounded-2xl p-3 ml-2 flex-row items-center">
              <View className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                <MaterialCommunityIcons name="ticket-percent-outline" size={20} color="#10B981" />
              </View>
              <View className="ml-3">
                <Text className="text-base font-bold text-gray-900">{user?.loyaltyPoints?.toLocaleString('vi-VN')}</Text>
                <Text className="text-[10px] text-gray-500 font-medium">Dặm thưởng Sky</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quan ly chuyen bay va ca nhan */}
        <Text className="mx-5 mt-6 mb-3 text-xs font-bold text-gray-500 uppercase">Quản lý chuyến bay & cá nhân</Text>
        <View className="mx-5 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          
          <TouchableOpacity 
            className="flex-row items-center justify-between p-4 border-b border-gray-50"
            onPress={() => navigate('EditProfile')}
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                <Ionicons name="person-outline" size={16} color="#2563EB" />
              </View>
              <Text className="ml-3 font-semibold text-gray-800 text-sm">Chỉnh sửa thông tin</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center justify-between p-4 border-b border-gray-50"
            onPress={() => navigate('MyTickets')}
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                <Ionicons name="ticket-outline" size={16} color="#2563EB" />
              </View>
              <Text className="ml-3 font-semibold text-gray-800 text-sm">Vé của tôi</Text>
            </View>
            <View className="flex-row items-center">
              <View className="bg-blue-50 px-2 py-0.5 rounded mr-2">
                <Text className="text-[10px] font-bold text-blue-600">{user?.upcomingFlights ?? 0} vé sắp tới</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center justify-between p-4 border-b border-gray-50"
            onPress={() => navigate('ChangePassword')}
          >
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                <Ionicons name="key-outline" size={16} color="#2563EB" />
              </View>
              <Text className="ml-3 font-semibold text-gray-800 text-sm">Đổi mật khẩu</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                <Ionicons name="people-outline" size={16} color="#2563EB" />
              </View>
              <Text className="ml-3 font-semibold text-gray-800 text-sm">Hành khách đã lưu</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Tuy chon va ho tro */}
        <Text className="mx-5 mt-6 mb-3 text-xs font-bold text-gray-500 uppercase">Tùy chọn & Hỗ trợ</Text>
        <View className="mx-5 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-50">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center border border-gray-100">
                <Ionicons name="settings-outline" size={16} color="#4B5563" />
              </View>
              <Text className="ml-3 font-semibold text-gray-800 text-sm">Cài đặt</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center border border-gray-100">
                <Ionicons name="help-circle-outline" size={16} color="#4B5563" />
              </View>
              <Text className="ml-3 font-semibold text-gray-800 text-sm">Trung tâm hỗ trợ & FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Nut dang xuat */}
        <TouchableOpacity 
          className="mx-5 bg-red-50 border border-red-100 rounded-2xl p-4 flex-row items-center justify-center mb-6"
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text className="font-bold text-red-600 ml-2">Đăng xuất</Text>
        </TouchableOpacity>

        <Text className="text-center text-xs text-gray-400 mb-10">SkyJourney Vietnam v2.4.0 (Build 382)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
