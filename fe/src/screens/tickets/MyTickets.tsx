import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { isAxiosError } from "axios";
import AppHeader from "../../components/common/AppHeader";
import { getBookings, type BookingRecord } from "../../api/booking.api";
import { useAppSelector } from "../../store";
import { navigate } from "../../navigation/routes";
import { flightDate, flightTime, formatFareMoney } from "../../utils/fare";

export default function MyTickets() {
  const authenticated = useAppSelector(state => state.auth.isAuthenticated);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "cancelled">("all");
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    void attempt; // Refresh requests intentionally rerun the focused screen's load.
    const controller = new AbortController();
    if (!authenticated) { setBookings([]); return () => controller.abort(); }
    setLoading(true); setError("");
    void getBookings(controller.signal).then(result => { if (!controller.signal.aborted) setBookings(result); }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(isAxiosError<{ message?: string }>(cause) ? cause.response?.data.message || "Không tải được vé." : "Không tải được vé.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [authenticated, attempt]));
  const visible = bookings.filter(booking => filter === "all" || (filter === "cancelled" ? booking.status === "CANCELLED" : booking.status !== "CANCELLED"));
  return <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-gray-50">
    <AppHeader title="Vé của tôi" />
    {!authenticated ? <View className="flex-1 items-center justify-center gap-4"><Text>Đăng nhập để xem vé đã đặt.</Text><Pressable onPress={() => navigate("Login")}><Text className="text-blue-600">Đăng nhập</Text></Pressable></View> :
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => setAttempt(value => value + 1)} />}>
        <View className="flex-row gap-2">{([['all', 'Tất cả'], ['active', 'Đã đặt'], ['cancelled', 'Đã hủy']] as const).map(([value, label]) =>
          <Pressable key={value} onPress={() => setFilter(value)} className={`rounded-full px-4 py-3 ${filter === value ? 'bg-blue-600' : 'bg-white'}`}><Text className={filter === value ? 'text-white' : 'text-gray-600'}>{label}</Text></Pressable>)}</View>
        {!!error && <View className="gap-3"><Text className="text-red-600">{error}</Text><Pressable onPress={() => setAttempt(value => value + 1)}><Text className="text-blue-600">Thử lại</Text></Pressable></View>}
        {loading && !bookings.length && <ActivityIndicator />}
        {!loading && !error && !visible.length && <View className="items-center gap-4 py-12"><Text>Chưa có đơn đặt vé trong mục này.</Text><Pressable onPress={() => navigate("Home")}><Text className="text-blue-600">Tìm chuyến bay</Text></Pressable></View>}
        {visible.map(booking => <Pressable key={booking.id} onPress={() => navigate("TicketDetail", { bookingId: booking.id })} className="gap-3 rounded-2xl border border-gray-200 bg-white p-4">
          <View className="flex-row justify-between"><Text className="font-bold text-blue-600">PNR: {booking.pnrCode}</Text><Text>{booking.status === "CONFIRMED" ? "Đã xác nhận" : booking.status === "CANCELLED" ? "Đã hủy" : "Chờ thanh toán"}</Text></View>
          {booking.details.flights?.map(leg => <View key={leg.flightId} className="gap-1"><Text className="text-lg font-bold">{leg.departureCode} → {leg.arrivalCode}</Text><Text>{leg.airlineName} · {leg.flightNumber}</Text><Text className="text-gray-500">{flightDate(leg.departureTime)} · {flightTime(leg.departureTime)} – {flightTime(leg.arrivalTime)}</Text></View>)}
          <Text>{booking.tickets.length} vé · {formatFareMoney(booking.totalAmount)}</Text>
          {booking.paymentMode === "demo" && <Text className="text-xs text-amber-700">Thanh toán mô phỏng</Text>}
        </Pressable>)}
      </ScrollView>}
  </SafeAreaView>;
}
