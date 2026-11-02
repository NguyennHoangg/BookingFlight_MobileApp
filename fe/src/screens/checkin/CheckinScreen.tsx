import React, { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCheckin } from "../../hook/useCheckin";
import { groupCheckinTickets } from "../../utils/checkin";
import { flightDate, flightTime } from "../../utils/fare";
import { BookingCard, BookingLink } from "../../components/booking/BookingLayout";
import { FareSheet } from "../../components/flight/fares/FareSheet";
import { CheckinPassCard } from "../../components/checkin/CheckinPassCard";
import type { CheckinState, CheckinTicket } from "../../api/checkin.api";
import { useAppDispatch, useAppSelector } from "../../store";
import { prefillCheckin } from "../../store/slices/bookingSlice";

const STATE_LABELS: Record<CheckinState, string> = {
  OPEN: "Có thể check-in", NOT_OPEN: "Chưa mở", CLOSED: "Đã đóng",
  CHECKED_IN: "Đã check-in", AIRPORT_REQUIRED: "Làm thủ tục tại quầy", UNAVAILABLE: "Không khả dụng",
};

export default function CheckinScreen() {
  const [bookingCode, setBookingCode] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [passId, setPassId] = useState<string | null>(null);
  const checkin = useCheckin();
  const dispatch = useAppDispatch();
  const prefill = useAppSelector(state => state.booking.checkinPrefill);
  const resetCheckin = checkin.reset;
  useFocusEffect(useCallback(() => {
    if (!prefill) return;
    resetCheckin();
    setBookingCode(prefill.bookingCode);
    setLastName(prefill.lastName);
    setAccepted(false); setPassId(null); setConfirmOpen(false);
    dispatch(prefillCheckin(null));
  }, [prefill, resetCheckin, dispatch]));
  const busy = checkin.status !== "idle";
  const result = checkin.result;
  const selected = result?.tickets.filter(ticket => checkin.selectedIds.includes(ticket.id)) ?? [];
  const pass = result?.tickets.find(ticket => ticket.id === passId && ticket.boardingPass);
  const lookup = () => { void checkin.lookup({ bookingCode, lastName }); };
  async function confirm() {
    const firstSelected = checkin.selectedIds[0];
    if (await checkin.confirm(accepted)) {
      setConfirmOpen(false); setAccepted(false); setPassId(firstSelected);
    }
  }
  function reset() {
    if (busy) return;
    checkin.reset(); setBookingCode(""); setLastName(""); setAccepted(false); setPassId(null);
  }
  return (
    <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-booking-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerClassName="w-full max-w-[540px] self-center gap-4 p-4 pb-8">
          <View className="rounded-2xl bg-booking-primary p-5">
            <View className="flex-row items-center gap-2"><Ionicons name="airplane" size={24} color="white" /><Text className="text-lg font-bold text-white">Check-in online</Text></View>
            <Text className="mt-2 text-xs leading-5 text-white">Tra cứu vé, chọn hành khách và xác nhận check-in. Mở từ 24 giờ đến trước giờ khởi hành 60 phút cho chuyến nội địa Việt Nam.</Text>
          </View>
          {checkin.error && !confirmOpen && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="rounded-xl bg-red-50 p-4 text-sm leading-5 text-booking-danger">{checkin.error}</Text>}
          {!result ? (
            <BookingCard title="Tra cứu đặt chỗ" icon="search-outline">
              <Text className="mb-2 text-xs font-bold text-booking-ink">Mã đặt chỗ (PNR) hoặc số vé</Text>
              <TextInput accessibilityLabel="Mã đặt chỗ hoặc số vé" value={bookingCode} onChangeText={text => setBookingCode(text.toUpperCase())} editable={!busy} autoCapitalize="characters" autoCorrect={false} maxLength={30} placeholder="ABC123 hoặc 738-2938401928" placeholderTextColor="#718099" className="mb-4 min-h-[48px] rounded-xl border border-booking-line bg-white px-3 text-sm text-booking-ink" />
              <Text className="mb-2 text-xs font-bold text-booking-ink">Họ của hành khách</Text>
              <TextInput accessibilityLabel="Họ của hành khách" value={lastName} onChangeText={setLastName} editable={!busy} autoCapitalize="characters" autoCorrect={false} maxLength={80} placeholder="Ví dụ: NGUYEN hoặc Nguyễn" placeholderTextColor="#718099" returnKeyType="search" onSubmitEditing={lookup} className="mb-4 min-h-[48px] rounded-xl border border-booking-line bg-white px-3 text-sm text-booking-ink" />
              <Text className="mb-4 text-xs leading-5 text-booking-muted">Nhập họ ở đầu tên hành khách như trên vé. Có thể nhập có dấu hoặc không dấu. Dùng số vé để chỉ tra cứu một hành khách.</Text>
              <ActionButton label={busy ? "Đang tra cứu…" : "Tìm kiếm đặt chỗ"} disabled={busy} onPress={lookup} />
              {busy && <ActivityIndicator className="mt-3" color="#2864FF" accessibilityLabel="Đang tải đặt chỗ" />}
            </BookingCard>
          ) : (
            <>
              <BookingCard title={`Đặt chỗ ${result.pnrCode}`} icon="ticket-outline">
                <Text className="text-xs leading-5 text-booking-muted">Chọn các hành khách đủ điều kiện trên từng chặng. Ghế đã được gán theo vé, không phát sinh phí check-in.</Text>
                <Text className="mt-2 text-[10px] text-booking-muted">Trạng thái lúc {flightTime(result.serverTime)} · {flightDate(result.serverTime)}</Text>
                <View className="flex-row justify-between">
                  <BookingLink onPress={() => { if (!busy) void checkin.refresh(); }}>Cập nhật trạng thái</BookingLink>
                  <BookingLink onPress={reset}>Tra cứu mã khác</BookingLink>
                </View>
              </BookingCard>
              {groupCheckinTickets(result.tickets).map(tickets => {
                const flight = tickets[0].flight;
                return (
                  <BookingCard key={flight.id} title={`${flight.departure.code} → ${flight.arrival.code}`} icon="airplane-outline">
                    <Text className="text-sm font-bold text-booking-ink">{flight.airlineName} · {flight.number}</Text>
                    <Text className="mb-2 mt-1 text-xs text-booking-muted">{flightDate(flight.departure.time)} · {flightTime(flight.departure.time)} – {flightTime(flight.arrival.time)}{flight.status === "DELAYED" ? " · Chuyến bay bị hoãn" : ""}</Text>
                    {tickets.map(ticket => <PassengerCheckinRow key={ticket.id} ticket={ticket} selected={checkin.selectedIds.includes(ticket.id)} busy={busy} onToggle={() => checkin.toggleTicket(ticket.id)} onViewPass={() => setPassId(ticket.id)} />)}
                  </BookingCard>
                );
              })}
              <ActionButton label={`Tiếp tục check-in (${checkin.selectedIds.length} vé)`} disabled={busy || !checkin.selectedIds.length} onPress={() => { setAccepted(false); setConfirmOpen(true); }} />
            </>
          )}
          <BookingCard title="Lưu ý làm thủ tục" icon="information-circle-outline">
            <Text className="text-xs leading-6 text-booking-muted">• Chỉ áp dụng với đặt chỗ đã xác nhận và ghế đã được gán.{"\n"}• Đoàn có em bé và các trường hợp cần hỗ trợ ghế làm thủ tục tại quầy.{"\n"}• Có thể tra cứu lại để xem xác nhận đã lưu trên hệ thống.{"\n"}• Ứng dụng chưa liên thông check-in với hãng. Xác nhận và QR trong ứng dụng chưa thay thế thẻ lên máy bay của hãng.</Text>
          </BookingCard>
        </ScrollView>
      </KeyboardAvoidingView>
      <FareSheet visible={confirmOpen} title="Xác nhận check-in" onClose={() => { if (!busy) setConfirmOpen(false); }}>
        <Text className="mb-3 text-sm leading-6 text-booking-muted">Kiểm tra đúng hành khách, chuyến bay và ghế trước khi xác nhận.</Text>
        {selected.map(ticket => <View key={ticket.id} className="mb-3 rounded-xl bg-booking-soft p-3"><Text className="text-sm font-bold text-booking-ink">{ticket.passengerName}</Text><Text className="mt-1 text-xs leading-5 text-booking-muted">{ticket.flight.number} · {ticket.flight.departure.code} → {ticket.flight.arrival.code}{"\n"}{flightDate(ticket.flight.departure.time)} · {flightTime(ticket.flight.departure.time)} · Ghế {ticket.seat.number}</Text></View>)}
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: accepted, disabled: busy }} disabled={busy} onPress={() => setAccepted(value => !value)} className="mb-4 min-h-[48px] flex-row items-center gap-3 py-2"><Ionicons name={accepted ? "checkbox" : "square-outline"} size={25} color="#2864FF" /><Text className="flex-1 text-sm leading-5 text-booking-ink">Tôi đã kiểm tra thông tin hành khách và hành trình.</Text></Pressable>
        {checkin.error && <Text accessibilityRole="alert" className="mb-3 text-xs leading-5 text-booking-danger">{checkin.error}</Text>}
        <ActionButton label={checkin.status === "confirm" ? "Đang xác nhận…" : "Xác nhận check-in"} disabled={busy || !accepted || !selected.length} onPress={() => void confirm()} />
        {!busy && <BookingLink onPress={() => setConfirmOpen(false)}>Quay lại chọn hành khách</BookingLink>}
      </FareSheet>
      <FareSheet visible={!!pass} title="Xác nhận check-in" onClose={() => setPassId(null)}>{pass && result && <CheckinPassCard key={pass.id} pnrCode={result.pnrCode} ticket={pass} />}</FareSheet>
    </SafeAreaView>
  );
}

function PassengerCheckinRow({ ticket, selected, busy, onToggle, onViewPass }: {
  ticket: CheckinTicket; selected: boolean; busy: boolean; onToggle: () => void; onViewPass: () => void;
}) {
  const state = ticket.eligibility.state;
  const canSelect = state === "OPEN";
  return (
    <View className="mt-3 border-t border-booking-line pt-3">
      <Pressable accessibilityRole="checkbox" accessibilityLabel={`${ticket.passengerName}, ghế ${ticket.seat.number}`} accessibilityState={{ checked: selected, disabled: !canSelect || busy }} disabled={!canSelect || busy} onPress={onToggle} className="min-h-[48px] flex-row items-center gap-3">
        <Ionicons name={state === "CHECKED_IN" ? "checkmark-circle" : selected ? "checkbox" : "square-outline"} size={25} color={state === "CHECKED_IN" ? "#087F73" : canSelect ? "#2864FF" : "#9CA3AF"} />
        <View className="flex-1"><Text className="text-sm font-bold text-booking-ink">{ticket.passengerName}</Text><Text className="mt-1 text-xs text-booking-muted">{ticket.passengerType === "ADULT" ? "Người lớn" : ticket.passengerType === "CHILD" ? "Trẻ em" : "Em bé"} · Ghế {ticket.seat.number} · {ticket.fareClassName}</Text></View>
      </Pressable>
      <Text className={`mt-2 text-xs font-bold ${state === "OPEN" || state === "CHECKED_IN" ? "text-[#087F73]" : "text-booking-muted"}`}>{STATE_LABELS[state]}</Text>
      <Text className="mt-1 text-xs leading-5 text-booking-muted">{ticket.eligibility.reason}</Text>
      {state === "NOT_OPEN" && ticket.eligibility.opensAt && <Text className="mt-1 text-xs text-booking-muted">Mở lúc {flightTime(ticket.eligibility.opensAt)} · {flightDate(ticket.eligibility.opensAt)}</Text>}
      {state === "OPEN" && ticket.eligibility.closesAt && <Text className="mt-1 text-xs text-booking-muted">Đóng lúc {flightTime(ticket.eligibility.closesAt)} · {flightDate(ticket.eligibility.closesAt)}</Text>}
      {ticket.boardingPass && <BookingLink onPress={onViewPass}>Xem xác nhận và mã QR</BookingLink>}
    </View>
  );
}

function ActionButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} className={`min-h-[50px] items-center justify-center rounded-xl bg-booking-primary px-4 py-3 ${disabled ? "opacity-50" : ""}`}><Text className="text-center text-sm font-bold text-white">{label}</Text></Pressable>;
}
