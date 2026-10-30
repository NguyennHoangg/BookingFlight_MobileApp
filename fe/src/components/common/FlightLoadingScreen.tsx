import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

export const FLIGHT_INTRO_DURATION = 3000;

export default function FlightLoadingScreen() {
  return (
    <View testID="startup-screen" style={styles.screen} accessibilityState={{ busy: true }}>
      {Platform.OS !== "web" && <StatusBar style="dark" />}
      <View style={styles.lockup}>
        <Text style={styles.brand}>
          Sky<Text style={styles.journey}>Journey</Text>
        </Text>
        <Text style={styles.slogan}>Chạm bầu trời. Mở hành trình.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  lockup: { alignItems: "center", maxWidth: "100%" },
  brand: {
    color: "#2563EB",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 48,
    textAlign: "center",
  },
  journey: { color: "#172B4D", fontWeight: "500" },
  slogan: {
    color: "#7B8798",
    fontSize: 13,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
});
