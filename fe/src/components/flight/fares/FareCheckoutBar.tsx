import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatFareMoney } from "../../../utils/fare";

/** Footer nằm ngoài ScrollView và tự chừa vùng home indicator của iOS/Android. */
export function FareCheckoutBar({
  total,
  count,
  disabled,
  label = "Tiếp tục",
  onContinue,
  note = "Theo đơn giá gói vé đang chọn",
}: {
  total: number | null;
  count: number;
  disabled?: boolean;
  label?: string;
  note?: string;
  onContinue: () => void;
}) {
  return (
    <SafeAreaView
      edges={["bottom"]}
      className="bg-white border-t-[1px] border-t-booking-line"
    >
      <View className="p-[15px] flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="text-[9px] text-[#50698E] font-bold">
            TỔNG TẠM TÍNH ({count} KHÁCH)
          </Text>
          <Text className="text-booking-primary font-extrabold text-[22px] mt-[3px]">
            {total === null ? "—" : formatFareMoney(total)}
          </Text>
          <Text className="text-[9px] text-booking-muted mt-[2px]">{note}</Text>
        </View>
        <Pressable
          onPress={onContinue}
          disabled={disabled || total === null}
          accessibilityRole="button"
          accessibilityState={{ disabled: !!disabled || total === null }}
          className={[
            "min-h-[50px] min-w-[138px] rounded-[13px] bg-booking-primary flex-row items-center justify-center gap-2 px-[14px] max-w-[60%]",
            disabled || total === null ? "opacity-[0.45]" : "",
          ].join(" ")}
        >
          <Text className="text-white text-sm font-bold">{label}</Text>
          <Ionicons name="arrow-forward" size={21} color="white" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
