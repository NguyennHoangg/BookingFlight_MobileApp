import React, { useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { cancelBooking } from "../../api/booking.api";
import { useBookingRecord } from "../../hook/useBookingRecord";
import { navigate, readRouteData } from "../../navigation/routes";
import { useAppDispatch } from "../../store";
import { prefillCheckin } from "../../store/slices/bookingSlice";
import { flightDate, flightTime } from "../../utils/fare";
import { bookingStatusLabel, paymentErrorMessage, paymentLabel } from "../../utils/payment";
import { exportBookingPdf, shareBooking } from "../../utils/ticketActions";
import { CopyPnr, ElectronicTicketQr, FlightTicketCard, PaymentButton, PaymentFrame, PaymentNotice, PaymentPanel, PaymentPill, PaymentRow } from "../../components/payment/PaymentUI";
import { FareSheet } from "../../components/flight/fares/FareSheet";

export default function TicketDetail() {
  const { data, bookingId: directId } = useLocalSearchParams<{ data?: string; bookingId?: string }>();
  const raw = readRouteData(data);
  const params = raw && typeof raw === "object" ? raw as { bookingId?: unknown } : null;
  const id = typeof params?.bookingId === "string" ? params.bookingId : directId;
  const { booking, setBooking, loading, error, reload } = useBookingRecord(id);
  const dispatch = useAppDispatch();
  const [sheet, setSheet] = useState<"cancel" | "help" | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [working, setWorking] = useState<"pdf" | "share" | "cancel" | null>(null);
  const pending = useRef(false);
  const ticket = booking?.tickets.find(item => item.id === selectedTicketId) ?? booking?.tickets[0];
  const flights = booking?.details.flights ?? [];
  const passengers = booking?.details.passengers ?? [];
  async function action(kind: "pdf" | "share" | "cancel") {
    if (!booking || pending.current) return;
    pending.current = true; setWorking(kind); setActionError(""); setNotice("");
    try {
      if (kind === "cancel") { setBooking(await cancelBooking(booking.id)); setSheet(null); }
      else if (kind === "pdf") await exportBookingPdf(booking);
      else if (await shareBooking(booking) === "copied") setNotice("Đã sao chép hành trình. Bạn có thể dán để chia sẻ.");
    } catch (cause) { setActionError(kind === "cancel" ? paymentErrorMessage(cause) : kind === "pdf" ? "Chưa xuất được PDF. Vui lòng thử lại hoặc dùng chức năng chia sẻ hành trình." : "Chưa chia sẻ được hành trình. Vui lòng thử lại."); }
    finally { pending.current = false; setWorking(null); }
  }
  function checkin() {
    if (!booking) return;
    dispatch(prefillCheckin({ bookingCode: booking.pnrCode, lastName: booking.tickets[0]?.passengerName.split(" ")[0] ?? "" }));
    navigate("Checkin");
  }
  const headerActions = <View className="flex-row">
    <Pressable disabled={!booking || !!working} onPress={() => void action("share")} accessibilityRole="button" accessibilityLabel="Chia sẻ hành trình" className="h-11 w-10 items-center justify-center"><Ionicons name="share-social-outline" size={18} color="#60738F" /></Pressable>
    <Pressable disabled={!booking || !!working} onPress={() => void action("pdf")} accessibilityRole="button" accessibilityLabel="Tải vé PDF" className="h-11 w-10 items-center justify-center"><Ionicons name="download-outline" size={18} color="#60738F" /></Pressable>
  </View>;
  return <PaymentFrame title="Chi tiết đặt vé" onBack={() => navigate("MyTickets")} actions={headerActions} footer={booking ? <>
    {booking.status === "CONFIRMED" && <PaymentButton label="Làm thủ tục trực tuyến (Check-in)" icon="briefcase-outline" disabled={!!working} onPress={checkin} />}
    <View className="flex-row gap-2"><View className="flex-1"><SecondaryAction label={working === "pdf" ? "Đang xuất PDF..." : "Tải vé điện tử (PDF)"} icon="document-text-outline" disabled={!!working} onPress={() => void action("pdf")} /></View><View className="flex-1"><SecondaryAction label="Chia sẻ hành trình" icon="share-outline" disabled={!!working} onPress={() => void action("share")} /></View></View>
  </> : undefined}>
    {loading && !booking && <ActivityIndicator color="#2864FF" />}
    {!!error && <PaymentNotice tone="amber"><Text className="text-xs leading-5 text-booking-ink">{error}</Text><Pressable onPress={reload} className="min-h-[36px] justify-center"><Text className="text-xs font-semibold text-booking-primary">Tải lại</Text></Pressable></PaymentNotice>}
    {!!actionError && sheet !== "cancel" && <PaymentNotice tone="red">{actionError}</PaymentNotice>}
    {!!notice && <PaymentNotice tone="green">{notice}</PaymentNotice>}
    {booking && <>
      <PaymentPanel><View className="mb-2 flex-row items-center justify-between"><Text className="text-xs text-[#60738F]">Mã đặt chỗ</Text><PaymentPill text={bookingStatusLabel(booking.status)} tone={booking.status === "CONFIRMED" ? "green" : "amber"} /></View><CopyPnr code={booking.pnrCode} /><Text className="mt-3 text-[10px] text-[#60738F]">▣ Đã đặt ngày {flightDate(booking.createdAt)} · {flightTime(booking.createdAt)} (GMT+7)</Text></PaymentPanel>
      {flights.map(leg => <FlightTicketCard key={leg.flightId} leg={leg} seat={booking.tickets.find(item => item.flightId === leg.flightId)?.seatNumber} />)}
      <PaymentPanel title="Hành khách & Ghế ngồi" icon="people-outline" aside={<PaymentPill text={`${booking.tickets.length} vé`} tone="blue" />}>
        <View className="gap-4">
          {passengers.length ? passengers.map((passenger, index) => <View key={index} className={index ? "gap-3 border-t border-booking-line pt-4" : "gap-3"}>
            <View className="gap-1"><Text className="text-sm font-bold text-booking-ink">{passenger.name}</Text><Text className="text-[10px] text-booking-muted">{passenger.kind === "adult" ? "Người lớn" : passenger.kind === "child" ? "Trẻ em" : "Em bé"}{passenger.identity ? ` · Giấy tờ: ••••${passenger.identity.slice(-4)}` : ""}</Text></View>
            {flights.map(leg => {
              const seat = booking.details.seats?.find(item => item.flightId === leg.flightId && item.passengerIndex === index);
              const services = booking.details.services?.filter(item => item.flightId === leg.flightId && item.passengerIndex === index) ?? [];
              return <View key={leg.flightId} className="gap-2"><View className="flex-row items-center justify-between"><Text className="text-[10px] text-[#60738F]">{leg.flightNumber} · {leg.departureCode} → {leg.arrivalCode}</Text><PaymentPill text={booking.status === "CANCELLED" ? "Đã hủy" : seat ? `▣ ${seat.seatNumber}` : "Đi cùng người lớn"} tone="blue" /></View><View className="flex-row gap-2"><View className="flex-1 gap-1 rounded-lg bg-[#F0F4FF] p-3"><Ionicons name="bag-handle-outline" size={15} color="#2864FF" /><Text className="text-[9px] text-[#60738F]">Hành lý mang theo</Text><Text className="text-[10px] font-semibold leading-4 text-booking-ink">Xách tay {leg.carryOnBaggage}kg{"\n"}{leg.checkedBaggage}kg ký gửi</Text></View><View className="flex-1 gap-1 rounded-lg bg-[#F0F4FF] p-3"><Ionicons name="shield-checkmark-outline" size={15} color="#2864FF" /><Text className="text-[9px] text-[#60738F]">Dịch vụ bổ sung</Text><Text className="text-[10px] font-semibold leading-4 text-booking-ink">{services.length ? services.map(service => service.name).join("\n") : "Không mua thêm"}</Text></View></View></View>;
            })}
          </View>) : booking.tickets.map(item => <View key={item.id}><Text className="text-sm font-semibold text-booking-ink">{item.passengerName}</Text><Text className="mt-1 text-xs text-[#60738F]">{item.seatNumber ? `Ghế ${item.seatNumber}` : "Đi cùng người lớn"}</Text></View>)}
        </View>
      </PaymentPanel>
      <PaymentPanel title="Mã vé điện tử & QR Code" icon="qr-code-outline" aside={<PaymentPill text={booking.status === "CONFIRMED" ? "Hợp lệ" : "Đã hủy"} tone={booking.status === "CONFIRMED" ? "green" : "amber"} />}>
        {booking.tickets.length > 1 && <View className="mb-4 flex-row flex-wrap gap-2">{booking.tickets.map(item => <Pressable key={item.id} onPress={() => setSelectedTicketId(item.id)} className={`rounded-lg border px-3 py-2 ${ticket?.id === item.id ? "border-booking-primary bg-[#F0F4FF]" : "border-booking-line"}`}><Text className="text-[10px] text-booking-ink">{item.passengerName} · {flights.find(leg => leg.flightId === item.flightId)?.flightNumber ?? item.ticketNumber}</Text></Pressable>)}</View>}
        {ticket ? <ElectronicTicketQr key={ticket.id} ticket={ticket} active={booking.status === "CONFIRMED"} /> : <Text className="text-xs text-booking-muted">Đơn chưa có vé điện tử.</Text>}
        <View className="mt-3 flex-row gap-1.5"><Ionicons name="information-circle-outline" size={13} color="#60738F" /><Text className="flex-1 text-center text-[10px] leading-5 text-[#60738F]">Dùng mã đặt chỗ để tra cứu và làm thủ tục trong ứng dụng. Mang giấy tờ tùy thân hợp lệ đến sân bay.</Text></View>
      </PaymentPanel>
      <PaymentPanel title="Chi tiết thanh toán" icon="receipt-outline" aside={<PaymentPill text={booking.status === "CANCELLED" ? "Đã hủy" : `${paymentLabel(booking.details.paymentChoice)} · Đã thanh toán`} />}>
        {flights.map(leg => <PaymentRow key={leg.flightId} label={`Giá vé ${leg.flightNumber} (×${passengers.length || booking.tickets.filter(item => item.flightId === leg.flightId).length})`} value={leg.price * (passengers.length || booking.tickets.filter(item => item.flightId === leg.flightId).length)} />)}
        {!flights.length && <PaymentRow label="Vé, ghế và dịch vụ" value={booking.subTotal} />}
        <PaymentRow label="Thuế & phí sân bay" value={booking.taxAndFees} />
        {(booking.details.seats ?? []).map(seat => <PaymentRow key={`${seat.flightId}:${seat.passengerIndex}`} label={`Chọn chỗ ngồi (Ghế ${seat.seatNumber})`} value={seat.price} />)}
        {(booking.details.services ?? []).map(service => <PaymentRow key={`${service.flightId}:${service.passengerIndex}:${service.id}`} label={service.name} value={service.price} />)}
        <View className="mt-3 border-t border-booking-line pt-3"><PaymentRow label="Tổng thanh toán" value={booking.totalAmount} strong /><Text className="text-[9px] text-[#60738F]">Đã bao gồm VAT và mọi phụ phí trong đơn</Text></View>
      </PaymentPanel>
      <PaymentPanel title="Thông tin liên hệ" icon="mail-outline"><Text className="text-xs font-semibold text-booking-ink">{booking.contactName}</Text><Text selectable className="mt-2 text-xs text-[#60738F]">{booking.contactEmail}</Text><Text selectable className="mt-1 text-xs text-[#60738F]">{booking.contactPhone}</Text></PaymentPanel>
      {booking.paymentMode === "demo" && <PaymentNotice tone="green">Thanh toán mô phỏng, không thu tiền. Vé và QR trong ứng dụng chưa thay thế vé hoặc thẻ lên máy bay do hãng phát hành.</PaymentNotice>}
      {booking.status === "CANCELLED" && <PaymentNotice tone="amber">Đơn đã hủy. Ghế và quỹ vé đã được giải phóng; giao dịch mô phỏng đã hoàn tất hủy.</PaymentNotice>}
      <Pressable onPress={() => setSheet("help")} className="min-h-[44px] flex-row items-center justify-center gap-1.5"><Ionicons name="headset-outline" size={15} color="#2864FF" /><Text className="text-center text-[11px] text-booking-primary">Cần hỗ trợ về chuyến bay? Xem hướng dẫn</Text></Pressable>
      {booking.status === "CONFIRMED" && booking.paymentMode === "demo" && !booking.tickets.some(item => item.isCheckedIn) && <Pressable onPress={() => { setActionError(""); setSheet("cancel"); }} className="min-h-[44px] items-center justify-center"><Text className="text-xs text-booking-danger">Hủy đơn đặt vé</Text></Pressable>}
    </>}
    <FareSheet visible={sheet !== null} title={sheet === "cancel" ? "Xác nhận hủy đơn" : "Hỗ trợ chuyến bay"} onClose={() => { if (!working) setSheet(null); }}>
      {sheet === "cancel" ? <View className="gap-4"><Text className="text-sm leading-6 text-[#60738F]">Hủy toàn bộ vé và dịch vụ trong đơn {booking?.pnrCode}, đồng thời giải phóng ghế. Giao dịch này là mô phỏng.</Text>{!!actionError && <Text className="text-xs text-booking-danger">{actionError}</Text>}<PaymentButton label={working === "cancel" ? "Đang hủy..." : "Xác nhận hủy đơn"} busy={!!working} onPress={() => void action("cancel")} /></View> : <Text className="text-sm leading-6 text-[#60738F]">Khi liên hệ hãng bay, hãy cung cấp mã đặt chỗ {booking?.pnrCode}, số vé và họ tên hành khách. Bạn có thể tải PDF hoặc chia sẻ hành trình từ màn hình này. Lịch làm thủ tục và điều kiện vận chuyển được xác nhận theo thông báo của hãng.</Text>}
    </FareSheet>
  </PaymentFrame>;
}
function SecondaryAction({ label, icon, onPress, disabled }: { label: string; icon: React.ComponentProps<typeof Ionicons>["name"]; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} className={`min-h-[40px] flex-row items-center justify-center gap-1.5 rounded-lg border border-booking-line bg-[#FAFCFF] px-2 py-2 ${disabled ? "opacity-50" : ""}`}><Ionicons name={icon} size={14} color="#2864FF" /><Text className="text-center text-[10px] font-medium text-booking-primary">{label}</Text></Pressable>;
}
