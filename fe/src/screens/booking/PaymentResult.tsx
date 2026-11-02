import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "../../store";
import { navigate, readRouteData } from "../../navigation/routes";
import { useBookingRecord } from "../../hook/useBookingRecord";
import { useSubmitPayment } from "../../hook/useSubmitPayment";
import { CopyPnr, ElectronicTicketQr, FlightTicketCard, PaymentButton, PaymentFrame, PaymentNotice, PaymentPanel, PaymentPill, PaymentRow } from "../../components/payment/PaymentUI";
import { flightDate, flightTime, formatFareMoney } from "../../utils/fare";
import { paymentLabel } from "../../utils/payment";

export default function PaymentResult() {
  const { data } = useLocalSearchParams<{ data?: string }>();
  const raw = readRouteData(data);
  const params = raw && typeof raw === "object" ? raw as { status?: unknown; bookingId?: unknown } : null;
  const success = params?.status === "success" && typeof params.bookingId === "string";
  const id = success ? params!.bookingId as string : undefined;
  const { booking, loading, error, reload } = useBookingRecord(id);
  const draft = useAppSelector(state => state.booking.draft);
  const failure = useAppSelector(state => state.booking.paymentFailure);
  const { submit, busy } = useSubmitPayment();
  const home = () => navigate("Home");
  const matchingFailure = draft && failure?.requestKey === draft.requestKey ? failure : null;
  const firstFlight = booking?.details.flights?.[0];
  const firstTicket = booking?.tickets[0];
  const confirmed = booking?.status === "CONFIRMED" && booking.paymentStatus === "SUCCESS";
  if (!success && (params?.status !== "failed" || !draft || !matchingFailure)) return <PaymentFrame brand onClose={home}>
    <PaymentPanel><Text className="mb-4 text-sm leading-6 text-booking-muted">Không có kết quả thanh toán trong phiên này. Bạn có thể xem các đơn đã lưu trong Vé của tôi.</Text><PaymentButton label="Xem vé của tôi" onPress={() => navigate("MyTickets")} /></PaymentPanel>
  </PaymentFrame>;
  if (success) return <PaymentFrame brand onClose={() => navigate("MyTickets")} footer={booking ? <><PaymentButton label="Xem vé của tôi" icon="ticket-outline" onPress={() => navigate("TicketDetail", { bookingId: booking.id })} /><HomeLink onPress={home} /></> : undefined}>
    <View className="items-center gap-4 px-3 py-5">
      <View className={`h-[68px] w-[68px] items-center justify-center rounded-full border-[6px] ${confirmed ? "border-[#DEFAEE] bg-[#08B68D]" : "border-[#E6ECFF] bg-[#EEF3FF]"}`}><Ionicons name={confirmed ? "checkmark" : "information-circle-outline"} size={34} color={confirmed ? "white" : "#2864FF"} /></View>
      <Text accessibilityRole="header" className="text-center text-[23px] font-bold text-booking-ink">{confirmed ? "Thanh toán thành công!" : booking?.status === "CANCELLED" ? "Đơn đặt vé đã hủy" : booking?.status === "PENDING" ? "Đơn đang chờ thanh toán" : loading ? "Đang kiểm tra giao dịch" : "Chưa xác nhận được giao dịch"}</Text>
      <Text className="text-center text-xs leading-5 text-[#60738F]">Cảm ơn bạn đã chọn SkyJourney.{"\n"}Vé điện tử được lưu trong tài khoản của bạn.</Text>
    </View>
    {loading && !booking && <ActivityIndicator color="#2864FF" />}
    {!!error && <PaymentNotice tone="amber"><Text className="text-xs leading-5 text-booking-ink">{error}</Text><Pressable onPress={reload} className="min-h-[36px] justify-center"><Text className="text-xs font-semibold text-booking-primary">Tải lại thông tin vé</Text></Pressable></PaymentNotice>}
    {booking && <>
      <PaymentPanel><Text className="mb-1 text-[11px] text-[#60738F]">Mã đặt chỗ (PNR)</Text><CopyPnr code={booking.pnrCode} /><View className="mt-3 border-t border-booking-line pt-2"><PaymentRow label="Số tiền thanh toán" value={booking.totalAmount} strong /><PaymentRow label={paymentLabel(booking.details.paymentChoice)} value={booking.paidAt ? `${flightTime(booking.paidAt)}, ${flightDate(booking.paidAt)}` : "Đã ghi nhận"} /></View></PaymentPanel>
      {firstFlight && <FlightTicketCard leg={firstFlight} status={booking.status === "CONFIRMED" ? "Đã xác nhận" : "Đã hủy"} seat={firstTicket?.seatNumber}>
        <View className="gap-3 border-t border-dashed border-booking-line p-4"><View className="flex-row justify-between gap-4"><View className="flex-1 gap-1"><Text className="text-[9px] text-booking-muted">Hành khách</Text><Text className="text-xs font-semibold text-booking-ink">{firstTicket?.passengerName ?? booking.contactName}</Text></View><View className="items-end gap-1"><Text className="text-[9px] text-booking-muted">Số vé trong đơn</Text><Text className="text-xs font-semibold text-booking-primary">{booking.tickets.length} vé</Text></View></View>
          {firstTicket && <ElectronicTicketQr key={firstTicket.id} ticket={firstTicket} active={booking.status === "CONFIRMED"} compact />}
          {(booking.details.flights?.length ?? 0) > 1 && <Text className="text-center text-[10px] text-booking-muted">Đơn gồm {booking.details.flights!.length} chặng. Xem toàn bộ hành trình trong chi tiết vé.</Text>}
        </View>
      </FlightTicketCard>}
      {booking.paymentMode === "demo" && <PaymentNotice tone="green">Thanh toán mô phỏng, không phát sinh giao dịch thu tiền.</PaymentNotice>}
      <PaymentNotice tone="amber"><Text className="text-xs font-semibold text-booking-ink">Lưu ý trước chuyến bay</Text><Text className="text-[11px] leading-5 text-[#876013]">Mang giấy tờ tùy thân hợp lệ và kiểm tra thời gian làm thủ tục của hãng trước khi đến sân bay.</Text></PaymentNotice>
    </>}
  </PaymentFrame>;
  const fare = draft!.fares[0];
  return <PaymentFrame brand onClose={home} footer={<>
    <PaymentButton label={busy ? "Đang kiểm tra..." : "Thử thanh toán lại"} icon="refresh-outline" busy={busy} onPress={() => void submit({ ...draft!, paymentChoice: draft!.paymentChoice ?? "momo" }, matchingFailure!.expectedTotal)} />
    <PaymentButton label="Chọn phương thức khác" icon="card-outline" outline disabled={busy} onPress={() => navigate("Payment")} />
    <HomeLink onPress={home} disabled={busy} />
  </>}>
    <View className="items-center gap-4 px-3 py-5"><View className="h-[68px] w-[68px] items-center justify-center rounded-full border-[6px] border-[#FFE7E8] bg-[#FFF1F1]"><Ionicons name="alert-circle-outline" size={32} color="#ED6268" /></View><Text accessibilityRole="header" className="text-center text-[23px] font-bold text-booking-ink">Thanh toán chưa thành công</Text><Text className="text-center text-xs leading-5 text-[#60738F]">{matchingFailure!.uncertain ? "Kết nối bị gián đoạn nên chưa xác định được trạng thái đặt vé. Vui lòng kiểm tra hoặc thử lại." : "Yêu cầu đặt vé chưa hoàn tất. Vui lòng kiểm tra thông tin và thử lại."}</Text></View>
    <PaymentPanel><View className="mb-3 flex-row items-center justify-between"><Text className="text-xs font-semibold text-booking-ink">Trạng thái giao dịch</Text><PaymentPill text={matchingFailure!.uncertain ? "Cần kiểm tra" : "Chưa hoàn tất"} tone="amber" /></View><PaymentNotice tone="amber"><Text className="text-xs leading-5 text-[#876013]">{matchingFailure!.message}</Text></PaymentNotice><Text className="mt-3 text-[10px] leading-5 text-booking-muted">Khi thử lại, hệ thống dùng cùng mã yêu cầu để tránh tạo trùng đơn. Bạn cũng có thể kiểm tra mục Vé của tôi.</Text></PaymentPanel>
    {fare && <FlightTicketCard leg={{ flightId: fare.flightId, fareClassId: fare.ticket.fareClassId, flightNumber: fare.flightNumber, airlineName: fare.airline.name, departureCode: fare.departure.airportCode, arrivalCode: fare.arrival.airportCode, departureCity: fare.departure.city, arrivalCity: fare.arrival.city, departureTime: fare.departure.time, arrivalTime: fare.arrival.time, fareClassName: fare.ticket.fareClassName, price: fare.ticket.price, carryOnBaggage: fare.ticket.baggage.carryOn, checkedBaggage: fare.ticket.baggage.checked, aircraftModel: fare.aircraft.model }}>
      <View className="border-t border-booking-line px-4 py-2"><PaymentRow label="Tổng tiền đã xác nhận" value={formatFareMoney(matchingFailure!.expectedTotal)} strong /></View>
    </FlightTicketCard>}
    <PaymentPanel title="Bạn có thể kiểm tra" icon="help-circle-outline"><View className="gap-3">{["Kiểm tra kết nối mạng rồi thử lại với cùng yêu cầu.", "Nếu giá hoặc chỗ đã thay đổi, quay lại để cập nhật hành trình.", "Mở Vé của tôi để xem đơn đã được ghi nhận hay chưa."].map(text => <View key={text} className="flex-row gap-2"><Text className="text-booking-danger">•</Text><Text className="flex-1 text-xs leading-5 text-[#60738F]">{text}</Text></View>)}</View></PaymentPanel>
    <PaymentNotice>Phiên thanh toán hiện là mô phỏng, không thu tiền qua ngân hàng hoặc ví điện tử.</PaymentNotice>
    <Pressable onPress={() => navigate("MyTickets")} className="min-h-[44px] items-center justify-center"><Text className="text-xs font-semibold text-booking-primary">Kiểm tra vé của tôi</Text></Pressable>
  </PaymentFrame>;
}
function HomeLink({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} className="min-h-[40px] items-center justify-center"><Text className="text-xs text-[#60738F]">Về trang chủ</Text></Pressable>;
}
