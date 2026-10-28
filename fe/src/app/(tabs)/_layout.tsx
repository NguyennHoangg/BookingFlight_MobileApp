import React from "react";
import { Easing, StyleSheet, View } from "react-native";
import { Tabs, router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppSelector } from "../../store";
import AppHeader from "../../components/common/AppHeader";
import { useReducedMotionPreference } from "../../components/common/MotionPreferences";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const tabHeaders: Record<string, { title: string; subtitle: string }> = {
  index: { title: "SkyJourney", subtitle: "Khám phá hành trình của bạn" },
  Checkin: { title: "Check-in Online", subtitle: "Làm thủ tục cho chuyến bay" },
  Favorites: { title: "Yêu thích", subtitle: "Theo dõi chuyến bay và ưu đãi" },
  MyTickets: { title: "Vé của tôi", subtitle: "Quản lý hành trình bay cá nhân" },
  Profile: { title: "Tài khoản", subtitle: "Thông tin và cài đặt cá nhân" },
  account: { title: "Tài khoản", subtitle: "Thông tin và cài đặt cá nhân" },
};

// Keep a single header outside animated tab scenes, including on first visits.
function TabShell({ state, children }: {
  state: { index: number; routes: { name: string }[] };
  children: React.ReactNode;
}) {
  const heading = tabHeaders[state.routes[state.index].name] ?? tabHeaders.index;
  const { left, right } = useSafeAreaInsets();
  return (
    <View style={styles.shell}>
      <View style={{ paddingLeft: left, paddingRight: right, backgroundColor: "#FFFFFF" }}>
        <AppHeader {...heading} notifications />
      </View>
      {children}
    </View>
  );
}

export default function TabLayout() {
  const authenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const reducedMotion = useReducedMotionPreference();
  return (
    <Tabs
      layout={TabShell}
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: reducedMotion ? "none" : "fade",
        transitionSpec: {
          animation: "timing",
          config: { duration: reducedMotion ? 0 : 200, easing: Easing.out(Easing.cubic) },
        },
        sceneStyle: { backgroundColor: "#F9FAFB" },
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#6B7280",
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === "MyTickets")
            return (
              <MaterialCommunityIcons
                name={focused ? "ticket" : "ticket-outline"}
                color={color}
                size={size}
              />
            );
          const icons = {
            index: ["home", "home-outline"],
            Checkin: ["location", "location-outline"],
            Favorites: ["heart", "heart-outline"],
            Profile: ["person", "person-outline"],
            account: ["person", "person-outline"],
          } as const;
          const names = icons[route.name as keyof typeof icons] || icons.index;
          return (
            <Ionicons name={names[focused ? 0 : 1]} color={color} size={size} />
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Trang chủ" }} />
      <Tabs.Screen name="Checkin" options={{ title: "Checkin Online" }} />
      <Tabs.Protected guard={authenticated}>
        <Tabs.Screen name="Favorites" options={{ title: "Yêu thích" }} />
        <Tabs.Screen name="MyTickets" options={{ title: "Vé của tôi" }} />
        <Tabs.Screen name="Profile" options={{ title: "Tài khoản" }} />
      </Tabs.Protected>
      <Tabs.Protected guard={!authenticated}>
        <Tabs.Screen
          name="account"
          options={{ title: "Tài khoản" }}
          listeners={{
            tabPress: (event) => {
              event.preventDefault();
              router.push("/Login");
            },
          }}
        />
      </Tabs.Protected>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: "#F9FAFB" },
});
