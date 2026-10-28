import { selectedFareShadow } from "./nativeStyles";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { FlightFare } from "../../../api/flight.api";
import { formatFareMoney, isBusinessFare } from "../../../utils/fare";
import { fareColors as c } from "./theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
interface Props {
  fare: FlightFare;
  selected: boolean;
  onSelect: (fare: FlightFare) => void;
}

/** Một hàng quyền lợi, luôn lấy giá trị từ hợp đồng API thay vì suy đoán theo tên gói. */
function Benefit({
  icon,
  label,
  value,
  positive = false,
}: {
  icon: IconName;
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <View className="flex-row items-start justify-between gap-3 py-[6px]">
      <View className="flex-row items-center gap-[7px] flex-1">
        <Ionicons name={icon} size={16} color={c.muted} />
        <Text className="text-[12px] text-[#33445F] shrink leading-[18px]">
          {label}
        </Text>
      </View>
      <Text
        className={[
          "text-[12px] font-semibold leading-[18px] text-right flex-1",
          positive ? "text-booking-primary" : "text-booking-ink",
        ].join(" ")}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * Card có thể chọn và mở riêng điều kiện vé. Shadow dùng StyleSheet để không
 * thay đổi cây context của NativeWind khi người dùng chuyển qua lại giữa các gói.
 */
export function FareOptionCard({ fare, selected, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { ticket } = fare;
  const business = isBusinessFare(fare);
  const changeFee =
    ticket.changeFee === 0
      ? "Miễn phí + chênh lệch giá"
      : `${formatFareMoney(ticket.changeFee)} + chênh lệch`;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${ticket.fareClassName}, ${formatFareMoney(ticket.price)} mỗi khách`}
      onPress={() => onSelect(fare)}
      className={[
        "mb-[18px] rounded-[15px] relative",
        selected ? "p-[17px]" : "p-[18px]",
        selected ? "border-2" : "border",
        selected ? "border-booking-primary" : "border-booking-line",
        selected ? "bg-[#F1F6FF]" : "bg-white",
        business ? "pt-6" : "",
      ].join(" ")}
      style={selected ? selectedFareShadow : undefined}
    >
      {(selected || business) && (
        <View
          className={[
            "absolute -top-[11px] right-[16px] rounded-[12px] flex-row gap-1 px-[10px] py-1",
            business && !selected ? "bg-[#203249]" : "bg-booking-primary",
          ].join(" ")}
        >
          <Ionicons
            name={selected ? "checkmark-circle" : "sparkles"}
            size={12}
            color="white"
          />
          <Text className="text-white text-[9px] font-extrabold tracking-[0.5px]">
            {selected ? "ĐANG CHỌN" : "HẠNG THƯƠNG GIA"}
          </Text>
        </View>
      )}
      <View className="flex-row gap-3">
        <View
          className={[
            "w-[21px] h-[21px] rounded-[11px] border-2 items-center justify-center mt-[2px]",
            selected ? "border-booking-primary" : "border-[#C4CDE0]",
            selected ? "bg-booking-primary" : "",
          ].join(" ")}
        >
          {selected && <View className="w-2 h-2 rounded-[4px] bg-white" />}
        </View>
        <View className="flex-1">
          <Text
            className={[
              "text-[10px] font-extrabold tracking-[0.7px] mb-[5px]",
              selected ? "text-booking-primary" : "text-[#4D6587]",
            ].join(" ")}
          >
            {business ? "THƯƠNG GIA ĐẶC QUYỀN" : "HẠNG PHỔ THÔNG"}
          </Text>
          <Text className="text-booking-ink text-[18px] leading-[24px] font-extrabold">
            {ticket.fareClassName}
          </Text>
          <Text className="text-[11px] text-booking-muted mt-[7px]">
            {fare.airline.name}
          </Text>
        </View>
      </View>
      <View className="items-end mt-[9px]">
        <Text
          className={[
            "font-extrabold text-[23px]",
            selected ? "text-booking-primary" : "text-booking-ink",
          ].join(" ")}
        >
          {formatFareMoney(ticket.price)}
        </Text>
        <Text className="text-booking-muted text-[11px] mt-[2px]">/ khách</Text>
      </View>
      <View
        className={[
          "h-[1px] my-[13px]",
          selected ? "bg-[#CBDCFF]" : "bg-booking-line",
        ].join(" ")}
      />
      <Benefit
        icon="bag-handle-outline"
        label="Hành lý xách tay"
        value={`${ticket.baggage.carryOn} kg tiêu chuẩn`}
      />
      <Benefit
        icon="briefcase-outline"
        label="Hành lý ký gửi"
        value={
          ticket.baggage.checked > 0
            ? `${ticket.baggage.checked} kg miễn phí`
            : "Không bao gồm"
        }
        positive={ticket.baggage.checked > 0}
      />
      <Benefit
        icon="calendar-outline"
        label="Đổi ngày bay"
        value={changeFee}
        positive={ticket.changeFee === 0}
      />
      <Benefit
        icon="close-circle-outline"
        label="Hoàn vé / Hủy chuyến"
        value={
          ticket.isRefundable ? "Theo điều kiện hạng vé" : "Không hoàn tiền"
        }
        positive={ticket.isRefundable}
      />
      {expanded && (
        <View className="bg-[#EAF1FE] p-3 mt-2 rounded-[8px]">
          <Text className="text-booking-ink text-[12px] font-bold mb-[5px]">
            Điều kiện áp dụng
          </Text>
          <Text className="text-[#536683] text-[11px] leading-[18px] mt-1">
            Giá hiển thị áp dụng cho một hành khách. Đổi chuyến cần thanh toán
            chênh lệch giá nếu có.
          </Text>
          <Text className="text-[#536683] text-[11px] leading-[18px] mt-1">
            {ticket.isRefundable
              ? "Hạng vé cho phép hoàn vé. Mức phí và số tiền hoàn được hãng xác nhận khi xử lý yêu cầu."
              : "Hạng vé này không hỗ trợ hoàn tiền."}
          </Text>
          <Text className="text-[#536683] text-[11px] leading-[18px] mt-1">
            Chỗ trống và giá được xác nhận lại khi đặt vé; chọn gói chưa giữ
            chỗ.
          </Text>
        </View>
      )}
      <View className="border-t-[1px] border-t-booking-line mt-3 pt-[13px] flex-row justify-between items-center gap-2 flex-wrap">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            setExpanded((value) => !value);
          }}
          className="flex-row items-center gap-[3px] min-h-7"
        >
          <Text className="text-[11px] font-bold text-booking-primary">
            Chi tiết điều kiện vé
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={12}
            color={c.primary}
          />
        </Pressable>
        <Text className="text-booking-muted text-[11px]">
          Còn {ticket.availableSeats} vé giá này
        </Text>
      </View>
    </Pressable>
  );
}
