import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/** Thanh tiến trình là thông tin trạng thái; các bước chưa có dữ liệu không phải link giả. */
export function BookingProgress({ active = 0 }: { active?: number }) {
  return (
    <View className="flex-row bg-white px-3 pb-4 pt-1">
      {["Hành khách", "Chọn ghế", "Dịch vụ", "Tóm tắt", "Thanh toán"].map(
        (label, index) => (
          <View key={label} className="flex-1 items-center">
            <View className="relative w-full items-center">
              <View className="absolute left-0 right-0 top-[11px] h-px bg-booking-line" />
              <View
                className={`h-[23px] w-[23px] items-center justify-center rounded-full border ${index < active ? "border-[#087F73] bg-[#087F73]" : index === active ? "border-booking-primary bg-booking-primary" : "border-booking-line bg-white"}`}
              >
                {index < active ? <Ionicons name="checkmark" size={14} color="white" /> : <Text
                  className={`text-[10px] ${index <= active ? "font-bold text-white" : "text-booking-muted"}`}
                >
                  {index + 1}
                </Text>}
              </View>
            </View>
            <Text
              className={`mt-1 text-center text-[9px] ${index === active ? "font-semibold text-booking-primary" : "text-booking-muted"}`}
            >
              {label}
            </Text>
          </View>
        ),
      )}
    </View>
  );
}
