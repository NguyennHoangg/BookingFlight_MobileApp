import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { goBack, navigate, readRouteData } from "../../navigation/routes";
import { parseFlightDetail } from "../../navigation/validation";
import type { FlightDetailParams } from "../../navigation/types";
import { useFareSelection } from "../../hook/useFareSelection";
import { useFlightFavorite } from "../../hook/useFlightFavorite";
import { useAppSelector } from "../../store";
import {
  formatFareMoney,
  passengerCount,
  flightDate,
  flightDuration,
  flightTime,
} from "../../utils/fare";
import {
  BookingSection,
  BookingRow,
} from "../../components/flight/BookingSection";
import { FareCheckoutBar } from "../../components/flight/fares/FareCheckoutBar";
import { FareSheet } from "../../components/flight/fares/FareSheet";
import RemoteImage from "../../components/common/RemoteImage";

/** Route riêng cho màn chi tiết; màn chọn gói được giữ tại /FareSelection. */
export default function FlightDetail() {
  const { data, flightId } = useLocalSearchParams<{
    data?: string;
    flightId?: string;
  }>();
  const params = useMemo(
    () => parseFlightDetail(readRouteData(data) ?? { flightId }),
    [data, flightId],
  );
  if (!params)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-booking-background px-6">
        <Text className="text-booking-ink">
          Thông tin chuyến bay không hợp lệ.
        </Text>
        <Pressable onPress={goBack} className="mt-4 p-3">
          <Text className="font-bold text-booking-primary">Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  return <FlightDetails key={data ?? flightId} params={params} />;
}

/** Nội dung chi tiết luôn dùng giá/điều kiện vừa tải lại, không dùng giá snapshot trên URL. */
function FlightDetails({ params }: { params: FlightDetailParams }) {
  const [activeLeg, setActiveLeg] = useState(0);
  const [help, setHelp] = useState(false);
  const counts = params.selection?.search.passengers ?? {
    adults: 1,
    children: 0,
    infants: 0,
  };
  const count = passengerCount(counts);
  const legs = useMemo(
    () => [
      {
        flightId: params.flightId,
        preferredFareId: params.selection?.departureFlight.ticket.fareClassId,
      },
      ...(params.selection?.returnFlight
        ? [
            {
              flightId: params.selection.returnFlight.flightId,
              preferredFareId: params.selection.returnFlight.ticket.fareClassId,
            },
          ]
        : []),
    ],
    [params],
  );
  const fares = useFareSelection(legs, count);
  const flight = fares.selected[activeLeg];
  const authenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const favorite = useFlightFavorite(legs[activeLeg].flightId, authenticated);
  const proceed = () => {
    if (fares.total === null) return;
    navigate("FareSelection", params);
  };
  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <View className="w-full max-w-[540px] flex-1 self-center bg-booking-background">
        <View className="flex-row items-center bg-white px-4 py-4">
          <Pressable
            onPress={goBack}
            hitSlop={12}
            accessibilityLabel="Quay lại"
          >
            <Ionicons name="arrow-back" size={22} color="#12263F" />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-bold text-booking-ink">
            Chi tiết chuyến bay
          </Text>
          <Pressable
            onPress={() =>
              authenticated ? void favorite.toggle() : setHelp(true)
            }
            disabled={favorite.busy}
            hitSlop={12}
            accessibilityLabel={
              favorite.favorite ? "Bỏ yêu thích" : "Lưu chuyến bay"
            }
          >
            <Ionicons
              name={favorite.favorite ? "heart" : "heart-outline"}
              size={22}
              color="#536F97"
            />
          </Pressable>
        </View>
        {legs.length > 1 && (
          <View className="flex-row gap-2 bg-white px-4 pb-3">
            {legs.map((leg, index) => (
              <Pressable
                key={leg.flightId}
                onPress={() => setActiveLeg(index)}
                className={`flex-1 rounded-lg border py-2 ${index === activeLeg ? "border-blue-300 bg-booking-soft" : "border-booking-line bg-white"}`}
              >
                <Text
                  className={`text-center text-xs font-semibold ${index === activeLeg ? "text-booking-primary" : "text-booking-muted"}`}
                >
                  Chiều {index === 0 ? "đi" : "về"}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-8">
          {fares.status === "loading" ? (
            <ActivityIndicator className="my-24" size="large" color="#2864FF" />
          ) : fares.status === "error" ? (
            <View className="items-center py-16">
              <Text className="text-center text-booking-danger">
                {fares.error}
              </Text>
              <Pressable
                onPress={fares.reload}
                className="mt-4 rounded-xl bg-booking-primary px-6 py-3"
              >
                <Text className="font-bold text-white">Thử lại</Text>
              </Pressable>
            </View>
          ) : !flight ? (
            <View className="py-20">
              <Text className="text-center text-booking-muted">
                Chuyến bay không còn gói vé đủ chỗ. Vui lòng chọn chuyến khác.
              </Text>
            </View>
          ) : (
            <>
              <View className="mb-4 flex-row items-center justify-between rounded-xl border border-blue-100 bg-booking-soft px-3 py-3">
                <Text className="text-[11px] font-semibold text-booking-primary">
                  ● Giá và chỗ trống mới nhất
                </Text>
                <Text className="rounded-md bg-white px-2 py-1 text-[10px] text-[#536F97]">
                  Còn {flight.ticket.availableSeats} chỗ
                </Text>
              </View>
              {!!favorite.error && (
                <Text className="mb-3 text-xs text-booking-danger">
                  {favorite.error}
                </Text>
              )}
              <View className="mb-4 rounded-2xl border border-booking-line bg-white p-4">
                <View className="flex-row items-center gap-2 border-b border-dashed border-booking-line pb-4">
                  <View className="rounded-xl bg-booking-soft p-2">
                    <RemoteImage
                      uri={flight.airline.logoUrl}
                      width={26}
                      height={26}
                      fallbackIconSize={24}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-booking-ink">
                      {flight.airline.name}
                    </Text>
                    <Text className="mt-1 text-[11px] text-[#536F97]">
                      {flight.flightNumber} · {flight.aircraft.model}
                    </Text>
                  </View>
                  <Text className="max-w-[110px] rounded-md border border-blue-200 bg-booking-soft px-2 py-1 text-[10px] text-booking-primary">
                    {flight.ticket.fareClassName}
                  </Text>
                </View>
                <View className="my-4 flex-row items-center justify-between">
                  <Text className="text-xs font-semibold text-booking-ink">
                    ▣ {flightDate(flight.departure.time)}
                  </Text>
                  <Text className="rounded bg-teal-50 px-2 py-1 text-[10px] text-teal-700">
                    Bay thẳng
                  </Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-booking-ink">
                      {flightTime(flight.departure.time)}
                    </Text>
                    <Text className="mt-1 text-lg font-bold text-booking-primary">
                      {flight.departure.airportCode}
                    </Text>
                    <Text className="text-xs text-[#536F97]">
                      {flight.departure.city}
                    </Text>
                    <Text className="mt-1 text-[10px] leading-4 text-booking-muted">
                      {flight.departure.airportName}
                    </Text>
                    {flight.departure.gate && (
                      <Text className="mt-2 self-start rounded bg-booking-soft px-2 py-1 text-[10px] text-[#536F97]">
                        Ga {flight.departure.terminal} · Cổng{" "}
                        {flight.departure.gate}
                      </Text>
                    )}
                  </View>
                  <View className="mt-6 flex-1 items-center">
                    <Text className="text-[11px] text-[#536F97]">
                      {flightDuration(flight.durationMinutes)}
                    </Text>
                    <View className="my-2 w-full flex-row items-center">
                      <View className="h-2 w-2 rounded-full border border-booking-primary" />
                      <View className="h-px flex-1 bg-blue-300" />
                      <Ionicons name="airplane" size={19} color="#2864FF" />
                      <View className="h-px flex-1 bg-blue-300" />
                      <View className="h-2 w-2 rounded-full bg-booking-primary" />
                    </View>
                    <Text className="text-center text-[10px] text-teal-700">
                      Không điểm dừng
                    </Text>
                  </View>
                  <View className="flex-1 items-end">
                    <Text className="text-2xl font-bold text-booking-ink">
                      {flightTime(flight.arrival.time)}
                    </Text>
                    <Text className="mt-1 text-lg font-bold text-booking-primary">
                      {flight.arrival.airportCode}
                    </Text>
                    <Text className="text-right text-xs text-[#536F97]">
                      {flight.arrival.city}
                    </Text>
                    <Text className="mt-1 text-right text-[10px] leading-4 text-booking-muted">
                      {flight.arrival.airportName}
                    </Text>
                  </View>
                </View>
              </View>
              <BookingSection
                icon="airplane"
                title="Chi tiết hành trình"
                right="Bay thẳng"
              >
                <View className="flex-row flex-wrap gap-3">
                  {[
                    [
                      "Dòng máy bay",
                      flight.aircraft.model,
                      `Bố trí ghế ${flight.aircraft.seatLayout ?? "Chưa công bố"}`,
                    ],
                    [
                      "Thời gian bay",
                      flightDuration(flight.durationMinutes),
                      `${flight.departure.airportCode} → ${flight.arrival.airportCode}`,
                    ],
                    [
                      "Nhà ga đi",
                      flight.departure.terminal ?? "Chưa công bố",
                      flight.departure.airportName,
                    ],
                    [
                      "Tiện ích trên chuyến",
                      "Theo thông tin hãng",
                      "Kiểm tra khi đặt vé",
                    ],
                  ].map(([label, value, note]) => (
                    <View
                      key={label}
                      className="min-w-[130px] flex-1 rounded-xl border border-blue-100 bg-[#F5F8FF] p-3"
                    >
                      <Text className="text-[10px] text-[#536F97]">
                        {label}
                      </Text>
                      <Text className="my-1 text-sm font-bold text-booking-ink">
                        {value}
                      </Text>
                      <Text className="text-[10px] leading-4 text-booking-muted">
                        {note}
                      </Text>
                    </View>
                  ))}
                </View>
              </BookingSection>
              <BookingSection
                icon="bag-handle-outline"
                title="Hành lý bao gồm"
                right="Theo hạng vé"
              >
                <BookingRow
                  label="Hành lý xách tay"
                  value={`${flight.ticket.baggage.carryOn} kg`}
                  emphasis
                />
                <BookingRow
                  label="Hành lý ký gửi"
                  value={
                    flight.ticket.baggage.checked
                      ? `${flight.ticket.baggage.checked} kg`
                      : "Không bao gồm"
                  }
                  emphasis
                />
                <Text className="mt-2 rounded-lg bg-booking-soft p-3 text-[11px] leading-5 text-[#536F97]">
                  {flight.ticket.baggage.info}
                </Text>
                <Pressable
                  onPress={() => setHelp(true)}
                  className="mt-3 flex-row items-center gap-2"
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={16}
                    color="#087F73"
                  />
                  <Text className="flex-1 text-[11px] text-[#536F97]">
                    Cần thêm hành lý? Xem điều kiện của hãng
                  </Text>
                </Pressable>
              </BookingSection>
              <BookingSection
                icon="shield-checkmark-outline"
                title="Điều kiện vé"
                right={flight.ticket.fareClassName}
              >
                <BookingRow
                  label="Hoàn / Hủy vé"
                  value={
                    flight.ticket.isRefundable
                      ? "Được phép theo điều kiện hãng"
                      : "Không hoàn tiền"
                  }
                />
                <BookingRow
                  label="Đổi ngày / Giờ bay"
                  value={
                    flight.ticket.changeFee
                      ? `${formatFareMoney(flight.ticket.changeFee)} + chênh lệch giá`
                      : "Miễn phí đổi + chênh lệch giá"
                  }
                />
                <BookingRow
                  label="Đổi tên hành khách"
                  value="Cần xác nhận với hãng"
                />
              </BookingSection>
              <BookingSection
                icon="receipt-outline"
                title="Chi tiết giá vé"
                right={`${count} hành khách`}
              >
                {fares.selected.map(
                  (leg, index) =>
                    leg && (
                      <BookingRow
                        key={leg.flightId}
                        label={`${index === 0 ? "Chiều đi" : "Chiều về"} · ${leg.ticket.fareClassName} (x${count})`}
                        value={formatFareMoney(leg.ticket.price * count)}
                      />
                    ),
                )}
                <BookingRow
                  label="Thuế, phí sân bay & an ninh"
                  value="Chưa tách riêng từ hãng"
                />
                <BookingRow label="Ưu đãi áp dụng" value="Chưa áp dụng" />
                <View className="mt-2 border-t border-dashed border-booking-line pt-3">
                  <BookingRow
                    label="Tổng cộng dự tính"
                    value={formatFareMoney(fares.total ?? 0)}
                    emphasis
                  />
                </View>
              </BookingSection>
              <View className="flex-row items-center justify-center gap-2 py-2">
                <Ionicons
                  name="lock-closed-outline"
                  size={14}
                  color="#087F73"
                />
                <Text className="text-[10px] text-booking-muted">
                  Giá và chỗ được xác nhận lại khi đặt vé
                </Text>
              </View>
            </>
          )}
        </ScrollView>
        <FareCheckoutBar
          total={fares.total}
          count={count}
          disabled={fares.status !== "ready"}
          label="Tiếp tục đặt vé"
          onContinue={proceed}
        />
        <FareSheet
          title="Thông tin chuyến bay"
          visible={help}
          onClose={() => setHelp(false)}
        >
          <Text className="text-sm leading-6 text-[#536F97]">
            {authenticated
              ? "Hành lý mua thêm và tiện ích được hãng xác nhận theo chuyến và hạng vé. Bạn có thể xem các quyền lợi đang mở bán ở bước chọn gói."
              : "Bạn có thể tiếp tục đặt vé khi chưa đăng nhập. Để lưu yêu thích hoặc dùng hành khách đã lưu, vui lòng đăng nhập tài khoản."}
          </Text>
          <Pressable
            onPress={() => setHelp(false)}
            className="mt-5 rounded-xl bg-booking-primary p-3"
          >
            <Text className="text-center font-bold text-white">Đã hiểu</Text>
          </Pressable>
        </FareSheet>
      </View>
    </SafeAreaView>
  );
}
