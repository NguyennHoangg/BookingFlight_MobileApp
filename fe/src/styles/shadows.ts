import { StyleSheet } from 'react-native';

// Keep conditional shadows in native styles. Toggling NativeWind shadow utilities
// can introduce a CSS variable provider after mount and remount the control.
export const shadows = StyleSheet.create({
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
});
