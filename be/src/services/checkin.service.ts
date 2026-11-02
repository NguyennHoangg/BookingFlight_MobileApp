import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { AppError } from "../errors/AppError";
import {
  findCheckinBooking, getCheckinTickets, markTicketCheckedIn, withCheckinTransaction,
  type CheckinBooking,
} from "../models/checkin.model";
import {
  checkinEligibility, matchesPassengerLastName, validateCheckinLookup, validateCheckinConfirmation,
  type CheckinLookupInput, type CheckinTicketRow,
} from "../utils/checkin.policy";

const notFound = () => new AppError("Không tìm thấy đặt chỗ phù hợp với mã/số vé và họ hành khách.", 404);

async function loadSnapshot(client: PoolClient, input: CheckinLookupInput, lock: boolean) {
  const booking = await findCheckinBooking(client, input, lock);
  if (!booking) throw notFound();
  const allTickets = await getCheckinTickets(client, booking.id, lock);
  // Số vé chỉ cấp quyền trên chính vé đó; PNR + họ của một khách cấp quyền tra cứu cả đoàn.
  const tickets = allTickets.filter(ticket => ticket.ticketActive &&
    (input.referenceType === "PNR" || ticket.ticketNumber.replace(/-/g, "") === input.reference));
  if (!tickets.some(ticket => matchesPassengerLastName(ticket.passengerName, input.lastName))) throw notFound();
  const clock = await client.query<{ now: Date }>('SELECT clock_timestamp() AS "now"');
  const now = new Date(clock.rows[0].now);
  if (!Number.isFinite(now.getTime())) throw new AppError("Không xác định được thời gian check-in.", 500);
  const infantFlights = new Set(allTickets.filter(t => t.ticketActive && t.passengerType === "INFANT" &&
    ["CONFIRMED", "CHECKED_IN"].includes(t.status)).map(t => t.flightId));
  return { booking, tickets, now, infantFlights };
}

type Snapshot = { booking: CheckinBooking; tickets: CheckinTicketRow[]; now: Date; infantFlights: Set<string> };
function presentSnapshot({ booking, tickets, now, infantFlights }: Snapshot) {
  return {
    pnrCode: booking.pnrCode,
    serverTime: now.toISOString(),
    tickets: [...tickets].sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime() || a.passengerName.localeCompare(b.passengerName)).map(ticket => {
      const eligibility = checkinEligibility(ticket, booking.status, now, infantFlights.has(ticket.flightId));
      return {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        passengerName: ticket.passengerName,
        passengerType: ticket.passengerType,
        fareClassName: ticket.fareClassName,
        seat: { number: ticket.seatNumber, seatClass: ticket.seatClass },
        flight: {
          id: ticket.flightId, number: ticket.flightNumber, status: ticket.flightStatus,
          airlineName: ticket.airlineName, airlineCode: ticket.airlineCode,
          departure: { code: ticket.departureCode, name: ticket.departureName, city: ticket.departureCity, time: new Date(ticket.departureTime).toISOString() },
          arrival: { code: ticket.arrivalCode, name: ticket.arrivalName, city: ticket.arrivalCity, time: new Date(ticket.arrivalTime).toISOString() },
          terminal: ticket.terminal, gate: ticket.gate,
        },
        eligibility,
        boardingPass: eligibility.state === "CHECKED_IN" ? {
          qrCodeData: ticket.qrCodeData,
          boardingTime: ticket.boardingTime ? new Date(ticket.boardingTime).toISOString() : null,
        } : null,
      };
    }),
  };
}

export async function lookupCheckin(input: unknown) {
  const lookup = validateCheckinLookup(input);
  return withCheckinTransaction(async client => presentSnapshot(await loadSnapshot(client, lookup, false)));
}

export async function confirmCheckin(input: unknown) {
  const confirmation = validateCheckinConfirmation(input);
  return withCheckinTransaction(async client => {
    const snapshot = await loadSnapshot(client, confirmation, true);
    const selected = confirmation.ticketIds.map(id => snapshot.tickets.find(ticket => ticket.id === id));
    // Kiểm tra mọi vé trước khi ghi bất kỳ vé nào; ID từ booking khác không được chấp nhận.
    if (selected.some(ticket => !ticket)) throw new AppError("Danh sách vé không thuộc phạm vi đặt chỗ đang tra cứu.", 404);
    for (const ticket of selected) {
      const eligibility = checkinEligibility(ticket!, snapshot.booking.status, snapshot.now, snapshot.infantFlights.has(ticket!.flightId));
      if (!["OPEN", "CHECKED_IN"].includes(eligibility.state)) throw new AppError(eligibility.reason, 409);
    }
    for (const ticket of selected) {
      // Gọi lặp/trả lời mạng chậm không tạo thêm QR hoặc thay đổi giờ lên máy bay đã lưu.
      if (ticket!.status !== "CHECKED_IN") await markTicketCheckedIn(client, ticket!, `CHECKIN:${randomUUID()}`);
    }
    return presentSnapshot(snapshot);
  });
}
