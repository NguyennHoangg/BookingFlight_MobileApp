import type { PoolClient } from "pg";
import { connectPool } from "../config/db.config";
import { AppError } from "../errors/AppError";
import type { CheckinLookupInput, CheckinTicketRow } from "../utils/checkin.policy";

export interface CheckinBooking {
  id: string;
  pnrCode: string;
  status: string;
  isActive: boolean;
}

/** Cùng một connection cho tra cứu, khóa và cập nhật; rollback toàn bộ nếu một vé không hợp lệ. */
export async function withCheckinTransaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await connectPool();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '10s'");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    if (["40P01", "40001", "55P03", "57014"].includes((error as { code?: string }).code)) {
      throw new AppError("Dữ liệu vừa thay đổi. Vui lòng tra cứu và thử lại check-in.", 409);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function findCheckinBooking(client: PoolClient, input: CheckinLookupInput, lock: boolean): Promise<CheckinBooking | undefined> {
  const condition = input.referenceType === "PNR" ? 'b."pnrCode" = $1'
    : `EXISTS (SELECT 1 FROM "Ticket" t WHERE t."bookingId" = b.id AND REPLACE(t."ticketNumber", '-', '') = $1 AND t."isActive")`;
  const result = await client.query<CheckinBooking>(
    `SELECT b.id, b."pnrCode", b.status, b."isActive" FROM "Booking" b
     WHERE ${condition} AND b."isActive" ${lock ? "FOR UPDATE OF b" : ""}`, [input.reference],
  );
  return result.rows[0];
}

export async function getCheckinTickets(client: PoolClient, bookingId: string, lock: boolean): Promise<CheckinTicketRow[]> {
  const result = await client.query<CheckinTicketRow>(`
    SELECT t.id, t."ticketNumber", t."passengerName", t."passengerType", t.status,
      t."isCheckedIn", t."isActive" AS "ticketActive", t."boardingTime", t."qrCodeData",
      f.id AS "flightId", f."flightNumber", f.status AS "flightStatus", f."isActive" AS "flightActive",
      f."departureTime", f."arrivalTime", f.terminal, f.gate,
      dep.code AS "departureCode", dep.name AS "departureName", dep.city AS "departureCity", dep.country AS "departureCountry",
      arr.code AS "arrivalCode", arr.name AS "arrivalName", arr.city AS "arrivalCity", arr.country AS "arrivalCountry",
      (dep."isActive" AND arr."isActive") AS "airportActive",
      a.name AS "airlineName", a.code AS "airlineCode", a."isActive" AS "airlineActive",
      (ac."isActive" AND ac."airlineId" = f."airlineId") AS "aircraftActive",
      (fc."isActive" AND fc."airlineId" = f."airlineId") AS "fareActive", fc.name AS "fareClassName",
      CASE WHEN fc.name ~* '(business|thương gia)' THEN 'BUSINESS' ELSE 'ECONOMY' END AS "fareSeatClass",
      COALESCE(s."seatNumber", 'Đi cùng') AS "seatNumber", COALESCE(s."seatClass"::text, '') AS "seatClass", s."flightId" AS "seatFlightId", s."seatType", s."isActive" AS "seatActive", s."isBooked" AS "seatBooked"
    FROM "Ticket" t JOIN "Flight" f ON f.id = t."flightId"
    LEFT JOIN "FlightSeat" s ON s.id = t."flightSeatId"
    JOIN "Airline" a ON a.id = f."airlineId"
    JOIN "Aircraft" ac ON ac.id = f."aircraftId"
    JOIN "FareClass" fc ON fc.id = t."fareClassId"
    JOIN "Airport" dep ON dep.id = f."departureAirportId"
    JOIN "Airport" arr ON arr.id = f."arrivalAirportId"
    WHERE t."bookingId" = $1 ORDER BY t.id
    ${lock ? "FOR UPDATE OF t, f, a, ac, fc, dep, arr" : ""}`, [bookingId]);
  return result.rows;
}

export async function markTicketCheckedIn(client: PoolClient, ticket: CheckinTicketRow, qrCodeData: string) {
  const boardingTime = ticket.boardingTime ?? new Date(new Date(ticket.departureTime).getTime() - 40 * 60 * 1000);
  await client.query(`UPDATE "Ticket" SET "isCheckedIn" = true, status = 'CHECKED_IN',
    "boardingTime" = $2, "qrCodeData" = $3 WHERE id = $1`, [ticket.id, boardingTime, qrCodeData]);
  ticket.isCheckedIn = true;
  ticket.status = "CHECKED_IN";
  ticket.boardingTime = boardingTime;
  ticket.qrCodeData = qrCodeData;
}
