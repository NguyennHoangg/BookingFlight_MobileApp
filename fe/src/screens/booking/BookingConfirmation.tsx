import React, { useState } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "../../store";
import {
  bookingTotals,
  emptyServices,
  serviceKey,
} from "../../utils/booking";
import {
  flightDate,
  flightDuration,
  flightTime,
  formatFareMoney,
} from "../../utils/fare";
import { fullPassengerName } from "../../utils/passengerForm";
import { navigate } from "../../navigation/routes";
import {
  BookingCard,
  BookingLayout,
  BookingLink,
  MissingBooking,
  PriceRow,
} from "../../components/booking/BookingLayout";
import { FareSheet } from "../../components/flight/fares/FareSheet";
import type { FlightFare } from "../../api/flight.api";
import { useTaxAndFee } from "../../hook/useTaxAndFee";
import { TaxAndFeeCard } from "../../components/booking/TaxAndFeeCard";

/** Màn chỉ đọc cùng bản nháp với dịch vụ, tránh lưu một tổng tiền dễ bị lệch. */
export default function BookingConfirmation() {
  const draft = useAppSelector((state) => state.booking.draft);
  const [sheet, setSheet] = useState<"terms" | "privacy" | null>(
    null,
  );
  const [detail, setDetail] = useState<FlightFare | null>(null);
  const taxes = useTaxAndFee(draft?.fares ?? [], draft?.passengers.length ?? 0);
  if (!draft) return <MissingBooking />;
  const totals = bookingTotals(draft, taxes.total);
  const editPassengers = () => navigate("PassengerInfo", draft.params);
  return (
    <BookingLayout
      title="Xác nhận đặt vé"
      step={3}
      total={totals.total}
      count={draft.passengers.length}
      label="Tiếp tục thanh toán"
      onContinue={() => { if (taxes.status === "ready") navigate("Payment"); }}
    >
      {draft.fares.map((fare, legIndex) => (
        <BookingCard key={fare.flightId}>
          <View className="mb-3 flex-row items-center gap-2 border-b border-booking-line pb-2">
            <View className="rounded-lg bg-booking-soft p-2">
              <Ionicons name="airplane" size={21} color="#2864FF" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-booking-ink">
                {fare.airline.name}{" "}
                <Text className="text-xs text-booking-primary">
                  {fare.flightNumber}
                </Text>
              </Text>
              <Text className="mt-1 text-[10px] text-booking-muted">
                {fare.aircraft.model} · {fare.ticket.fareClassName}
              </Text>
            </View>
            <BookingLink onPress={() => setDetail(fare)}>Chi tiết</BookingLink>
          </View>
          <Text className="mb-3 text-xs text-booking-ink">
            {legIndex === 0 ? "Chiều đi" : "Chiều về"} ·{" "}
            {flightDate(fare.departure.time)}
          </Text>
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-booking-ink">
                {flightTime(fare.departure.time)}
              </Text>
              <Text className="mt-1 text-sm font-bold text-booking-primary">
                {fare.departure.airportCode}
              </Text>
              <Text className="mt-1 text-[10px] text-booking-muted">
                {fare.departure.airportName}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-[10px] text-booking-muted">
                {flightDuration(fare.durationMinutes)}
              </Text>
              <Text className="my-1 text-lg text-[#087F73]">── ✈ ──</Text>
              <Text className="rounded-full bg-[#E5F7F3] px-2 py-1 text-[9px] text-[#087F73]">
                Bay thẳng
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-2xl font-bold text-booking-ink">
                {flightTime(fare.arrival.time)}
              </Text>
              <Text className="mt-1 text-sm font-bold text-booking-primary">
                {fare.arrival.airportCode}
              </Text>
              <Text className="mt-1 text-right text-[10px] text-booking-muted">
                {fare.arrival.airportName}
              </Text>
            </View>
          </View>
          <View className="mt-4 flex-row flex-wrap justify-between gap-2 border-t border-dashed border-booking-line pt-3">
            <Text className="text-[10px] text-[#087F73]">
              ⓘ{" "}
              {fare.ticket.isRefundable ? "Có hỗ trợ hoàn vé" : "Không hoàn vé"}
            </Text>
            <Text className="text-[10px] text-[#536F97]">
              Xách tay: {fare.ticket.baggage.carryOn}kg
            </Text>
          </View>
        </BookingCard>
      ))}
      <BookingCard
        title="Hành khách & Chỗ ngồi"
        icon="people-outline"
        action={<BookingLink onPress={editPassengers}>Sửa</BookingLink>}
      >
        {draft.passengers.map((passenger, index) => (
          <View key={index} className="mb-3 last:mb-0">
            <Text className="text-sm font-bold text-booking-ink">
              {fullPassengerName(passenger)}
            </Text>
            <Text className="mt-1 text-[10px] text-booking-muted">
              {passenger.kind === "adult"
                ? "Người lớn"
                : passenger.kind === "child"
                  ? "Trẻ em"
                  : "Em bé"}{" "}
              ·{" "}
              {passenger.identity
                ? `Giấy tờ: ${passenger.identity}`
                : passenger.birthday}
            </Text>
            {draft.fares.map((fare) => {
              const selection =
                draft.services[serviceKey(fare.flightId, index)] ??
                emptyServices();
              const seat = draft.seats.find(
                (choice) =>
                  choice.flightId === fare.flightId &&
                  choice.passengerIndex === index,
              );
              return (
                <View
                  key={fare.flightId}
                  className="mt-2 rounded-xl bg-booking-background p-3"
                >
                  <View className="mb-1 flex-row items-center justify-between gap-2">
                    <Text className="text-[10px] text-booking-muted">
                      {fare.departure.airportCode} → {fare.arrival.airportCode}
                    </Text>
                    <Text className="rounded-md bg-booking-primary px-2 py-1 text-[10px] font-bold text-white">
                      {seat ? `Ghế ${seat.seatNumber}` : "Đi cùng người lớn"}
                    </Text>
                  </View>
                  {(selection.serviceIds ?? []).map(id => {
                    const service = draft.catalog?.find(item => item.id === id);
                    return service ? <PriceRow key={id} label={service.name} value={service.price} /> : <Text key={id} className="text-red-600">Dịch vụ cần được kiểm tra lại.</Text>;
                  })}
                </View>
              );
            })}
          </View>
        ))}
        <BookingLink onPress={() => navigate("AdditionalServices")}>
          Chỉnh sửa dịch vụ bổ sung
        </BookingLink>
      </BookingCard>
      <BookingCard
        title="Thông tin liên hệ"
        icon="id-card-outline"
        action={<BookingLink onPress={editPassengers}>Sửa</BookingLink>}
      >
        <ContactRow label="Họ tên người nhận" value={draft.contact.name} />
        <ContactRow label="Số điện thoại" value={draft.contact.phone} />
        <ContactRow
          label="Email nhận vé điện tử"
          value={draft.contact.email}
          blue
        />
        <View className="mt-3 flex-row gap-2 border-t border-booking-line pt-3">
          <Ionicons name="mail-outline" size={15} color="#087F73" />
          <Text className="flex-1 text-[10px] leading-4 text-booking-muted">
            Thông tin liên hệ được lưu cùng đơn đặt vé. Bạn có thể xem lại vé
            trong mục Vé của tôi sau khi đặt thành công.
          </Text>
        </View>
      </BookingCard>
      <TaxAndFeeCard taxes={taxes} fares={draft.fares} />
      <BookingCard title="Chi tiết thanh toán" icon="receipt-outline">
        {draft.fares.map((fare) => (
          <PriceRow
            key={fare.flightId}
            label={`Giá gói vé ${fare.departure.airportCode} → ${fare.arrival.airportCode} (×${draft.passengers.length})`}
            value={fare.ticket.price * draft.passengers.length}
          />
        ))}
        <PriceRow label="Phí chọn chỗ ngồi" value={totals.seats} />
        <PriceRow label="Dịch vụ bổ sung" value={totals.services} />
        {taxes.total !== null && <PriceRow label="Thuế và phí" value={taxes.total} />}
        <PriceRow label="Giảm giá / Khuyến mãi" value={0} />
        <View className="mt-2 border-t border-booking-line pt-2">
          {totals.total === null ? (
            <Text className="text-xs text-booking-muted">Chưa xác định tổng tiền: đang chờ thuế và phí hợp lệ.</Text>
          ) : <PriceRow label="Tổng cộng" value={totals.total} strong />}
          <Text className="text-[10px] text-booking-muted">
            Theo giá gói vé, thuế và phí của hãng, ghế và dịch vụ đã chọn.
          </Text>
        </View>
      </BookingCard>
      <View className="items-center px-2">
        <Text className="text-center text-[10px] leading-5 text-booking-muted">
          Bằng việc xác nhận đặt vé, bạn xác nhận thông tin chính xác và
          đồng ý với
        </Text>
        <View className="flex-row flex-wrap justify-center">
          <BookingLink onPress={() => setSheet("terms")}>
            Điều khoản đặt vé
          </BookingLink>
          <BookingLink onPress={() => setSheet("privacy")}>
            Chính sách bảo mật
          </BookingLink>
        </View>
      </View>
      <FareSheet
        visible={!!detail}
        title="Chi tiết chuyến bay"
        onClose={() => setDetail(null)}
      >
        {detail && (
          <View>
            <Text className="text-base font-bold text-booking-ink">
              {detail.airline.name} · {detail.flightNumber}
            </Text>
            <Text className="mt-3 text-sm leading-6 text-booking-muted">
              {detail.departure.airportName} → {detail.arrival.airportName}
              {"\n"}
              {flightDate(detail.departure.time)} ·{" "}
              {flightTime(detail.departure.time)} –{" "}
              {flightTime(detail.arrival.time)}
              {"\n"}
              {detail.aircraft.model} · {detail.ticket.fareClassName}
              {"\n"}Ký gửi: {detail.ticket.baggage.checked}kg · Xách tay:{" "}
              {detail.ticket.baggage.carryOn}kg{"\n"}
              {detail.ticket.baggage.info}
              {"\n"}Phí đổi vé: {formatFareMoney(detail.ticket.changeFee)}
            </Text>
          </View>
        )}
      </FareSheet>
      <FareSheet
        visible={sheet !== null}
        title={
          sheet === "terms"
              ? "Điều khoản đặt vé"
              : "Chính sách bảo mật"
        }
        onClose={() => setSheet(null)}
      >
        <Text className="text-sm leading-6 text-booking-muted">{sheet === "terms"
          ? "Kiểm tra kỹ hành trình, hành khách và giá trước khi xác nhận. Giao dịch mô phỏng không thu tiền. Đơn mô phỏng có thể hủy trước giờ bay khi chưa check-in."
          : "Bản nháp được giữ trong bộ nhớ của ứng dụng. Khi xác nhận đặt vé, thông tin hành khách và liên hệ được lưu trên hệ thống để quản lý đơn trong tài khoản của bạn."}</Text>
      </FareSheet>
    </BookingLayout>
  );
}
function ContactRow({
  label,
  value,
  blue = false,
}: {
  label: string;
  value: string;
  blue?: boolean;
}) {
  return (
    <View className="flex-row justify-between gap-3 py-1.5">
      <Text className="flex-1 text-xs text-booking-muted">{label}</Text>
      <Text
        selectable
        className={`flex-1 text-right text-xs font-semibold ${blue ? "text-booking-primary" : "text-booking-ink"}`}
      >
        {value}
      </Text>
    </View>
  );
}
