import "../../global.css";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import store, { useAppDispatch, useAppSelector } from "../store";
import { initAuth } from "../store/slices/authSlice";

export const unstable_settings = { anchor: "(tabs)" };

function Routes() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );
  useEffect(() => {
    void dispatch(initAuth());
  }, [dispatch]);
  if (!isInitialized)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator size="large" color="#2563EB" /></View>
    );
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="SearchFlightResult" />
      <Stack.Screen name="FlightDetail" />
      <Stack.Screen name="FareSelection" />
      <Stack.Screen name="PassengerInfo" />
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="Login" />
        <Stack.Screen name="Register" />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="TicketDetail" />
        <Stack.Screen name="EditProfile" />
        <Stack.Screen name="ChangePassword" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <Routes />
      </SafeAreaProvider>
    </Provider>
  );
}
