import AppHeader from '../../components/common/AppHeader';
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { goBack, navigate, readRouteData } from "../../navigation/routes";
import { parseFlightDetail } from "../../navigation/validation";
import type { FlightDetailParams } from "../../navigation/types";
import { useFareSelection } from "../../hook/useFareSelection";
import { passengerCount, flightDate } from "../../utils/fare";
import { FareOptionCard } from "../../components/flight/fares/FareOptionCard";
import { FlightSummary } from "../../components/flight/fares/FlightSummary";
import { FareCheckoutBar } from "../../components/flight/fares/FareCheckoutBar";
import {
  FareSheet,
  FareComparison,
} from "../../components/flight/fares/FareSheet";
import { fareColors as c } from "../../components/flight/fares/theme";

/** Điểm vào route: kiểm tra URL và reset state khi người dùng đổi hành trình. */
export default function FareSelection() {
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
      <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-white">
        <AppHeader title="Chọn gói vé" back />
        <View className="flex-1 min-h-[260px] items-center justify-center p-6">
        <Text className="text-booking-ink text-[20px] font-extrabold text-center">
          Thông tin chuyến bay không hợp lệ.
        </Text>
        <Pressable
          onPress={() => router.replace("/")}
          className="bg-booking-primary rounded-[10px] px-6 py-3 mt-[18px]"
        >
          <Text className="text-white font-bold">Tìm chuyến bay</Text>
        </Pressable>
        </View>
      </SafeAreaView>
    );
  return <FareSelectionScreen key={data ?? flightId} params={params} />;
}

/** Màn chọn gói: UI chỉ điều phối component, giá và lựa chọn do hook quản lý. */
function FareSelectionScreen({ params }: { params: FlightDetailParams }) {
  const [activeLeg, setActiveLeg] = useState(0);
  const [sheet, setSheet] = useState<"compare" | "help" | null>(null);
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
  const current = fares.selected[activeLeg];
  const options = fares.options[activeLeg] ?? [];
  const roundTrip = legs.length === 2;

  /** Khi cả hai chặng đã có gói hợp lệ, chỉ chuyển mã gói; không đưa giá/PII vào URL. */
  const handleContinue = () => {
    if (fares.status !== "ready" || fares.total === null) return;
    if (roundTrip && activeLeg === 0) {
      setActiveLeg(1);
      return;
    }
    navigate("PassengerInfo", {
      flights: fares.selected.map((fare) => ({
        flightId: fare!.flightId,
        fareClassId: fare!.ticket.fareClassId,
      })),
      passengers: counts,
    });
  };

  return (
    <SafeAreaView edges={["left", "right"]} className="flex-1 bg-white">
      <AppHeader
        title="Chọn gói vé"
        subtitle="Chọn quyền lợi phù hợp cho hành trình"
        back
        action={{ label: "Trợ giúp chọn gói vé", icon: "help-circle-outline", onPress: () => setSheet("help") }}
      />
      <View className="flex-1 w-full max-w-[540px] self-center bg-booking-background">
        <View className="bg-white px-[15px] pt-3 pb-[13px] border-t-[1px] border-b-[1px] border-[#F0F2F8]">
          <View className="flex-row items-center gap-[6px]">
            <View className="w-[22px] h-[22px] rounded-[11px] bg-booking-primary items-center justify-center">
              <Ionicons name="airplane" size={13} color="white" />
            </View>
            <Text className="text-booking-ink text-[13px] font-extrabold flex-1">
              Chặng {activeLeg === 0 ? "đi" : "về"}:{" "}
              {current
                ? `${current.departure.airportCode} ┃ ${current.arrival.airportCode}`
                : "Đang cập nhật"}
            </Text>
            <View className="bg-[#E4EDFF] rounded-[8px] px-2 py-[3px]">
              <Text className="text-booking-primary text-[10px] font-bold">
                {activeLeg + 1}/{legs.length} Chặng
              </Text>
            </View>
          </View>
          <View className="flex-row gap-[9px] mt-3">
            {legs.map((leg, index) => {
              const flight = fares.selected[index];
              return (
                <Pressable
                  key={leg.flightId}
                  onPress={() => setActiveLeg(index)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeLeg === index }}
                  className={[
                    "flex-1 min-h-[34px] flex-row items-center justify-center gap-[5px] px-[6px] rounded-[7px] border",
                    activeLeg === index
                      ? "border-[#A7C2FF]"
                      : "border-booking-line",
                    activeLeg === index ? "bg-booking-soft" : "",
                  ].join(" ")}
                >
                  <Ionicons
                    name={
                      activeLeg === index
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={15}
                    color={activeLeg === index ? c.primary : c.muted}
                  />
                  <Text
                    className={[
                      "text-[12px]",
                      activeLeg === index
                        ? "text-booking-primary"
                        : "text-booking-muted",
                      activeLeg === index ? "font-bold" : "",
                    ].join(" ")}
                  >
                    Chiều {index === 0 ? "đi" : "về"}
                    {flight ? ` · ${flightDate(flight.departure.time)}` : ""}
                  </Text>
                </Pressable>
              );
            })}
            {!roundTrip && (
              <View className="justify-center px-3 border border-[#EEF0F6] rounded-[7px]">
                <Text className="text-[#A0A9BB] text-[12px]">Một chiều</Text>
              </View>
            )}
          </View>
        </View>
        <ScrollView
          key={activeLeg}
          className="flex-1"
          contentContainerClassName="p-[15px] pb-8"
        >
          {fares.status === "loading" ? (
            <View className="flex-1 min-h-[260px] items-center justify-center p-6">
              <ActivityIndicator size="large" color={c.primary} />
              <Text className="text-booking-muted text-[13px] leading-[21px] mt-3 text-center">
                Đang cập nhật giá và các gói vé…
              </Text>
            </View>
          ) : fares.status === "error" ? (
            <View className="flex-1 min-h-[260px] items-center justify-center p-6">
              <Ionicons
                name="cloud-offline-outline"
                size={38}
                color={c.muted}
              />
              <Text className="text-booking-muted text-[13px] leading-[21px] mt-3 text-center">
                {fares.error}
              </Text>
              <Pressable
                onPress={fares.reload}
                className="bg-booking-primary rounded-[10px] px-6 py-3 mt-[18px]"
              >
                <Text className="text-white font-bold">Thử lại</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {current && <FlightSummary flight={current} />}
              <View className="flex-row items-center gap-2 mb-[22px]">
                <View className="flex-1">
                  <Text className="text-booking-ink text-[17px] font-extrabold">
                    Chọn hạng vé áp dụng
                  </Text>
                  <Text className="text-[#536F97] text-[11px] leading-[17px] mt-[3px]">
                    Giá dành cho 01 hành khách · {count} khách trong đơn
                  </Text>
                </View>
                <Pressable
                  disabled={!options.length}
                  onPress={() => setSheet("compare")}
                  hitSlop={8}
                >
                  <Text className="text-booking-primary text-[11px] font-bold">
                    So sánh nhanh ↔
                  </Text>
                </Pressable>
              </View>
              {!options.length ? (
                <View className="flex-1 min-h-[260px] items-center justify-center p-6">
                  <Text className="text-booking-ink text-[20px] font-extrabold text-center">
                    Chuyến bay đã hết gói phù hợp.
                  </Text>
                  <Text className="text-booking-muted text-[13px] leading-[21px] mt-3 text-center">
                    Vui lòng quay lại để chọn chuyến khác hoặc giảm số hành
                    khách.
                  </Text>
                  <Pressable
                    onPress={goBack}
                    className="bg-booking-primary rounded-[10px] px-6 py-3 mt-[18px]"
                  >
                    <Text className="text-white font-bold">
                      Chọn chuyến khác
                    </Text>
                  </Pressable>
                </View>
              ) : (
                options.map((fare) => (
                  <FareOptionCard
                    key={fare.ticket.fareClassId}
                    fare={fare}
                    selected={
                      current?.ticket.fareClassId === fare.ticket.fareClassId
                    }
                    onSelect={fares.select}
                  />
                ))
              )}
              <View className="flex-row gap-[9px] p-[13px] border border-[#DFE8FF] bg-[#EEF3FF] rounded-[12px] mt-3">
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={c.primary}
                />
                <Text className="flex-1 text-[11px] leading-[18px] text-[#536F97]">
                  Giá và chỗ trống được cập nhật từ hãng qua hệ thống. Chọn gói
                  chưa giữ chỗ; điều kiện đổi, hoàn áp dụng theo từng hạng vé.
                  Thuế, phí và giá trẻ em/em bé được xác nhận khi đặt vé.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
        <FareCheckoutBar
          total={fares.total}
          count={count}
          disabled={fares.status !== "ready"}
          label={roundTrip && activeLeg === 0 ? "Chọn chiều về" : "Tiếp tục"}
          onContinue={handleContinue}
        />
        <FareSheet
          visible={sheet !== null}
          title={
            sheet === "compare"
              ? "So sánh các gói vé"
              : "Chọn gói phù hợp với bạn"
          }
          onClose={() => setSheet(null)}
        >
          {sheet === "compare" ? (
            <FareComparison fares={options} />
          ) : (
            <Text className="text-[#536683] text-[14px] leading-[24px]">
              Chọn một gói cho mỗi chặng để xem tổng giá tạm tính. Chạm “Chi
              tiết điều kiện vé” để xem chính sách đổi và hoàn. Bạn có thể thay
              đổi lựa chọn trước khi nhập thông tin hành khách. Giá và số chỗ
              chỉ được đảm bảo sau khi đặt vé thành công.
            </Text>
          )}
        </FareSheet>
      </View>
    </SafeAreaView>
  );
}
