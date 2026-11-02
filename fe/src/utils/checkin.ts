import type { CheckinCredentials, CheckinTicket } from "../api/checkin.api";

export function validateCheckinForm(input: CheckinCredentials) {
  const bookingCode = input.bookingCode.trim().toUpperCase();
  const lastName = input.lastName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "D").trim().replace(/\s+/g, " ").toUpperCase();
  if ((!/^[A-Z0-9]{6}$/.test(bookingCode) && !/^\d{3}-?\d{10}$/.test(bookingCode)) || input.bookingCode.length > 30) {
    throw new Error("Nhập mã đặt chỗ 6 ký tự hoặc số vé 13 chữ số.");
  }
  if (!/^[A-Z]+(?:[ '-][A-Z]+)*$/.test(lastName) || input.lastName.length > 80) {
    throw new Error("Nhập họ hành khách như trên vé. Ví dụ: NGUYEN.");
  }
  return { bookingCode, lastName };
}

export function groupCheckinTickets(tickets: CheckinTicket[]) {
  const flights = new Map<string, CheckinTicket[]>();
  for (const ticket of tickets) {
    const group = flights.get(ticket.flight.id) ?? [];
    group.push(ticket);
    flights.set(ticket.flight.id, group);
  }
  return [...flights.values()];
}

export function checkinShareText(pnrCode: string, ticket: CheckinTicket) {
  return [
    "XÁC NHẬN CHECK-IN TRONG ỨNG DỤNG", ticket.passengerName,
    `Mã đặt chỗ: ${pnrCode} · Số vé: ${ticket.ticketNumber}`,
    `${ticket.flight.airlineName} · ${ticket.flight.number}`,
    `${ticket.flight.departure.code} → ${ticket.flight.arrival.code}`,
    `Khởi hành: ${new Date(ticket.flight.departure.time).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`,
    `Ghế: ${ticket.seat.number} · Nhà ga: ${ticket.flight.terminal} · Cửa: ${ticket.flight.gate}`,
    "Xác nhận của ứng dụng chưa thay thế thẻ lên máy bay do hãng phát hành.",
  ].join("\n");
}
