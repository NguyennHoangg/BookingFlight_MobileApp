import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Switch, Text, View } from "react-native";
import { useAppDispatch, useAppSelector } from "../../store";
import { setServiceCatalog, skipServices, updateServices } from "../../store/slices/bookingSlice";
import { bookingTotals, serviceKey } from "../../utils/booking";
import { formatFareMoney } from "../../utils/fare";
import { fullPassengerName } from "../../utils/passengerForm";
import { navigate } from "../../navigation/routes";
import { BookingCard, BookingLayout, BookingLink, MissingBooking } from "../../components/booking/BookingLayout";
import { useTaxAndFee } from "../../hook/useTaxAndFee";
import { TaxAndFeeCard } from "../../components/booking/TaxAndFeeCard";
import { getBookingServices } from "../../api/booking.api";
import { isAxiosError } from "axios";

export default function AdditionalServices() {
  const dispatch = useAppDispatch();
  const draft = useAppSelector(state => state.booking.draft);
  const [legIndex, setLegIndex] = useState(0);
  const [passengerIndex, setPassengerIndex] = useState(0);
  const [result, setResult] = useState({ key: "", attempt: -1, error: "" });
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify(draft?.params.flights.map(leg => leg.flightId) ?? []);
  const loading = result.key !== key || result.attempt !== attempt;
  const error = loading ? "" : result.error;
  const taxes = useTaxAndFee(draft?.fares ?? [], draft?.passengers.length ?? 0);
  useEffect(() => {
    const controller = new AbortController();
    void getBookingServices(JSON.parse(key), controller.signal).then(catalog => {
      if (!controller.signal.aborted) { dispatch(setServiceCatalog(catalog)); setResult({ key, attempt, error: "" }); }
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) {
        setResult({ key, attempt, error: isAxiosError<{ message?: string }>(cause) ? cause.response?.data.message || "Không tải được dịch vụ." : "Không tải được dịch vụ." });
      }
    });
    return () => controller.abort();
  }, [key, attempt, dispatch]);
  if (!draft) return <MissingBooking />;
  const fare = draft.fares[legIndex] ?? draft.fares[0];
  const passenger = draft.passengers[passengerIndex] ?? draft.passengers[0];
  const selected = draft.services[serviceKey(fare.flightId, passengerIndex)]?.serviceIds ?? [];
  const catalog = (draft.catalog ?? []).filter(service => service.airlineId === fare.airline.id);
  const totals = bookingTotals(draft, taxes.total);
  const next = () => { if (taxes.status === "ready" && !loading && !error) navigate("BookingConfirmation"); };
  return <BookingLayout title="Dịch vụ bổ sung" step={2} total={loading || error ? null : totals.total} count={draft.passengers.length} onContinue={next}
    footer={<BookingLink onPress={() => { if (taxes.status === "ready") { dispatch(skipServices()); navigate("BookingConfirmation"); } }}>Bỏ qua dịch vụ</BookingLink>}>
    <TaxAndFeeCard taxes={taxes} fares={draft.fares} />
    <BookingCard title="Chọn chặng và hành khách">
      <View className="flex-row flex-wrap gap-2">
        {draft.fares.map((leg, index) => <Pressable key={leg.flightId} onPress={() => setLegIndex(index)} className={`rounded-xl border p-3 ${index === legIndex ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}>
          <Text>{leg.departure.airportCode} → {leg.arrival.airportCode}</Text>
        </Pressable>)}
      </View>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {draft.passengers.map((item, index) => <Pressable key={index} onPress={() => setPassengerIndex(index)} className={`rounded-xl border p-3 ${index === passengerIndex ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}>
          <Text>{fullPassengerName(item)}</Text>
        </Pressable>)}
      </View>
      <Text className="mt-3 text-xs text-gray-500">Vé đã gồm {fare.ticket.baggage.checked}kg ký gửi và {fare.ticket.baggage.carryOn}kg xách tay.</Text>
    </BookingCard>
    {loading ? <ActivityIndicator accessibilityLabel="Đang tải dịch vụ" /> : error ? <BookingCard><Text>{error}</Text><BookingLink onPress={() => setAttempt(value => value + 1)}>Thử lại</BookingLink></BookingCard> : passenger.kind === "infant" ?
      <BookingCard><Text>Em bé đi cùng người lớn, không mua dịch vụ riêng.</Text></BookingCard> : catalog.length === 0 ?
      <BookingCard><Text>Hãng bay chưa cung cấp dịch vụ bổ sung cho hành trình này.</Text></BookingCard> : catalog.map(service =>
        <BookingCard key={service.id} title={service.name}>
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-blue-600">{formatFareMoney(service.price)} / khách / chặng</Text>
            <Switch accessibilityLabel={service.name} value={selected.includes(service.id)} onValueChange={enabled => {
              const remaining = service.type === "BAGGAGE" ? selected.filter(id => !catalog.some(s => s.id === id && s.type === "BAGGAGE")) : selected.filter(id => id !== service.id);
              dispatch(updateServices({ flightId: fare.flightId, passengerIndex, changes: { serviceIds: enabled ? [...remaining, service.id] : remaining } }));
            }} />
          </View>
        </BookingCard>)}
    <Text className="text-center text-xs text-gray-500">Giá dịch vụ được tải từ danh mục của hãng trong hệ thống và kiểm tra lại khi đặt vé.</Text>
  </BookingLayout>;
}
