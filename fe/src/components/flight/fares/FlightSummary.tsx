import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { FlightFare } from "../../../api/flight.api";
import RemoteImage from "../../common/RemoteImage";
import { flightDate, flightDuration, flightTime } from "../../../utils/fare";
import { fareColors as c } from "./theme";

/** Tóm tắt chuyến đang chọn; nội dung được đọc lại từ BE cùng các gói vé. */
export function FlightSummary({ flight }: { flight: FlightFare }) {
  return (
    <View className="bg-white border border-booking-line p-[15px] rounded-[14px] mb-6">
      <View className="flex-row items-center gap-[5px] flex-wrap">
        <View className="bg-booking-soft p-1 rounded-[5px] mr-[3px]">
          <RemoteImage
            uri={flight.airline.logoUrl}
            width={25}
            height={25}
            fallbackIconSize={21}
          />
        </View>
        <Text
          className="text-[13px] text-booking-ink font-extrabold shrink"
          numberOfLines={1}
        >
          {flight.airline.name}
        </Text>
        <Text className="text-booking-muted text-[11px]">
          · {flight.flightNumber}
        </Text>
        <View className="ml-auto bg-booking-soft rounded-[4px] p-1">
          <Text className="text-[#4F668B] text-[9px]">
            {flight.aircraft.model}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center mt-[19px] gap-[7px]">
        <View className="flex-1">
          <Text className="text-booking-ink text-[23px] font-extrabold">
            {flightTime(flight.departure.time)}
          </Text>
          <Text className="text-booking-muted text-[10px] mt-1 leading-[15px]">
            <Text className="text-booking-ink font-semibold">
              {flight.departure.airportCode}
            </Text>{" "}
            ({flight.departure.airportName})
          </Text>
        </View>
        <View className="flex-[1.3] items-center">
          <Text className="text-[#50698E] text-[10px]">
            {flightDuration(flight.durationMinutes)} bay thẳng
          </Text>
          <View className="flex-row items-center w-full mt-[6px]">
            <View className="w-[5px] h-[5px] rounded-[3px] bg-booking-primary" />
            <View className="h-[1px] bg-[#A5BFFF] flex-1" />
            <Ionicons name="airplane" size={15} color={c.primary} />
            <View className="h-[1px] bg-[#A5BFFF] flex-1" />
            <View className="w-[5px] h-[5px] rounded-[3px] border border-booking-primary" />
          </View>
          <Text className="text-[#6D82A3] text-[10px] mt-1">
            {flightDate(flight.departure.time)}
          </Text>
        </View>
        <View className={["flex-1 items-end"].join(" ")}>
          <Text className="text-booking-ink text-[23px] font-extrabold">
            {flightTime(flight.arrival.time)}
          </Text>
          <Text
            className={[
              "text-booking-muted text-[10px] mt-1 leading-[15px] text-right",
            ].join(" ")}
          >
            <Text className="text-booking-ink font-semibold">
              {flight.arrival.airportCode}
            </Text>{" "}
            ({flight.arrival.airportName})
          </Text>
        </View>
      </View>
    </View>
  );
}
