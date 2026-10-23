import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Splash">;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    badge: "THUẬT TOÁN GIÁ TỐT",
    badgeBg: "#FEF3C7",
    badgeText: "#B45309",
    cornerLabel: "So sánh 120+ Hãng",
    image: require("../../../assets/Splash_screen_1.jpg"),
    title: "Đặt vé thông minh\ngiá tốt nhất",
    desc: "Hệ thống phân tích xu hướng giá thời gian thực, tự động đề xuất lộ trình tối ưu và cảnh báo hạ giá ngay tức thì.",
  },
  {
    badge: "CHUẨN IATA ĐIỆN TỬ",
    badgeBg: "#D1FAE5",
    badgeText: "#065F46",
    cornerLabel: "Chạm là Bay ✈️",
    image: require("../../../assets/Splash_screen_2.jpg"),
    title: "Check-in & Vé điện tử\nmột chạm",
    desc: "Bỏ qua hàng chờ sân bay. Thẻ lên tàu tích hợp ví điện tử, cập nhật cửa khởi hành và trạng thái chuyến bay liên tục.",
  },
  {
    badge: "TƯƠNG TÁC KHÔNG GIAN",
    badgeBg: "#EDE9FE",
    badgeText: "#5B21B6",
    cornerLabel: "14A  Ghế Cửa sổ Siêu Rộng   3D Preview",
    image: require("../../../assets/Splash_screen_3.jpg"),
    title: "Chọn chỗ ngồi 3D\nthời gian thực",
    desc: "Trải nghiệm góc nhìn thực tế ảo khoang khách từ vị trí ghế ngồi trước khi quyết định, tận hưởng hành trình êm ái.",
  },
];

export default function SplashScreen({ navigation }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const goToNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    }
  };

  const handleStart = () => {
    navigation.replace("Register");
  };

  const handleLogin = () => {
    navigation.replace("Login");
  };

  const handleSkip = () => {
    navigation.replace("Login");
  };

  const slide = SLIDES[activeIndex];

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white h-full gap-5">
        {/* Top bar */}
        <View className="flex-row justify-end items-center px-5 pt-2 pb-1">
         
          <TouchableOpacity onPress={handleSkip} className="py-1 px-2">
            <Text className="text-primary text-base font-semibold">Bỏ qua</Text>
          </TouchableOpacity>
        </View>

        {/* Logo + Brand */}
        <View className="items-center pt-4 pb-5">
          <Image
            source={require("../../../assets/Splash_icon.png")}
            className="w-32 h-32 rounded-lg mb-3"
            resizeMode="contain"
          />
          <View className="flex-row items-center">
            <Text className="text-slate-900 text-3xl font-extrabold">
              SkyWings
            </Text>
            <View className="w-2 h-2 rounded-full bg-primary ml-1 mt-1" />
          </View>
          <Text className="text-slate-400 text-xs font-semibold tracking-widest mt-1">
            KHÁM PHÁ MỌI CHÂN TRỜI — CHẠM TỚI ƯỚC MƠ
          </Text>
        </View>

        {/* Slides carousel */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={{ flexGrow: 0 }}
        >
          {SLIDES.map((item, index) => (
            <View key={index} style={{ width: SCREEN_WIDTH }} className="px-5">
              {/* Image card */}
              <View className="rounded-2xl overflow-hidden bg-slate-100" style={{ height: 210 }}>
                <Image
                  source={item.image}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
                {/* Badge top-left */}
                <View
                  className="absolute top-3 left-3 rounded-full px-3 py-1 flex-row items-center"
                  style={{ backgroundColor: item.badgeBg }}
                >
                  <Text style={{ color: item.badgeText }} className="text-xs font-bold">
                    {item.badge}
                  </Text>
                </View>
                {/* Corner label bottom-right */}
                <View className="absolute bottom-3 right-3 bg-slate-900 rounded-xl px-3 py-1">
                  <Text className="text-white text-xs font-semibold">
                    {item.cornerLabel}
                  </Text>
                </View>
              </View>

              {/* Text content */}
              <View className="pt-5 pb-3 items-center">
                <Text className="text-slate-900 text-2xl font-extrabold text-center leading-8">
                  {item.title}
                </Text>
                <Text className="text-slate-500 text-sm text-center leading-6 mt-3 px-2">
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Pagination dots */}
        <View className="flex-row justify-center items-center py-4 gap-2">
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => {
              scrollRef.current?.scrollTo({ x: i * SCREEN_WIDTH, animated: true });
            }}>
              <View
                className="rounded-full"
                style={{
                  width: i === activeIndex ? 24 : 8,
                  height: 8,
                  backgroundColor: i === activeIndex ? "#0064D2" : "#CBD5E1",
                  marginHorizontal: 3,
                }}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom buttons */}
        <View className="px-5 pb-4 p4-2">
          <TouchableOpacity
            className="rounded-2xl py-4 items-center mb-3"
            style={{ backgroundColor: "#0F172A" }}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base">
              Bắt đầu ngay →
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-3 items-center rounded-2xl bg-primary-light mb-2"
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text className="text-primary font-semibold text-sm">
              Đăng nhập nếu đã có tài khoản
            </Text>
          </TouchableOpacity>

          {/* Security note */}
          <View className="flex-row items-center justify-center pt-1">
            
            <Text className="text-slate-400 text-xs ml-1">
              Bảo mật giao dịch hàng không cấp độ Quốc tế
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
