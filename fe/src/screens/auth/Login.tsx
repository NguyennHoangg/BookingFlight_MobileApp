import React, {useState, useEffect}from "react";
import {
    Image,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation<LoginNavigationProp>();

  const handleLogin = () => {
    console.log(identifier, password);
  };

  const handleRegister = () => {
    navigation.navigate("Register");
  };
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
          <View className="flex items-center justify-center mt-20">
              <Image source={require("../../../assets/Splash_icon.png")} className="w-20 h-20" />
          </View>

          <View className="flex items-center justify-center px-10 mt-2">
              <Text className="text-3xl font-bold text-[#131B2E]">SkyJourney</Text>
              <Text className="text-lg text-center text-[#64748B] mt-1">Chào mừng trở lại! Khám phá hành trình bay tuyệt vời</Text>
          </View>

          <View className="justify-start mx-10 mt-10">
            <Text className="text-2xl font-bold text-[#131B2E]">Đăng nhập</Text>
            <Text className="text-lg text-gray-500 mt-1">Vui lòng nhập thông tin tài khoản SkyJourney</Text>
          </View>

        <View className="justify-start mx-10 mt-6">
          <Text className="text-base font-semibold text-[#131B2E]">Email hoặc số điện thoại</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mt-2"
            placeholder="Nhập email"
            value={identifier}
            onChangeText={setIdentifier}
          />  

          <Text className="text-base font-semibold text-[#131B2E] mt-4">Mật khẩu</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mt-2"
            placeholder="Nhập mật khẩu"
            value={password}
            onChangeText={setPassword}
          />  
        </View>

        <View className="items-end justify-end px-10 py-4">
          <Text className="text-blue-500 font-semibold text-base">Quên mật khẩu?</Text>
        </View>

        <View className="mx-10 mt-2">
          <TouchableOpacity
            className="bg-[#2563EB] rounded-lg px-4 py-3 h-[50px] justify-center items-center"
            onPress={handleLogin}
          >
            <Text className="text-white text-center font-semibold text-lg">Đăng nhập</Text>
          </TouchableOpacity>
        </View>

        {/* Hoặc đăng nhập bằng */}
        <View className="flex-row items-center mx-10 mt-8 mb-6">
          <View className="flex-1 h-[1px] bg-gray-200" />
          <Text className="text-gray-500 text-xs ml-4 text-right leading-4 font-medium">
            hoặc đăng{"\n"}nhập bằng
          </Text>
        </View>

        {/* Social login buttons */}
        <View className="flex-row justify-between mx-10 gap-3">
          {/* Google */}
          <TouchableOpacity className="flex-1 h-[60px] border border-gray-200 rounded-2xl items-center justify-center bg-white shadow-sm">
            <Svg width={26} height={26} viewBox="0 0 24 24">
              <Path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.16z"
              />
              <Path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.76-2.11-6.7-4.96H1.27v3.15C3.3 21.36 7.37 24 12 24z"
              />
              <Path
                fill="#FBBC05"
                d="M5.3 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4.03-3.15z"
              />
              <Path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.3 2.64 1.27 6.61l4.03 3.15c.94-2.85 3.58-5.01 6.7-5.01z"
              />
            </Svg>
          </TouchableOpacity>

          {/* Apple */}
          <TouchableOpacity className="flex-1 h-[60px] border border-gray-200 rounded-2xl items-center justify-center bg-white shadow-sm">
            <Svg width={24} height={24} viewBox="0 0 170 170">
              <Path
                fill="#000000"
                d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.6-7.8-11.74-14.27-5.83-9.11-10.45-19.46-13.86-31.05-3.41-11.59-5.12-22.56-5.12-32.9 0-14.34 3.72-26.33 11.16-35.97 7.44-9.64 16.69-14.54 27.75-14.7 4.58 0 9.87 1.26 15.86 3.78 5.99 2.52 10.12 3.86 12.39 4.02 2.05-.27 6.13-1.6 12.24-3.99 6.11-2.4 11.45-3.5 16.02-3.3 11.96.64 21.7 4.96 29.21 12.98-10.45 6.31-15.62 14.88-15.52 25.72.11 8.5 3.36 15.68 9.76 21.53 6.4 5.85 13.88 9.3 22.44 10.35-2.02 6.09-4.54 12.18-7.56 18.28zm-29.26-118.5c0 6.64-2.52 13-7.56 18.08-5.04 5.08-11.08 8.07-18.12 8.97-.22-.97-.33-2.06-.33-3.26 0-6.64 2.65-13.22 7.95-19.74 5.3-6.52 11.46-10.02 18.48-10.51.11 2.18.22 4.36.22 6.46z"
              />
            </Svg>
          </TouchableOpacity>

          {/* Zalo */}
          <TouchableOpacity className="flex-1 h-[60px] border border-gray-200 rounded-2xl items-center justify-center bg-white shadow-sm">
            <Text className="text-[#0068FF] font-bold text-2xl">Zalo</Text>
          </TouchableOpacity>
        </View>

        {/* Chưa có tài khoản? Đăng ký ngay */}
        <View className="flex-row justify-center items-center mt-12 mb-6">
          <Text className="text-gray-500 text-base font-normal">Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text className="text-[#2563EB] font-semibold text-base">Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}