import { AppError } from "../errors/AppError";

export function normalizePassengerName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "D").trim().replace(/\s+/g, " ").toUpperCase();
}

export interface CheckinLookupInput {
  reference: string;
  referenceType: "PNR" | "TICKET";
  lastName: string;
}

export function validateCheckinLookup(value: unknown): CheckinLookupInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("Thông tin tra cứu không hợp lệ.", 400);
  }
  const { bookingCode, lastName } = value as Record<string, unknown>;
  if (typeof bookingCode !== "string" || typeof lastName !== "string" || bookingCode.length > 30 || lastName.length > 80) {
    throw new AppError("Vui lòng nhập mã đặt chỗ/số vé và họ hành khách.", 400);
  }
  const reference = bookingCode.trim().toUpperCase();
  const normalizedName = normalizePassengerName(lastName);
  if (!/^[A-Z]+(?:[ '-][A-Z]+)*$/.test(normalizedName)) {
    throw new AppError("Họ hành khách không hợp lệ. Ví dụ: NGUYEN.", 400);
  }
  if (/^[A-Z0-9]{6}$/.test(reference)) return { reference, referenceType: "PNR", lastName: normalizedName };
  if (/^\d{3}-?\d{10}$/.test(reference)) return { reference: reference.replace("-", ""), referenceType: "TICKET", lastName: normalizedName };
  throw new AppError("Mã đặt chỗ gồm 6 ký tự chữ/số hoặc số vé gồm 13 chữ số.", 400);
}

export function validateCheckinConfirmation(value: unknown) {
  const lookup = validateCheckinLookup(value);
  const { ticketIds, acceptedConditions } = value as Record<string, unknown>;
  if (acceptedConditions !== true) throw new AppError("Vui lòng xác nhận đã kiểm tra thông tin trước khi check-in.", 400);
  if (!Array.isArray(ticketIds) || ticketIds.length < 1 || ticketIds.length > 18 ||
      ticketIds.some(id => typeof id !== "string" || !id.trim() || id.length > 100) ||
      new Set(ticketIds).size !== ticketIds.length) {
    throw new AppError("Vui lòng chọn từ 1 đến 18 vé khác nhau để check-in.", 400);
  }
  return { ...lookup, ticketIds: ticketIds as string[] };
}

export function matchesPassengerLastName(passengerName: string, lastName: string) {
  const name = normalizePassengerName(passengerName);
  return name === lastName || name.startsWith(`${lastName} `);
}

export interface CheckinTicketRow {
  id: string;
  ticketNumber: string;
  passengerName: string;
  passengerType: string;
  status: string;
  isCheckedIn: boolean;
  ticketActive: boolean;
  flightId: string;
  flightNumber: string;
  flightStatus: string;
  flightActive: boolean;
  departureTime: Date | string;
  arrivalTime: Date | string;
  departureCode: string;
  departureName: string;
  departureCity: string;
  departureCountry: string;
  arrivalCode: string;
  arrivalName: string;
  arrivalCity: string;
  arrivalCountry: string;
  airportActive: boolean;
  airlineName: string;
  airlineCode: string;
  airlineActive: boolean;
  aircraftActive: boolean;
  fareActive: boolean;
  fareClassName: string;
  fareSeatClass: string;
  seatNumber: string;
  seatClass: string;
  seatFlightId: string;
  seatType: string;
  seatActive: boolean;
  seatBooked: boolean;
  terminal: string;
  gate: string;
  boardingTime: Date | string | null;
  qrCodeData: string;
}

export type CheckinState = "OPEN" | "NOT_OPEN" | "CLOSED" | "CHECKED_IN" | "AIRPORT_REQUIRED" | "UNAVAILABLE";

const HOUR = 60 * 60 * 1000;
export function checkinEligibility(ticket: CheckinTicketRow, bookingStatus: string, now: Date, hasInfant: boolean) {
  const departure = new Date(ticket.departureTime).getTime();
  const opensAt = Number.isFinite(departure) ? new Date(departure - 24 * HOUR).toISOString() : null;
  const closesAt = Number.isFinite(departure) ? new Date(departure - HOUR).toISOString() : null;
  const result = (state: CheckinState, reason: string) => ({ state, reason, opensAt, closesAt });
  if (bookingStatus !== "CONFIRMED" || !ticket.ticketActive || !ticket.flightActive ||
      !ticket.airlineActive || !ticket.aircraftActive || !ticket.airportActive || !ticket.fareActive ||
      !["SCHEDULED", "DELAYED"].includes(ticket.flightStatus) ||
      !["CONFIRMED", "CHECKED_IN"].includes(ticket.status)) {
    return result("UNAVAILABLE", "Vé hoặc chuyến bay không còn đủ điều kiện check-in.");
  }
  if (!Number.isFinite(departure) || departure <= now.getTime()) return result("CLOSED", "Chuyến bay đã đến giờ khởi hành.");
  if (!ticket.seatActive || !ticket.seatBooked || ticket.seatFlightId !== ticket.flightId || ticket.seatClass !== ticket.fareSeatClass) {
    return result("AIRPORT_REQUIRED", "Thông tin ghế cần được xác nhận tại quầy làm thủ tục.");
  }
  if (ticket.status === "CHECKED_IN" && ticket.isCheckedIn && ticket.qrCodeData) {
    return result("CHECKED_IN", "Đã check-in. Bạn có thể xem lại xác nhận.");
  }
  if (ticket.isCheckedIn || ticket.status === "CHECKED_IN") return result("UNAVAILABLE", "Trạng thái vé chưa đồng nhất. Vui lòng liên hệ hỗ trợ.");
  const domestic = (country: string) => ["VIET NAM", "VIETNAM", "VN"].includes(normalizePassengerName(country));
  if (!domestic(ticket.departureCountry) || !domestic(ticket.arrivalCountry)) {
    return result("AIRPORT_REQUIRED", "Ứng dụng hiện hỗ trợ check-in online cho chuyến bay nội địa Việt Nam.");
  }
  if (hasInfant || ticket.passengerType === "INFANT" || (ticket.seatType === "EXIT_ROW" && ticket.passengerType !== "ADULT")) {
    return result("AIRPORT_REQUIRED", "Đoàn có em bé hoặc hành khách cần hỗ trợ vị trí ghế vui lòng làm thủ tục tại quầy.");
  }
  if (now.getTime() < departure - 24 * HOUR) return result("NOT_OPEN", "Chưa đến thời gian mở check-in (24 giờ trước giờ bay).");
  if (now.getTime() >= departure - HOUR) return result("CLOSED", "Đã đóng check-in online (60 phút trước giờ bay).");
  return result("OPEN", "Đủ điều kiện check-in online.");
}
