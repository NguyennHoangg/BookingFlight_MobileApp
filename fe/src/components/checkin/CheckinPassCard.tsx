import React, { useState } from "react";
import { Platform, Pressable, Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import type { CheckinTicket } from "../../api/checkin.api";
import { checkinShareText } from "../../utils/checkin";
import { flightDate, flightTime } from "../../utils/fare";

export function CheckinPassCard({ pnrCode, ticket }: { pnrCode: string; ticket: CheckinTicket }) {
  const [qrError, setQrError] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareText, setShareText] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  if (!ticket.boardingPass || ticket.eligibility.state !== "CHECKED_IN") return null;
  async function share() {
    if (sharing) return;
    setSharing(true);
    setShareError(null);
    const message = checkinShareText(pnrCode, ticket);
    try {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) await navigator.share({ title: "Xác nhận check-in", text: message });
        else setShareText(message);
      } else await Share.share({ title: "Xác nhận check-in", message });
    } catch (cause) {
      if (!(cause instanceof Error && cause.name === "AbortError")) setShareError("Chưa chia sẻ được. Vui lòng thử lại.");
    } finally { setSharing(false); }
  }
  return (
    <View className="overflow-hidden rounded-2xl border border-booking-line bg-white">
      <View className="bg-booking-primary p-4">
        <Text className="text-[10px] font-bold text-white">XÁC NHẬN CHECK-IN TRONG ỨNG DỤNG</Text>
        <Text className="mt-2 text-lg font-bold text-white">{ticket.passengerName}</Text>
        <Text className="mt-1 text-xs text-white">{ticket.flight.airlineName} · {ticket.flight.number}</Text>
      </View>
      <View className="gap-3 p-4">
        <View className="flex-row items-center justify-between">
          <View><Text className="text-2xl font-bold text-booking-ink">{ticket.flight.departure.code}</Text><Text className="text-xs text-booking-muted">{flightTime(ticket.flight.departure.time)}</Text></View>
          <Ionicons name="airplane" size={26} color="#2864FF" />
          <View><Text className="text-2xl font-bold text-booking-ink">{ticket.flight.arrival.code}</Text><Text className="text-right text-xs text-booking-muted">{flightTime(ticket.flight.arrival.time)}</Text></View>
        </View>
        <Text className="text-xs text-booking-muted">Ngày bay: {flightDate(ticket.flight.departure.time)} · {ticket.fareClassName}</Text>
        <View className="flex-row flex-wrap gap-4 rounded-xl bg-booking-soft p-3">
          <Text className="text-sm font-bold text-booking-ink">Ghế {ticket.seat.number}</Text>
          <Text className="text-sm text-booking-ink">Nhà ga {ticket.flight.terminal || "—"}</Text>
          <Text className="text-sm text-booking-ink">Cửa {ticket.flight.gate || "—"}</Text>
        </View>
        <Text className="text-xs text-booking-muted">Lên máy bay dự kiến: {ticket.boardingPass.boardingTime ? `${flightTime(ticket.boardingPass.boardingTime)} · ${flightDate(ticket.boardingPass.boardingTime)}` : "Theo thông báo tại sân bay"}</Text>
        <View className="items-center gap-3 border-t border-dashed border-booking-line pt-4">
          {qrError ? <Text className="text-xs text-booking-danger">Không hiển thị được QR. Vui lòng tra cứu lại.</Text> : (
            <View accessibilityLabel="Mã QR xác nhận check-in" className="bg-white p-3">
              <QRCode value={ticket.boardingPass.qrCodeData} size={180} quietZone={8} ecl="M" onError={() => setQrError(true)} />
            </View>
          )}
          <Text selectable className="text-sm font-bold text-booking-ink">PNR: {pnrCode}</Text>
          <Text selectable className="text-xs text-booking-muted">Số vé: {ticket.ticketNumber}</Text>
        </View>
        <Text className="text-xs leading-5 text-booking-muted">Xác nhận của ứng dụng chưa thay thế thẻ lên máy bay do hãng phát hành. Vui lòng đối chiếu giờ bay và cửa khởi hành tại sân bay.</Text>
        <Pressable onPress={() => void share()} disabled={sharing} accessibilityRole="button" accessibilityState={{ disabled: sharing }} className="min-h-[46px] items-center justify-center rounded-xl bg-booking-soft px-3">
          <Text className="text-sm font-bold text-booking-primary">{sharing ? "Đang mở chia sẻ…" : "Chia sẻ thông tin check-in"}</Text>
        </Pressable>
        {shareError && <Text accessibilityRole="alert" className="text-xs text-booking-danger">{shareError}</Text>}
        {shareText && <Text selectable className="rounded-xl bg-booking-soft p-3 text-xs leading-5 text-booking-ink">{shareText}</Text>}
      </View>
    </View>
  );
}
