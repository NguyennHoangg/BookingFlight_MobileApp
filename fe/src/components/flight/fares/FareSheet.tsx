import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { FlightFare } from "../../../api/flight.api";
import { formatFareMoney } from "../../../utils/fare";
import { fareColors as c } from "./theme";

/** Bottom sheet dùng chung, đóng được bằng nút, backdrop và Back trên Android. */
export function FareSheet({
  title,
  visible,
  onClose,
  children,
}: React.PropsWithChildren<{
  title: string;
  visible: boolean;
  onClose: () => void;
}>) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-[rgba(18,38,63,0.38)] items-center">
        <Pressable
          onPress={onClose}
          className="absolute inset-0"
          accessibilityLabel="Đóng bảng"
        />
        <SafeAreaView
          edges={["bottom"]}
          className="w-full max-w-[540px] max-h-[86%] rounded-tl-[24px] rounded-tr-[24px] bg-white"
        >
          <View className="w-[38px] h-1 rounded-[2px] bg-booking-line self-center mt-[10px]" />
          <View className="flex-row justify-between items-center p-5 gap-3">
            <Text className="text-[19px] text-booking-ink font-extrabold flex-1">
              {title}
            </Text>
            <Pressable onPress={onClose} accessibilityLabel="Đóng" hitSlop={12}>
              <Ionicons name="close" size={23} color={c.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerClassName="p-5 pt-0 pb-7">
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

/** So sánh cùng dữ liệu đang hiển thị; không gắn nhãn phổ biến hay quyền lợi giả. */
export function FareComparison({ fares }: { fares: FlightFare[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View className="flex-row gap-3">
        {fares.map((fare) => (
          <View
            key={fare.ticket.fareClassId}
            className="w-[205px] bg-booking-background border border-booking-line rounded-[12px] p-[15px]"
          >
            <Text className="text-[15px] text-booking-ink font-bold min-h-11">
              {fare.ticket.fareClassName}
            </Text>
            <Text className="text-booking-primary text-[18px] font-extrabold my-[10px]">
              {formatFareMoney(fare.ticket.price)}
            </Text>
            <Text className="text-[12px] text-[#536683] leading-[19px] py-2 border-t-[1px] border-t-booking-line">
              Xách tay: {fare.ticket.baggage.carryOn} kg
            </Text>
            <Text className="text-[12px] text-[#536683] leading-[19px] py-2 border-t-[1px] border-t-booking-line">
              Ký gửi: {fare.ticket.baggage.checked} kg
            </Text>
            <Text className="text-[12px] text-[#536683] leading-[19px] py-2 border-t-[1px] border-t-booking-line">
              Phí đổi: {formatFareMoney(fare.ticket.changeFee)} + chênh lệch giá
            </Text>
            <Text className="text-[12px] text-[#536683] leading-[19px] py-2 border-t-[1px] border-t-booking-line">
              {fare.ticket.isRefundable
                ? "Có hỗ trợ hoàn vé"
                : "Không hoàn tiền"}
            </Text>
            <Text className="text-[12px] text-[#536683] leading-[19px] py-2 border-t-[1px] border-t-booking-line">
              Còn {fare.ticket.availableSeats} vé
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
