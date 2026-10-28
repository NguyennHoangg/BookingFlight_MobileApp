import type { FlightFare } from "../api/flight.api";
import type { PassengerCounts } from "../components/flight/PassengerSelectModal";

/** Định dạng thống nhất tiền VND; không tự cộng thuế/phí chưa có trong API. */
export const formatFareMoney = (value: number) =>
  `${value.toLocaleString("vi-VN")} ₫`;
export const isBusinessFare = (fare: FlightFare) =>
  /business|thương gia/i.test(fare.ticket.fareClassName);
export const passengerCount = (counts: PassengerCounts) =>
  counts.adults + counts.children + counts.infants;

/** Giữ gói cũ nếu còn đủ chỗ; nếu gói đó hết, chọn gói còn bán có giá thấp nhất. */
export function resolveSelectedFare(
  options: FlightFare[],
  preferredId: string | undefined,
  count: number,
) {
  const available = options.filter(
    (fare) => fare.ticket.availableSeats >= count,
  );
  return (
    available.find((fare) => fare.ticket.fareClassId === preferredId) ??
    available.reduce<FlightFare | undefined>(
      (best, fare) =>
        !best || fare.ticket.price < best.ticket.price ? fare : best,
      undefined,
    )
  );
}

/** Tổng tạm tính chỉ hoàn chỉnh khi tất cả các chặng đều có gói hợp lệ. */
export function calculateFareTotal(
  fares: (FlightFare | undefined)[],
  count: number,
): number | null {
  if (!fares.length || fares.some((fare) => !fare)) return null;
  return fares.reduce((total, fare) => total + fare!.ticket.price * count, 0);
}

/** Thời gian theo múi giờ sân bay Việt Nam, không phụ thuộc múi giờ thiết bị. */
export const flightTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
export const flightDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
export const flightDuration = (minutes: number) =>
  `${Math.floor(minutes / 60)}g ${minutes % 60}p`;
