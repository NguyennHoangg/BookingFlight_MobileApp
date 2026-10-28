import "../../global.css";
import React, { useEffect, useState } from "react";
import FlightLoadingScreen, { FLIGHT_INTRO_DURATION } from "../components/common/FlightLoadingScreen";
import { Stack } from "expo-router";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import store, { useAppDispatch, useAppSelector } from "../store";
import { initAuth } from "../store/slices/authSlice";
import { MotionPreferences, useReducedMotionPreference } from "../components/common/MotionPreferences";
import StackScene from "../components/common/StackScene";

export const unstable_settings = { anchor: "(tabs)" };

function renderStackScene({ children }: { children: React.ReactNode }) {
  return <StackScene>{children}</StackScene>;
}

function Routes() {
  const dispatch = useAppDispatch();
  const [introFinished, setIntroFinished] = useState(false);
  const reducedMotion = useReducedMotionPreference();
  const { isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth,
  );
  useEffect(() => {
    void dispatch(initAuth());
    // Let the startup plane complete a pass even when local auth loads instantly.
    const introTimer = setTimeout(() => setIntroFinished(true), FLIGHT_INTRO_DURATION + 200);
    return () => clearTimeout(introTimer);
  }, [dispatch]);
  if (!isInitialized || !introFinished)
    return (
      <FlightLoadingScreen />
    );
  return (
    <Stack
      screenLayout={renderStackScene}
      screenOptions={{
        headerShown: false,
        animation: reducedMotion ? "none" : "slide_from_right",
        gestureEnabled: true,
        contentStyle: { backgroundColor: "#F9FAFB" },
        statusBarStyle: "dark",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="SearchFlightResult" />
      <Stack.Screen name="FlightDetail" />
      <Stack.Screen name="FareSelection" />
      <Stack.Screen name="PassengerInfo" />
      <Stack.Screen name="Notifications" />
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
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <MotionPreferences>
          <Routes />
        </MotionPreferences>
      </SafeAreaProvider>
    </Provider>
  );
}
