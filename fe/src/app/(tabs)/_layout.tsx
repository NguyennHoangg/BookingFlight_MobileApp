import React from "react";
import { Tabs, router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppSelector } from "../../store";

export default function TabLayout() {
  const authenticated = useAppSelector((state) => state.auth.isAuthenticated);
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
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
