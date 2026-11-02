import type { TaxAndFee } from "../api/airport.api";
import type { FlightFare } from "../api/flight.api";

export const FEE_LABELS = {
  admin_fee: "Phí quản trị",
  airport_fee: "Phí sân bay",
  security_fee: "Phí an ninh",
  fuel_surcharge: "Phụ thu nhiên liệu",
} as const;

/** VAT chỉ áp dụng trên giá vé; làm tròn VND mỗi khách trước khi nhân số khách. */
export function calculateLegTaxAndFee(fare: FlightFare, count: number, config: TaxAndFee) {
  if (!config || !fare.airline.id || config.airline_id !== fare.airline.id) {
    throw new Error("Cấu hình thuế và phí không khớp hãng bay.");
  }
  if (config.currency?.toUpperCase() !== "VND") {
    throw new Error("Chưa hỗ trợ tính thuế và phí cho đơn vị tiền tệ này.");
  }
  const feeFields = Object.keys(FEE_LABELS) as (keyof typeof FEE_LABELS)[];
  const fields = [...feeFields, "vat_percent"] as const;
  for (const field of fields) {
    const value = config[field];
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
      throw new Error("Hãng bay chưa có cấu hình thuế và phí đầy đủ, hợp lệ.");
    }
  }
  if (!Number.isSafeInteger(count) || count < 1 || !Number.isSafeInteger(fare.ticket.price) || fare.ticket.price < 0 || config.vat_percent! > 100) {
    throw new Error("Không thể tính thuế và phí từ giá vé hoặc số khách hiện tại.");
  }
  const fixedPerPassenger = feeFields.reduce(
    (sum, field) => sum + config[field]!, 0,
  );
  const vatPerPassenger = Math.round(fare.ticket.price * config.vat_percent! / 100);
  const total = (fixedPerPassenger + vatPerPassenger) * count;
  if (!Number.isSafeInteger(total)) throw new Error("Tổng thuế và phí vượt giới hạn cho phép.");
  return { flightId: fare.flightId, config, count, fixedPerPassenger, vatPerPassenger, total };
}

export type LegTaxAndFee = ReturnType<typeof calculateLegTaxAndFee>;
