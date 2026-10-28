import AppHeader from '../../components/common/AppHeader';
import { navigate, goBack } from "../../navigation/routes";
import { router } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  Image,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
  Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import Svg, { Path } from "react-native-svg";
import { useAuth } from "../../hook/useAuth";
import { useKeyboardScrollView } from "../../hook/useKeyboardScrollView";


export default function RegisterScreen() {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Custom hook dùng lại cho nhiều màn hình
  const { scrollViewRef, keyboardPadding, scrollToInput } = useKeyboardScrollView({
    initialPadding: 40,
    extraPadding: 60,
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ tất cả các trường!");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp!");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt!");
      return;
    }
    if (!agreeTerms) {
      Alert.alert("Thông báo", "Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật!");
      return;
    }
    
    try {
      const result = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password,
      });

      if (result.success) {
        Alert.alert("Thành công", "Đăng ký tài khoản thành công! Vui lòng đăng nhập để tiếp tục.", [
          { text: "Đăng nhập ngay", onPress: () => navigate("Login") },
        ]);
      } else {
        Alert.alert("Đăng ký thất bại", result.message || "Đã có lỗi xảy ra vui lòng thử lại!");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Đã có lỗi xảy ra vui lòng thử lại!");
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      goBack();
    } else {
      navigate("Login");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["left", "right", "bottom"]}>
      <AppHeader title="Tạo tài khoản" back onBack={handleGoBack} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: keyboardPadding }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          className="flex-1"
        >
          {/* Logo & Header */}
          <View className="items-center justify-center mt-2 px-6">
            <Image
              source={require("../../../assets/Splash_icon.png")}
              className="w-16 h-16"
              resizeMode="contain"
            />
            <Text className="text-2xl font-bold text-[#131B2E] mt-2">
              SkyJourney
            </Text>
            <Text className="text-sm text-center text-[#64748B] mt-1">
              Bắt đầu hành trình tuyệt vời cùng SkyJourney
            </Text>
          </View>

          {/* Screen Title */}
          <View className="px-7 mt-6">
            <Text className="text-2xl font-bold text-[#131B2E]">
              Tạo tài khoản
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              Điền thông tin để đăng ký tài khoản mới
            </Text>
          </View>

          {/* Form fields */}
          <View className="px-7 mt-5 gap-4">
            {/* Full name */}
            <View>
              <Text className="text-sm font-semibold text-[#131B2E] mb-1.5">
                Họ và tên
              </Text>
              <TextInput
                placeholder="Nguyễn Văn A"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => scrollToInput(60)}
                className="w-full h-[50px] px-4 text-base text-[#131B2E] bg-[#F8FAFC] border border-gray-300 rounded-xl"
              />
            </View>

            {/* Email */}
            <View>
              <Text className="text-sm font-semibold text-[#131B2E] mb-1.5">
                Email
              </Text>
              <TextInput
                placeholder="example@domain.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                onFocus={() => scrollToInput(120)}
                keyboardType="email-address"
                autoCapitalize="none"
                className="w-full h-[50px] px-4 text-base text-[#131B2E] bg-[#F8FAFC] border border-gray-300 rounded-xl"
              />
            </View>

            {/* Phone */}
            <View>
              <Text className="text-sm font-semibold text-[#131B2E] mb-1.5">
                Số điện thoại
              </Text>
              <TextInput
                placeholder="0912345678"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                onFocus={() => scrollToInput(190)}
                keyboardType="phone-pad"
                className="w-full h-[50px] px-4 text-base text-[#131B2E] bg-[#F8FAFC] border border-gray-300 rounded-xl"
              />
            </View>

            {/* Password */}
            <View>
              <Text className="text-sm font-semibold text-[#131B2E] mb-1.5">
                Mật khẩu
              </Text>
              <View className="relative justify-center">
                <TextInput
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => scrollToInput(270)}
                  secureTextEntry={!showPassword}
                  className="w-full h-[50px] pl-4 pr-12 text-base text-[#131B2E] bg-[#F8FAFC] border border-gray-300 rounded-xl"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-2"
                  activeOpacity={0.6}
                >
                  {showPassword ? (
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        stroke="#64748B"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                        stroke="#64748B"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  ) : (
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                        stroke="#64748B"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M1 1l22 22"
                        stroke="#64748B"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View>
              <Text className="text-sm font-semibold text-[#131B2E] mb-1.5">
                Xác nhận mật khẩu
              </Text>
              <View className="relative justify-center">
                <TextInput
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => scrollToInput(350)}
                  secureTextEntry={!showConfirmPassword}
                  className="w-full h-[50px] pl-4 pr-12 text-base text-[#131B2E] bg-[#F8FAFC] border border-gray-300 rounded-xl"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 p-2"
                  activeOpacity={0.6}
                >
                  {showConfirmPassword ? (
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        stroke="#64748B"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                        stroke="#64748B"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  ) : (
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                        stroke="#64748B"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M1 1l22 22"
                        stroke="#64748B"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Terms and Privacy Checkbox */}
          <View className="px-7 mt-5">
            <Pressable
              onPress={() => setAgreeTerms(!agreeTerms)}
              className="flex-row items-start"
              hitSlop={8}
            >
              <View
                className={`w-5 h-5 rounded-md border items-center justify-center mr-3 mt-0.5 ${
                  agreeTerms
                    ? "bg-[#2563EB] border-[#2563EB]"
                    : "border-gray-300 bg-white"
                }`}
              >
                {agreeTerms && (
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M20 6L9 17l-5-5"
                      stroke="#FFFFFF"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                )}
              </View>
              <Text className="flex-1 text-sm text-[#64748B] leading-5">
                Tôi đồng ý với{" "}
                <Text className="text-[#2563EB] font-medium">
                  Điều khoản dịch vụ
                </Text>{" "}
                và{" "}
                <Text className="text-[#2563EB] font-medium">
                  Chính sách bảo mật
                </Text>{" "}
                của SkyJourney
              </Text>
            </Pressable>
          </View>

          {/* Submit Button */}
          <View className="px-7 mt-6">
            <TouchableOpacity
              className="bg-[#2563EB] rounded-xl h-[52px] justify-center items-center shadow-sm active:opacity-90"
              onPress={handleRegister}
            >
              <Text className="text-white text-center font-semibold text-base">
                Đăng ký
              </Text>
            </TouchableOpacity>
          </View>

          {/* Already have an account? Login */}
          <View className="flex-row justify-center items-center mt-8 mb-4">
            <Text className="text-gray-500 text-base font-normal">
              Đã có tài khoản?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigate("Login")}>
              <Text className="text-[#2563EB] font-semibold text-base">
                Đăng nhập ngay
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
