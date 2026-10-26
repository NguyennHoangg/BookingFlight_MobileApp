import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Đặt trực tiếp mock data tại đây
const MOCK_USER_PROFILE = {
  id: 'usr-1234-abcd',
  fullName: 'Nguyễn Minh Anh',
  email: 'minhanh.nguyen@example.com',
  phone: '+84 912 345 678',
  avatarUrl: 'https://i.pravatar.cc/150?img=32',
  loyaltyPoints: 1450,
  membershipTier: 'GOLD',
  dateOfBirth: '1995-08-15',
  gender: 'Nữ',
  memberCode: 'SJ-88921',
  upcomingFlights: 2,
};

export default function EditProfileScreen() {
  const navigation = useNavigation();

  const [fullName, setFullName] = useState(MOCK_USER_PROFILE.fullName);
  const [email, setEmail] = useState(MOCK_USER_PROFILE.email);
  const [phone, setPhone] = useState(MOCK_USER_PROFILE.phone);
  const [dateOfBirth, setDateOfBirth] = useState(MOCK_USER_PROFILE.dateOfBirth);
  const [gender, setGender] = useState(MOCK_USER_PROFILE.gender);

  const dateInputRef = useRef<HTMLInputElement>(null);

  // Khôi phục lại thông tin gốc
  const handleReset = () => {
    setFullName(MOCK_USER_PROFILE.fullName);
    setEmail(MOCK_USER_PROFILE.email);
    setPhone(MOCK_USER_PROFILE.phone);
    setDateOfBirth(MOCK_USER_PROFILE.dateOfBirth);
    setGender(MOCK_USER_PROFILE.gender);
  };

  const handleSave = () => {
    Alert.alert('Thành công', 'Thông tin hồ sơ đã được cập nhật.', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const openDatePicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.click();
      }
    }
  };

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Chỉnh sửa hồ sơ</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text className="text-sm font-medium text-gray-500">Đặt lại</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-5" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      >
        {/* AVATAR UPLOAD */}
        <View className="items-center mt-6 mb-6">
          <View className="relative">
            <Image
              source={{ uri: MOCK_USER_PROFILE.avatarUrl }}
              className="w-24 h-24 rounded-full border-4 border-white shadow-sm"
            />
            <TouchableOpacity className="absolute bottom-0 right-0 bg-blue-600 w-8 h-8 rounded-full items-center justify-center border-2 border-white shadow-sm">
              <Ionicons name="camera" size={14} color="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-gray-500 mt-3">Chạm để thay đổi ảnh đại diện</Text>

          <View className="bg-blue-50 px-4 py-1.5 rounded-full mt-3 flex-row items-center border border-blue-100">
            <Ionicons name="star" size={14} color="#2563EB" />
            <Text className="text-xs font-semibold text-blue-600 ml-1">
              Hội viên Sky{MOCK_USER_PROFILE.membershipTier} • Mã TV: {MOCK_USER_PROFILE.memberCode}
            </Text>
          </View>
        </View>

        {/* THÔNG TIN CÁ NHÂN FORM */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-xs font-bold text-gray-500 uppercase mb-4">Thông tin cá nhân</Text>

          {/* Họ và tên */}
          <View className="mb-4">
            <Text className="text-xs text-gray-600 font-medium mb-1.5">Họ và tên</Text>
            <View className="flex-row items-center border border-gray-200 rounded-2xl px-3 py-3 bg-white">
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 font-medium text-sm"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhập họ và tên"
              />
            </View>
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-xs text-gray-600 font-medium mb-1.5">Email</Text>
            <View className="flex-row items-center border border-gray-200 rounded-2xl px-3 py-3 bg-white">
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 font-medium text-sm"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
          </View>

          {/* Số điện thoại */}
          <View className="mb-4">
            <Text className="text-xs text-gray-600 font-medium mb-1.5">Số điện thoại</Text>
            <View className="flex-row items-center border border-gray-200 rounded-2xl px-3 py-3 bg-white">
              <Ionicons name="call-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 font-medium text-sm"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Ngày sinh */}
          <View className="mb-4">
            <Text className="text-xs text-gray-600 font-medium mb-1.5">Ngày sinh</Text>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={openDatePicker}
              className="flex-row items-center border border-gray-200 rounded-2xl px-3 py-3 bg-white relative overflow-hidden"
            >
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text className="flex-1 ml-3 text-gray-900 font-medium text-sm">
                {dateOfBirth ? dateOfBirth.split('-').reverse().join('/') : 'Chọn ngày sinh'}
              </Text>
              
              <input
                ref={dateInputRef}
                type="date"
                value={dateOfBirth}
                onChange={(e) => {
                  if (e.target.value) setDateOfBirth(e.target.value);
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  pointerEvents: 'none',
                }}
              />
            </TouchableOpacity>
          </View>

          {/* Giới tính */}
          <View>
            <Text className="text-xs text-gray-600 font-medium mb-1.5">Giới tính</Text>
            <View className="flex-row bg-gray-50 rounded-xl p-1 border border-gray-100">
              {['Nữ', 'Nam', 'Khác'].map((g) => (
                <TouchableOpacity
                  key={g}
                  className={`flex-1 py-2.5 items-center rounded-lg ${gender === g ? 'bg-blue-600 shadow-sm' : ''}`}
                  onPress={() => setGender(g)}
                >
                  <Text className={`font-semibold text-sm ${gender === g ? 'text-white' : 'text-gray-500'}`}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* BẢO MẬT */}
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <Text className="text-xs font-bold text-gray-500 uppercase mb-4">Bảo mật & Mật khẩu</Text>
          <TouchableOpacity className="flex-row items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-white items-center justify-center border border-gray-100 shadow-sm">
                <Ionicons name="lock-closed-outline" size={20} color="#4B5563" />
              </View>
              <View className="ml-3">
                <Text className="text-sm font-bold text-gray-900">Đổi mật khẩu</Text>
                <Text className="text-xs text-gray-500 mt-0.5">Cập nhật lần cuối: 3 tháng trước</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* NÚT LƯU THAY ĐỔI */}
        <TouchableOpacity
          className="bg-[#2563EB] rounded-2xl py-4 items-center justify-center flex-row shadow-md shadow-blue-300 mb-10"
          onPress={handleSave}
        >
          <Ionicons name="save-outline" size={20} color="white" className="mr-2" />
          <Text className="text-white font-bold text-base ml-2">Lưu thay đổi</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}