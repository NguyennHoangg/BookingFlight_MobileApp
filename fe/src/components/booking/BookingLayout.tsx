import React, { type ComponentProps, type ReactNode } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../common/AppHeader";
import { BookingProgress } from "./BookingProgress";
import { FareCheckoutBar } from "../flight/fares/FareCheckoutBar";
import { navigate } from "../../navigation/routes";
import { formatFareMoney } from "../../utils/fare";

/** Header/progress/footer dùng chung để hai màn giữ bố cục và safe area nhất quán. */
export function BookingLayout({
  title,
  step,
  total,
  count,
  onContinue,
  children,
  footer,
  label = "Tiếp tục",
}: {
  title: string;
  step: number;
  total: number | null;
  count: number;
  onContinue: () => void;
  children: ReactNode;
  footer?: ReactNode;
  label?: string;
}) {
  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-white">
      <AppHeader
        title={title}
        subtitle={`Bước ${step + 1} trên 5`}
        back
        action={{
          label: "Trợ giúp đặt vé",
          icon: "help-circle-outline",
          onPress: () =>
            Alert.alert(
              "Trợ giúp đặt vé",
              "Kiểm tra thông tin hành khách, chuyến bay và dịch vụ trước khi tiếp tục. Bạn có thể quay lại để chỉnh sửa lựa chọn.",
            ),
        }}
      />
      <View className="w-full max-w-[540px] flex-1 self-center bg-booking-background">
        <BookingProgress active={step} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-3 p-4 pb-6"
        >
          {children}
        </ScrollView>
        {footer}
        <FareCheckoutBar
          total={total}
          count={count}
          onContinue={onContinue}
          label={label}
          note={total === null ? "Chờ xác nhận thuế và phí" : "Gồm vé, thuế/phí, ghế và dịch vụ đã chọn"}
        />
      </View>
    </SafeAreaView>
  );
}
export function BookingCard({
  title,
  icon,
  action,
  children,
}: {
  title?: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View className="rounded-2xl border border-booking-line bg-white p-4">
      {title && (
        <View className="mb-3 flex-row items-center gap-2 border-b border-booking-line pb-3">
          {icon && <Ionicons name={icon} size={19} color="#2864FF" />}
          <Text className="flex-1 text-sm font-bold text-booking-ink">
            {title}
          </Text>
          {action}
        </View>
      )}
      {children}
    </View>
  );
}
export function BookingLink({
  children,
  onPress,
}: {
  children: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="min-h-[44px] items-center justify-center px-2"
    >
      <Text className="text-xs font-semibold text-booking-primary">
        {children}
      </Text>
    </Pressable>
  );
}
export function PriceRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <View className="flex-row items-start justify-between gap-3 py-1.5">
      <Text
        className={`flex-1 text-xs ${strong ? "font-bold text-booking-ink" : "text-[#536F97]"}`}
      >
        {label}
      </Text>
      <Text
        className={
          strong
            ? "text-lg font-bold text-booking-primary"
            : "text-xs text-booking-ink"
        }
      >
        {formatFareMoney(value)}
      </Text>
    </View>
  );
}
/** Reload/deep link không có dữ liệu RAM phải trở về tìm vé, không dựng dữ liệu giả. */
export function MissingBooking() {
  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      className="flex-1 bg-white"
    >
      <AppHeader title="Đặt vé" back />
      <View className="flex-1 items-center justify-center p-6">
        <Ionicons name="airplane-outline" size={44} color="#2864FF" />
        <Text className="mt-4 text-center text-base font-bold text-booking-ink">
          Chưa có hành trình để xác nhận
        </Text>
        <Text className="mt-2 text-center text-sm leading-6 text-booking-muted">
          Vui lòng tìm chuyến bay và nhập thông tin hành khách để tiếp tục.
        </Text>
        <BookingLink onPress={() => navigate("Home")}>
          Tìm chuyến bay
        </BookingLink>
      </View>
    </SafeAreaView>
  );
}
