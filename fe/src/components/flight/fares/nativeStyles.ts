import { StyleSheet } from "react-native";

/** Chỉ shadow động dùng native style để tránh NativeWind thay đổi context sau mount. */
export const selectedFareShadow = StyleSheet.create({
  selected: {
    shadowColor: "#2864FF",
    shadowOpacity: 0.14,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
}).selected;
