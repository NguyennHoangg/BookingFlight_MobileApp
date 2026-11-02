import type { BookingRecord } from "../api/booking.api";
import { flightDate, flightTime, formatFareMoney } from "./fare";

export const PAYMENT_CHOICES = {
  card: { name: "Thẻ quốc tế", detail: "Visa / Mastercard / JCB", icon: "card-outline", color: "#2864FF" },
  momo: { name: "MoMo", detail: "Ví điện tử MoMo", icon: "wallet-outline", color: "#A50064" },
  zalopay: { name: "ZaloPay", detail: "Ví điện tử ZaloPay", icon: "wallet-outline", color: "#0074D9" },
  shopeepay: { name: "ShopeePay", detail: "Ví điện tử ShopeePay", icon: "wallet-outline", color: "#EE4D2D" },
  applepay: { name: "Apple Pay", detail: "Ví điện tử Apple Pay", icon: "logo-apple", color: "#12263F" },
  bank: { name: "Chuyển khoản QR", detail: "VietQR / ATM", icon: "qr-code-outline", color: "#2864FF" },
  store: { name: "Cửa hàng tiện lợi", detail: "Thanh toán tại cửa hàng", icon: "storefront-outline", color: "#2864FF" },
} as const;
export type PaymentChoice = keyof typeof PAYMENT_CHOICES;
export const walletChoices: PaymentChoice[] = ["momo", "zalopay", "shopeepay", "applepay"];
export function paymentLabel(choice?: PaymentChoice) {
  return choice && choice in PAYMENT_CHOICES ? PAYMENT_CHOICES[choice].name : "Thanh toán mô phỏng";
}
export function isPaymentChoice(value: unknown): value is PaymentChoice {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(PAYMENT_CHOICES, value);
}
export function bookingStatusLabel(status: BookingRecord["status"]) {
  return status === "CONFIRMED" ? "Đã xác nhận" : status === "CANCELLED" ? "Đã hủy" : "Chờ thanh toán";
}
export function paymentUncertain(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === undefined || status >= 500;
}
export function paymentErrorMessage(error: unknown) {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof message === "string" ? message : "Kết nối bị gián đoạn. Vui lòng kiểm tra lại trạng thái đặt vé trước khi thử lại.";
}
export function bookingShareText(booking: BookingRecord) {
  const legs = booking.details.flights?.map(leg => `${leg.flightNumber} · ${leg.departureCode} → ${leg.arrivalCode}\n${flightDate(leg.departureTime)} · ${flightTime(leg.departureTime)} – ${flightTime(leg.arrivalTime)}`).join("\n\n") ?? "";
  return `SkyJourney · ${bookingStatusLabel(booking.status)}\nMã đặt chỗ: ${booking.pnrCode}\n\n${legs}\n\n${booking.tickets.length} vé · ${formatFareMoney(booking.totalAmount)}${booking.paymentMode === "demo" ? "\nThanh toán mô phỏng · Không thu tiền" : ""}`;
}
export function escapeTicketHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}
export function bookingTicketHtml(booking: BookingRecord) {
  const e = escapeTicketHtml;
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>SkyJourney - ${e(booking.pnrCode)}</title>
    <style>@page{margin:24px}body{font:14px Arial,sans-serif;color:#12263f;line-height:1.6}h1{color:#2460f5;font-size:24px}h2{font-size:18px}section{border:1px solid #dfe5f1;border-radius:12px;padding:18px;margin:16px 0;page-break-inside:avoid}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:9px 4px;border-bottom:1px solid #eef2f8}.note{color:#876013;background:#fff9eb;padding:12px}.muted{color:#718099}</style></head>
    <body><h1>✈ SkyJourney</h1><h2>Vé điện tử · ${e(booking.pnrCode)}</h2><p>${e(bookingStatusLabel(booking.status))} · Ngày đặt ${e(flightDate(booking.createdAt))}</p>
    ${booking.paymentMode === "demo" ? '<p class="note">Thanh toán mô phỏng, không thu tiền. Vé trong ứng dụng chưa thay thế vé/thẻ lên máy bay do hãng phát hành.</p>' : ""}
    ${(booking.details.flights ?? []).map(leg => `<section><h2>${e(leg.departureCode)} → ${e(leg.arrivalCode)}</h2><p>${e(leg.airlineName)} · ${e(leg.flightNumber)} · ${e(leg.fareClassName)}<br>${e(flightDate(leg.departureTime))} · ${e(flightTime(leg.departureTime))} – ${e(flightTime(leg.arrivalTime))}</p><table><tr><th>Hành khách</th><th>Số vé</th><th>Ghế</th></tr>${booking.tickets.filter(ticket => ticket.flightId === leg.flightId).map(ticket => `<tr><td>${e(ticket.passengerName)}</td><td>${e(ticket.ticketNumber)}</td><td>${e(ticket.passengerType === "INFANT" ? "Đi cùng người lớn" : ticket.seatNumber ?? "Đã giải phóng")}</td></tr>`).join("")}</table><p>Hành lý: ${e(leg.carryOnBaggage)}kg xách tay · ${e(leg.checkedBaggage)}kg ký gửi</p></section>`).join("")}
    ${booking.details.services?.length ? `<section><h2>Dịch vụ bổ sung</h2>${booking.details.services.map(service => `<p>${e(booking.details.passengers?.[service.passengerIndex]?.name)} · ${e(service.name)} · ${e(formatFareMoney(service.price))}</p>`).join("")}</section>` : ""}
    <section><h2>Thông tin liên hệ</h2><p>${e(booking.contactName)}<br>${e(booking.contactEmail)}<br>${e(booking.contactPhone)}</p></section>
    <section><p>Vé, ghế và dịch vụ: ${e(formatFareMoney(booking.subTotal))}<br>Thuế và phí: ${e(formatFareMoney(booking.taxAndFees))}</p><h2>Tổng thanh toán: ${e(formatFareMoney(booking.totalAmount))}</h2></section>
    <p class="muted">Mang giấy tờ tùy thân hợp lệ khi làm thủ tục. Kiểm tra thông tin chuyến bay với hãng trước giờ khởi hành.</p></body></html>`;
}
