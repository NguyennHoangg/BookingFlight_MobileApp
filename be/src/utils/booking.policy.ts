import { AppError } from "../errors/AppError";
import { normalizePassengerName } from "./checkin.policy";

export interface BookingInput {
  paymentChoice?: "card" | "momo" | "zalopay" | "shopeepay" | "applepay" | "bank" | "store";
  requestKey: string;
  flights: { flightId: string; fareClassId: string }[];
  passengers: { name: string; kind: "adult" | "child" | "infant"; birthday: string; identity: string; gender?: string; nationality?: string }[];
  contact: { name: string; email: string; phone: string };
  seats: { flightId: string; passengerIndex: number; seatId: string }[];
  services: { flightId: string; passengerIndex: number; serviceIds: string[] }[];
  expectedTotal: number;
}
const invalid = (message = "Thông tin đặt vé không hợp lệ."): never => { throw new AppError(message, 400); };
function record(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  return value as Record<string, any>;
}
function text(value: unknown, max = 100): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) return invalid();
  return value.trim();
}
export function validateBooking(value: unknown): BookingInput {
  const body = record(value);
  const paymentChoice = body.paymentChoice;
  if (paymentChoice !== undefined && !["card", "momo", "zalopay", "shopeepay", "applepay", "bank", "store"].includes(paymentChoice)) invalid("Phương thức thanh toán không hợp lệ.");
  const requestKey = text(body.requestKey);
  if (!/^[\w-]{10,100}$/.test(requestKey)) invalid("Mã yêu cầu đặt vé không hợp lệ.");
  if (!Array.isArray(body.flights) || body.flights.length < 1 || body.flights.length > 2) invalid();
  const flights = body.flights.map((item: unknown) => {
    const leg = record(item);
    return { flightId: text(leg.flightId), fareClassId: text(leg.fareClassId) };
  });
  if (new Set(flights.map(leg => leg.flightId)).size !== flights.length) invalid();
  if (!Array.isArray(body.passengers) || body.passengers.length < 1 || body.passengers.length > 9) invalid("Mỗi đơn hỗ trợ từ 1 đến 9 hành khách.");
  const passengers = body.passengers.map((item: unknown) => {
    const passenger = record(item);
    if (!["adult", "child", "infant"].includes(passenger.kind)) invalid();
    const name = normalizePassengerName(text(passenger.name));
    if (!/^[A-Z .'-]{2,100}$/.test(name)) invalid("Họ tên hành khách không hợp lệ.");
    const birthday = text(passenger.birthday, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday) || !Number.isFinite(Date.parse(birthday)) || new Date(birthday).toISOString().slice(0, 10) !== birthday) invalid("Ngày sinh không hợp lệ.");
    const identity = passenger.identity == null || passenger.identity === "" ? "" : text(passenger.identity, 30);
    if (passenger.kind === "adult" && identity.length < 6) invalid("Người lớn cần cung cấp số giấy tờ.");
    if (passenger.gender !== undefined && !["male", "female"].includes(passenger.gender)) invalid("Giới tính hành khách không hợp lệ.");
    if (passenger.nationality !== undefined && !/^[A-Z]{2}$/.test(passenger.nationality)) invalid("Quốc tịch hành khách không hợp lệ.");
    return { name, kind: passenger.kind as "adult" | "child" | "infant", birthday, identity,
      ...(passenger.gender ? { gender: passenger.gender } : {}), ...(passenger.nationality ? { nationality: passenger.nationality } : {}) };
  });
  const adults = passengers.filter(p => p.kind === "adult").length;
  if (!adults || passengers.filter(p => p.kind === "infant").length > adults) invalid("Mỗi em bé cần một người lớn đi cùng.");
  const rawContact = record(body.contact);
  const contact = { name: text(rawContact.name), email: text(rawContact.email, 254), phone: text(rawContact.phone, 20) };
  if (contact.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) || !/^\+?\d{9,15}$/.test(contact.phone)) invalid("Tên, email hoặc số điện thoại liên hệ không hợp lệ.");
  const target = (item: Record<string, any>, allowInfant = false) => {
    const flightId = text(item.flightId);
    const passengerIndex = item.passengerIndex;
    if (!flights.some(leg => leg.flightId === flightId) || !Number.isInteger(passengerIndex) || !passengers[passengerIndex] || (!allowInfant && passengers[passengerIndex].kind === "infant")) invalid();
    return { flightId, passengerIndex: passengerIndex as number };
  };
  if (!Array.isArray(body.seats) || body.seats.length !== flights.length * passengers.filter(p => p.kind !== "infant").length) invalid("Vui lòng chọn đủ ghế cho từng hành khách và từng chặng.");
  const seats = body.seats.map((value: unknown) => { const item = record(value); return { ...target(item), seatId: text(item.seatId) }; });
  if (new Set(seats.map(s => `${s.flightId}:${s.passengerIndex}`)).size !== seats.length || new Set(seats.map(s => s.seatId)).size !== seats.length) invalid("Ghế hoặc hành khách bị trùng.");
  if (!Array.isArray(body.services) || body.services.length > 18) invalid();
  const services = body.services.map((value: unknown) => {
    const item = record(value);
    const owner = target(item);
    if (!Array.isArray(item.serviceIds) || item.serviceIds.length > 20) invalid();
    const serviceIds = item.serviceIds.map((id: unknown) => text(id));
    if (new Set(serviceIds).size !== serviceIds.length) invalid();
    return { ...owner, serviceIds };
  });
  if (new Set(services.map(s => `${s.flightId}:${s.passengerIndex}`)).size !== services.length) invalid();
  if (!Number.isSafeInteger(body.expectedTotal) || body.expectedTotal < 0 || body.expectedTotal > 2147483647) invalid();
  return { requestKey, flights, passengers, contact, seats, services, expectedTotal: body.expectedTotal,
    ...(paymentChoice === undefined ? {} : { paymentChoice }) };
}

export function passengerAge(birthday: string, travelDate: string) {
  const date = travelDate.slice(0, 10);
  return Number(date.slice(0, 4)) - Number(birthday.slice(0, 4)) - (date.slice(5) < birthday.slice(5) ? 1 : 0);
}
export function calculateBookingTax(price: number, count: number, config: Record<string, any>) {
  const fields = ["admin_fee", "airport_fee", "security_fee", "fuel_surcharge", "vat_percent"];
  if (!config || config.currency?.toUpperCase() !== "VND" || fields.some(key => config[key] === null || config[key] === undefined || !Number.isSafeInteger(Number(config[key])) || Number(config[key]) < 0) || Number(config.vat_percent) > 100) {
    throw new AppError("Hãng bay chưa có cấu hình thuế và phí hợp lệ.", 409);
  }
  const fixed = fields.slice(0, 4).reduce((sum, key) => sum + Number(config[key]), 0);
  return (fixed + Math.round(price * Number(config.vat_percent) / 100)) * count;
}
export function demoPaymentEnabled() {
  return process.env.NODE_ENV !== "production" && (process.env.BOOKING_PAYMENT_MODE ?? "demo") === "demo";
}
