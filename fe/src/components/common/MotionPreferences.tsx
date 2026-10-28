import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

const ReducedMotionContext = createContext(true);

export function MotionPreferences({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    let active = true;
    let preferenceChanged = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      preferenceChanged = true;
      setReducedMotion(enabled);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active && !preferenceChanged) setReducedMotion(enabled);
    }).catch(() => {
      // Keep motion disabled if the platform cannot read the preference.
    });
    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  return <ReducedMotionContext.Provider value={reducedMotion}>{children}</ReducedMotionContext.Provider>;
}

export function useReducedMotionPreference() {
  return useContext(ReducedMotionContext);
}
