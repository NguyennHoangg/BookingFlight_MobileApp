import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Icon = React.ComponentProps<typeof Ionicons>["name"];
/** Card dùng chung cho chi tiết hành trình, hành lý, điều kiện và giá vé. */
export function BookingSection({
  icon,
  title,
  right,
  children,
}: React.PropsWithChildren<{ icon: Icon; title: string; right?: string }>) {
  return (
    <View className="mb-4 rounded-2xl border border-booking-line bg-white px-4 py-4">
      <View className="mb-4 flex-row items-center gap-2 border-b border-dashed border-booking-line pb-3">
        <View className="h-7 w-7 items-center justify-center rounded-lg bg-booking-soft">
          <Ionicons name={icon} size={17} color="#2864FF" />
        </View>
        <Text className="flex-1 text-sm font-bold text-booking-ink">
          {title}
        </Text>
        {right && (
          <Text className="text-[10px] text-booking-muted">{right}</Text>
        )}
      </View>
      {children}
    </View>
  );
}
/** Hàng giá/điều kiện co giãn, tránh tràn chữ trên điện thoại nhỏ. */
export function BookingRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View className="flex-row items-start justify-between gap-3 py-2">
      <Text className="flex-1 text-xs leading-5 text-[#536F97]">{label}</Text>
      <Text
        className={`flex-1 text-right text-xs font-semibold leading-5 ${emphasis ? "text-booking-primary" : "text-booking-ink"}`}
      >
        {value}
      </Text>
    </View>
  );
}
