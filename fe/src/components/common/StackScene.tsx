import React, { useCallback } from 'react';
import { Animated, Easing, Platform, StyleSheet, useAnimatedValue } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useReducedMotionPreference } from './MotionPreferences';

// Native stack owns native transitions; its web implementation needs a fade.
export default function StackScene({ children }: { children: React.ReactNode }) {
  return Platform.OS === 'web' ? <WebScene>{children}</WebScene> : <>{children}</>;
}

function WebScene({ children }: { children: React.ReactNode }) {
  const opacity = useAnimatedValue(1);
  const reducedMotion = useReducedMotionPreference();

  useFocusEffect(useCallback(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0.8);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
      isInteraction: false,
    });
    animation.start();
    return () => {
      animation.stop();
      opacity.setValue(1);
    };
  }, [opacity, reducedMotion]));

  return <Animated.View style={[styles.scene, { opacity }]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  scene: { flex: 1, backgroundColor: '#F9FAFB' },
});
