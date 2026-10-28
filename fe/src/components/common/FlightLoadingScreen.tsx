import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

export const FLIGHT_INTRO_DURATION = 3000;

export default function FlightLoadingScreen() {
  const { width } = useWindowDimensions();
  const [progress] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const brandWidth = Math.min(244, width - 80);
  const brandLeft = (width - brandWidth) / 2;
  const aircraftWidth = 92;
  // Both the mask and aircraft use the same horizontal position.
  const startX = -aircraftWidth - 24;
  const endX = width + 24;
  const revealStart = (brandLeft - startX) / (endX - startX);
  const revealEnd = (brandLeft + brandWidth - startX) / (endX - startX);
  const maskX = progress.interpolate({
    inputRange: [0, revealStart, revealEnd, 1],
    outputRange: [-brandWidth, -brandWidth, 0, 0],
    extrapolate: "clamp",
  });
  const textX = Animated.multiply(maskX, -1);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (enabled) => { if (active) setReduceMotion(enabled); },
      () => { if (active) setReduceMotion(false); },
    );
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: FLIGHT_INTRO_DURATION,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: Platform.OS !== "web",
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reduceMotion]);

  return (
    <View testID="startup-screen" style={styles.screen} accessibilityLabel="SkyJourney. Chạm bầu trời. Mở hành trình." accessibilityState={{ busy: true }}>
      {Platform.OS !== "web" && <StatusBar style="dark" />}
      <Animated.View style={[styles.lockup, {
        transform: [{ scale: progress.interpolate({ inputRange: [0, revealEnd, (revealEnd + 1) / 2, 1], outputRange: [1, 1, 1.018, 1] }) }],
      }]}>
        <View style={[styles.brandViewport, { width: brandWidth }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Animated.View testID="startup-brand-mask" style={[styles.mask, { width: brandWidth, transform: [{ translateX: maskX }] }]}>
            <Animated.Text
              numberOfLines={1}
              style={[styles.brand, { width: brandWidth, fontSize: Math.min(36, brandWidth / 6.6), transform: [{ translateX: textX }] }]}
            >
              Sky<Text style={styles.journey}>Journey</Text>
            </Animated.Text>
          </Animated.View>
        </View>
        <Animated.Text style={[styles.slogan, {
          opacity: progress.interpolate({ inputRange: [0, revealStart, revealEnd, 1], outputRange: [0, 0, 1, 1] }),
          transform: [{ translateY: progress.interpolate({ inputRange: [0, revealEnd, 1], outputRange: [6, 0, 0] }) }],
        }]}>
          Chạm bầu trời. Mở hành trình.
        </Animated.Text>
        <Animated.View
          testID="startup-aircraft"
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.aircraft, {
            left: -brandLeft - aircraftWidth / 2,
            opacity: reduceMotion ? 0 : 1,
            transform: [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [startX, endX] }) },
              { translateY: progress.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [4, -3, 1, -4, -12] }) },
              { rotate: progress.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ["-4deg", "-8deg", "-4deg", "-9deg", "-14deg"] }) },
            ],
          }]}
        >
          <Animated.View style={[styles.wake, {
            opacity: progress.interpolate({ inputRange: [0, 0.15, 0.7, 0.95, 1], outputRange: [0, 0.6, 0.45, 0, 0] }),
            transform: [{ scaleX: progress.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0.3, 1, 0.8, 0.2] }) }],
          }]}>
            <View style={styles.wakeLong} />
            <View style={styles.wakeShort} />
          </Animated.View>
          {[0, 1, 2].map((index) => (
            <Animated.View key={index} style={[styles.spark, {
              left: -10 - index * 14,
              top: 29 + (index % 2) * 8,
              opacity: progress.interpolate({ inputRange: [0, 0.2 + index * 0.06, 0.5 + index * 0.06, 0.9, 1], outputRange: [0, 0.5, 0.15, 0, 0] }),
              transform: [{ scale: progress.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [0.4, 1, 0.5, 0.1] }) }],
            }]} />
          ))}
          <Image
            source={require("../../../assets/startup-aircraft-v2.png")}
            style={styles.aircraftImage}
            resizeMode="contain"
            fadeDuration={0}
            accessible={false}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  lockup: { alignItems: "center", marginTop: -24 },
  brandViewport: { height: 60, overflow: "hidden" },
  mask: { height: 60, overflow: "hidden" },
  brand: { color: "#2563EB", fontWeight: "800", letterSpacing: -1.2, lineHeight: 60, textAlign: "center" },
  journey: { color: "#172B4D", fontWeight: "500" },
  slogan: { color: "#7B8798", fontSize: 13, lineHeight: 22, marginTop: 8, textAlign: "center" },
  aircraft: { position: "absolute", top: -40, width: 92, height: 62 },
  aircraftImage: { width: 92, height: 62 },
  wake: { position: "absolute", top: 30, left: -43, width: 60, height: 12 },
  wakeLong: { width: 60, height: 2, borderRadius: 2, backgroundColor: "#C6DDFC" },
  wakeShort: { width: 34, height: 1, marginTop: 7, marginLeft: 20, borderRadius: 1, backgroundColor: "#DBEAFE" },
  spark: { position: "absolute", width: 3, height: 3, borderRadius: 2, backgroundColor: "#93C5FD" },
});
