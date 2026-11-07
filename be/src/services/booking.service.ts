import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { connectPool, query } from "../config/db.config";
import { AppError } from "../errors/AppError";
import { publicCache } from "../redis/publicCache";
import { calculateBookingTax, demoPaymentEnabled, passengerAge, validateBooking, type BookingInput } from "../utils/booking.policy";

async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await connectPool();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '15s'");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    if (["23505", "40P01", "40001", "55P03", "57014"].includes((error as { code?: string }).code)) throw new AppError("Chỗ hoặc dữ liệu vừa thay đổi. Vui lòng thử lại.", 409);
    throw error;
  } finally { client.release(); }
}

export async function bookingServices(flightIds: string[]) {
  if (!flightIds.length || flightIds.length > 2 || flightIds.some(id => !id || id.length > 100)) throw new AppError("Mã chuyến bay không hợp lệ.", 400);
  const result = await query(`SELECT DISTINCT s.id, s."airlineId", s.type, s.name, s.price
    FROM "AncillaryService" s JOIN "Flight" f ON f."airlineId" = s."airlineId"
    JOIN "Airline" a ON a.id = f."airlineId" AND a."isActive"
    WHERE f.id = ANY($1::text[]) AND f."isActive" AND s."isActive" AND s.price >= 0 ORDER BY s.price, s.id`, [flightIds]);
  return result.rows;
}

/** Lock shared inventory before testing quota and seats. No client price is trusted. */
async function priceBooking(client: PoolClient, input: BookingInput, lock: boolean) {
  const legs: Record<string, any>[] = [];
  if (lock) await client.query('SELECT id FROM "Flight" WHERE id = ANY($1::text[]) ORDER BY id FOR UPDATE', [input.flights.map(leg => leg.flightId)]);
  // Global order prevents deadlocks when two round trips use the same flights in reverse order.
  for (const selection of [...input.flights].sort((a, b) => a.flightId.localeCompare(b.flightId))) {
    const result = await client.query(`SELECT f.*, i.id AS "inventoryId", i.price, i."totalQuota", i."soldCount",
      fc.name AS "fareClassName", fc."carryOnBaggage", fc."checkedBaggage", fc."isRefundable", fc."changeFee",
      a.name AS "airlineName", a.code AS "airlineCode", a."logoUrl", ac.model AS "aircraftModel",
      dep.code AS "departureCode", dep.city AS "departureCity", dep.name AS "departureName",
      arr.code AS "arrivalCode", arr.city AS "arrivalCity", arr.name AS "arrivalName"
      FROM "Flight" f JOIN "FlightFareInventory" i ON i."flightId" = f.id AND i."fareClassId" = $2 AND i."isActive"
      JOIN "FareClass" fc ON fc.id = i."fareClassId" AND fc."isActive" AND fc."airlineId" = f."airlineId"
      JOIN "Airline" a ON a.id = f."airlineId" AND a."isActive"
      JOIN "Aircraft" ac ON ac.id = f."aircraftId" AND ac."isActive" AND ac."airlineId" = f."airlineId"
      JOIN "Airport" dep ON dep.id = f."departureAirportId" AND dep."isActive"
      JOIN "Airport" arr ON arr.id = f."arrivalAirportId" AND arr."isActive"
      WHERE f.id = $1 AND f."isActive" AND f.status = 'SCHEDULED' AND f."departureTime" > clock_timestamp()
      ${lock ? "FOR UPDATE OF i" : ""}`, [selection.flightId, selection.fareClassId]);
    const row = result.rows[0];
    if (!row || row.totalQuota - row.soldCount < input.passengers.length) throw new AppError("Chuyến bay hoặc gói vé không còn đủ chỗ.", 409);
    if (!Number.isSafeInteger(row.price) || row.price < 0) throw new AppError("Giá gói vé không hợp lệ.", 409);
    for (const passenger of input.passengers) {
      const date = new Date(row.departureTime).toISOString().slice(0, 10);
      const age = passengerAge(passenger.birthday, date);
      if (passenger.birthday > date || age < 0 || age > 120 || (passenger.kind === "adult" ? age < 12 : passenger.kind === "child" ? age < 2 || age >= 12 : age >= 2)) throw new AppError("Ngày sinh không phù hợp loại hành khách tại ngày bay.", 400);
    }
    const taxes = await client.query('SELECT * FROM "TaxAndFee" WHERE airline_id = $1', [row.airlineId]);
    if (taxes.rows.length !== 1) throw new AppError("Cần đúng một cấu hình thuế và phí cho hãng bay.", 409);
    legs.push({ ...row, fareClassId: selection.fareClassId, tax: calculateBookingTax(row.price, input.passengers.length, taxes.rows[0]) });
  }
  legs.sort((a, b) => input.flights.findIndex(f => f.flightId === a.id) - input.flights.findIndex(f => f.flightId === b.id));
  if (legs.length === 2 && (legs[0].departureAirportId !== legs[1].arrivalAirportId || legs[0].arrivalAirportId !== legs[1].departureAirportId || new Date(legs[1].departureTime) <= new Date(legs[0].arrivalTime))) throw new AppError("Hai chặng khứ hồi không khớp hành trình hoặc thời gian.", 400);
  const seats: Record<string, any>[] = [];
  for (const choice of [...input.seats].sort((a, b) => a.seatId.localeCompare(b.seatId))) {
    const leg = legs.find(leg => leg.id === choice.flightId)!;
    const cabin = /business|thương gia/i.test(leg.fareClassName) ? "BUSINESS" : "ECONOMY";
    const result = await client.query(`SELECT s.*, COALESCE(t."seatType", s."seatType") AS "effectiveSeatType"
      FROM "FlightSeat" s LEFT JOIN "SeatTemplate" t ON t."aircraftId" = $3 AND t."seatNumber" = s."seatNumber" AND t."isActive"
      WHERE s.id = $1 AND s."flightId" = $2 AND s."isActive" AND NOT s."isBooked"
      AND (s."lockedUntil" IS NULL OR s."lockedUntil" <= clock_timestamp()) ${lock ? "FOR UPDATE OF s" : ""}`, [choice.seatId, choice.flightId, leg.aircraftId]);
    const seat = result.rows[0];
    if (!seat || seat.seatClass !== cabin || (seat.effectiveSeatType === "EXIT_ROW" && input.passengers[choice.passengerIndex].kind !== "adult")) throw new AppError("Ghế đã có người đặt hoặc không phù hợp. Vui lòng chọn lại ghế.", 409);
    if (!Number.isSafeInteger(seat.priceModifier) || seat.priceModifier < 0) throw new AppError("Phụ phí ghế không hợp lệ.", 409);
    seats.push({ ...choice, seatNumber: seat.seatNumber, price: seat.priceModifier });
  }
  const services: Record<string, any>[] = [];
  for (const selection of input.services) {
    const leg = legs.find(leg => leg.id === selection.flightId)!;
    if (!selection.serviceIds.length) continue;
    const result = await client.query(`SELECT id, name, type, price FROM "AncillaryService"
      WHERE id = ANY($1::text[]) AND "airlineId" = $2 AND "isActive" ${lock ? "FOR SHARE" : ""}`, [selection.serviceIds, leg.airlineId]);
    if (result.rows.length !== selection.serviceIds.length || result.rows.some(row => !Number.isSafeInteger(row.price) || row.price < 0)) throw new AppError("Dịch vụ đã thay đổi hoặc không thuộc hãng bay này.", 409);
    if (result.rows.filter(row => row.type === "BAGGAGE").length > 1) throw new AppError("Mỗi khách chỉ chọn một gói hành lý trên mỗi chặng.", 400);
    services.push(...result.rows.map(row => ({ ...row, flightId: selection.flightId, passengerIndex: selection.passengerIndex })));
  }
  const fareAmount = legs.reduce((sum, leg) => sum + leg.price * input.passengers.length, 0);
  const seatAmount = seats.reduce((sum, seat) => sum + seat.price, 0);
  const serviceAmount = services.reduce((sum, service) => sum + service.price, 0);
  const taxAndFees = legs.reduce((sum, leg) => sum + leg.tax, 0);
  const subTotal = fareAmount + seatAmount + serviceAmount;
  const totalAmount = subTotal + taxAndFees;
  if (!Number.isSafeInteger(totalAmount) || totalAmount > 2147483647) throw new AppError("Tổng tiền vượt giới hạn cho phép.", 400);
  return { legs, seats, services, fareAmount, seatAmount, serviceAmount, taxAndFees, subTotal, totalAmount };
}

const bookingSelection = `SELECT b.*, CASE WHEN p."transactionCode" LIKE 'DEMO:%' THEN 'demo' ELSE 'gateway' END AS "paymentMode",
    p.status AS "paymentStatus", p."paidAt",
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id', t.id, 'ticketNumber', t."ticketNumber", 'passengerName', t."passengerName",
      'passengerType', t."passengerType", 'flightId', t."flightId", 'status', t.status, 'seatNumber', s."seatNumber", 'isCheckedIn', t."isCheckedIn",
      'qrCodeData', CASE WHEN t.status = 'CANCELLED' THEN NULL ELSE t."qrCodeData" END, 'seatType', s."seatType") ORDER BY t.direction, t.id)
      FROM "Ticket" t LEFT JOIN "FlightSeat" s ON s.id = t."flightSeatId" WHERE t."bookingId" = b.id), '[]') AS tickets
    FROM "Booking" b LEFT JOIN "Payment" p ON p."bookingId" = b.id`;
function presentBooking(row: Record<string, any>) {
  const { requestHash, requestKey, userId: _owner, ...booking } = row;
  return booking;
}
export async function readBooking(client: PoolClient, userId: string, id: string) {
  const result = await client.query(`${bookingSelection} WHERE b.id = $1 AND b."userId" = $2 AND b."isActive"`, [id, userId]);
  if (!result.rows[0]) throw new AppError("Không tìm thấy đơn đặt vé.", 404);
  return presentBooking(result.rows[0]);
}

export async function quoteBooking(value: unknown) {
  const input = validateBooking(value);
  return transaction(async client => {
    const price = await priceBooking(client, input, false);
    return { fareAmount: price.fareAmount, seatAmount: price.seatAmount, serviceAmount: price.serviceAmount, taxAndFees: price.taxAndFees, totalAmount: price.totalAmount, paymentMode: demoPaymentEnabled() ? "demo" : "unavailable" };
  });
}

/** Caller owns the transaction so all booking writes commit or roll back together. */
export async function createBookingWithClient(client: PoolClient, userId: string, input: BookingInput) {
  // A payment choice is display metadata in demo mode. Changing it must not duplicate an
  // order whose successful response was lost. Existing purchases retain their first choice.
  const { paymentChoice, ...purchase } = input;
  const requestHash = createHash("sha256").update(JSON.stringify(purchase)).digest("hex");
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`booking:${userId}:${input.requestKey}`]);
  const existing = await client.query('SELECT id, "requestHash" FROM "Booking" WHERE "userId" = $1 AND "requestKey" = $2', [userId, input.requestKey]);
  if (existing.rows[0]) {
    if (existing.rows[0].requestHash !== requestHash) throw new AppError("Yêu cầu đã được sử dụng với nội dung khác.", 409);
    return readBooking(client, userId, existing.rows[0].id);
  }
  if (!demoPaymentEnabled()) throw new AppError("Thanh toán mô phỏng đã tắt. Vui lòng cấu hình cổng thanh toán.", 503);
  const account = await client.query('SELECT id FROM "User" WHERE id = $1 AND "isActive"', [userId]);
  if (!account.rows.length) throw new AppError("Tài khoản không hoạt động.", 403);
  const price = await priceBooking(client, input, true);
  if (price.totalAmount !== input.expectedTotal) throw new AppError("Giá đã thay đổi. Vui lòng cập nhật báo giá và xác nhận lại.", 409);
  const id = randomUUID();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  // Unique-key collisions are exceedingly rare; the transaction wrapper makes retry safe.
  const pnrCode = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join("");
  const details = {
    paymentChoice: paymentChoice ?? "momo",
    flights: price.legs.map(leg => ({ flightId: leg.id, fareClassId: leg.fareClassId, inventoryId: leg.inventoryId, flightNumber: leg.flightNumber,
      airlineName: leg.airlineName, airlineCode: leg.airlineCode, departureCode: leg.departureCode, arrivalCode: leg.arrivalCode,
      departureCity: leg.departureCity, arrivalCity: leg.arrivalCity, departureTime: leg.departureTime, arrivalTime: leg.arrivalTime,
      fareClassName: leg.fareClassName, price: leg.price, carryOnBaggage: leg.carryOnBaggage, checkedBaggage: leg.checkedBaggage,
      aircraftModel: leg.aircraftModel, departureName: leg.departureName, arrivalName: leg.arrivalName,
      terminal: leg.terminal, gate: leg.gate, isRefundable: leg.isRefundable })),
    passengers: input.passengers, seats: price.seats, services: price.services,
    fareAmount: price.fareAmount, seatAmount: price.seatAmount, serviceAmount: price.serviceAmount,
  };
  await client.query(`INSERT INTO "Booking" (id, "pnrCode", "userId", "isRoundTrip", "subTotal", "taxAndFees", "totalAmount", status,
    "contactName", "contactEmail", "contactPhone", "updatedAt", "requestKey", "requestHash", details)
    VALUES ($1,$2,$3,$4,$5,$6,$7,'CONFIRMED',$8,$9,$10,NOW(),$11,$12,$13::jsonb)`,
    [id, pnrCode, userId, input.flights.length === 2, price.subTotal, price.taxAndFees, price.totalAmount, input.contact.name, input.contact.email, input.contact.phone, input.requestKey, requestHash, JSON.stringify(details)]);
  for (const [index, leg] of price.legs.entries()) {
    await client.query('UPDATE "FlightFareInventory" SET "soldCount" = "soldCount" + $2 WHERE id = $1', [leg.inventoryId, input.passengers.length]);
    for (const [passengerIndex, passenger] of input.passengers.entries()) {
      const seat = price.seats.find(s => s.flightId === leg.id && s.passengerIndex === passengerIndex);
      const addons = price.services.filter(s => s.flightId === leg.id && s.passengerIndex === passengerIndex);
      const ticketId = randomUUID();
      const ticketNumber = `999-${randomInt(1000000000, 10000000000)}`;
      if (seat) await client.query('UPDATE "FlightSeat" SET "isBooked" = true, "lockedUntil" = NULL WHERE id = $1', [seat.seatId]);
      await client.query(`INSERT INTO "Ticket" (id, "ticketNumber", "bookingId", "flightId", "flightSeatId", "fareClassId", direction,
        "passengerName", "passengerType", "dateOfBirth", "identityNumber", "ticketPrice", "qrCodeData")
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [ticketId, ticketNumber, id, leg.id, seat?.seatId ?? null, leg.fareClassId, index === 0 ? "OUTBOUND" : "INBOUND", passenger.name,
          passenger.kind.toUpperCase(), passenger.birthday, passenger.identity || null, leg.price + (seat?.price ?? 0) + addons.reduce((sum, s) => sum + s.price, 0), `ETICKET:${randomBytes(24).toString("hex")}`]);
      for (const addon of addons) await client.query(`INSERT INTO "TicketAddon" (id, "ticketId", "serviceId", "priceAtBooking") VALUES ($1,$2,$3,$4)`, [randomUUID(), ticketId, addon.id, addon.price]);
    }
  }
  await client.query(`INSERT INTO "Payment" (id, "bookingId", "transactionCode", amount, status, "paidAt") VALUES ($1,$2,$3,$4,'SUCCESS',NOW())`, [randomUUID(), id, `DEMO:${randomUUID()}`, price.totalAmount]);
  await client.query(`INSERT INTO "Notification" (id, "userId", title, message) VALUES ($1,$2,$3,$4)`, [randomUUID(), userId, "Đặt vé thành công", `Đơn ${pnrCode} đã xác nhận bằng thanh toán mô phỏng.`]);
  return readBooking(client, userId, id);
}

export async function createBooking(userId: string, value: unknown) {
  const input = validateBooking(value);
  const booking = await transaction(client => createBookingWithClient(client, userId, input));
  await publicCache.invalidateFlights();
  return booking;
}
export async function getBooking(userId: string, id: string) { return transaction(client => readBooking(client, userId, id)); }
export async function getBookingByRequest(userId: string, requestKey: string) {
  if (!/^[\w-]{10,100}$/.test(requestKey)) throw new AppError("Mã yêu cầu không hợp lệ.", 400);
  return transaction(async client => {
    const result = await client.query('SELECT id FROM "Booking" WHERE "userId" = $1 AND "requestKey" = $2 AND "isActive"', [userId, requestKey]);
    if (!result.rows[0]) throw new AppError("Chưa tìm thấy đơn cho yêu cầu này.", 404);
    return readBooking(client, userId, result.rows[0].id);
  });
}
export async function listBookings(userId: string) {
  return transaction(client => listBookingsWithClient(client, userId));
}
export async function listBookingsWithClient(client: PoolClient, userId: string) {
  const result = await client.query(`${bookingSelection} WHERE b."userId" = $1 AND b."isActive" ORDER BY b."createdAt" DESC LIMIT 100`, [userId]);
  return result.rows.map(presentBooking);
}
export async function cancelBooking(userId: string, id: string) {
  const booking = await transaction(client => cancelBookingWithClient(client, userId, id));
  await publicCache.invalidateFlights();
  return booking;
}
export async function cancelBookingWithClient(client: PoolClient, userId: string, id: string) {
    const found = await client.query('SELECT * FROM "Booking" WHERE id = $1 AND "userId" = $2 AND "isActive" FOR UPDATE', [id, userId]);
    const booking = found.rows[0];
    if (!booking) throw new AppError("Không tìm thấy đơn đặt vé.", 404);
    if (booking.status === "CANCELLED") return readBooking(client, userId, id);
    const payment = await client.query('SELECT "transactionCode" FROM "Payment" WHERE "bookingId" = $1 FOR UPDATE', [id]);
    if (!payment.rows[0]?.transactionCode?.startsWith("DEMO:")) throw new AppError("Đơn thanh toán thật cần xử lý theo chính sách hoàn/hủy của hãng.", 409);
    const tickets = await client.query(`SELECT t.*, f."departureTime" FROM "Ticket" t JOIN "Flight" f ON f.id = t."flightId" WHERE t."bookingId" = $1 FOR UPDATE OF t`, [id]);
    if (tickets.rows.some(t => t.isCheckedIn || t.status !== "CONFIRMED" || new Date(t.departureTime) <= new Date())) throw new AppError("Không thể hủy vé đã làm thủ tục hoặc đã đến giờ khởi hành.", 409);
    for (const leg of [...booking.details.flights].sort((a, b) => a.flightId.localeCompare(b.flightId))) {
      await client.query('UPDATE "FlightFareInventory" SET "soldCount" = GREATEST(0, "soldCount" - $2) WHERE id = $1', [leg.inventoryId, booking.details.passengers.length]);
    }
    const seatIds = tickets.rows.map(t => t.flightSeatId).filter(Boolean).sort();
    // Remove the unique ticket/seat link so the seat can be sold again; details retain its original number.
    await client.query('UPDATE "Ticket" SET status = \'CANCELLED\', "flightSeatId" = NULL WHERE "bookingId" = $1', [id]);
    await client.query('UPDATE "FlightSeat" SET "isBooked" = false, "lockedUntil" = NULL WHERE id = ANY($1::text[])', [seatIds]);
    await client.query('UPDATE "Booking" SET status = \'CANCELLED\', "updatedAt" = NOW() WHERE id = $1', [id]);
    await client.query(`INSERT INTO "RefundCancelRequest" (id, "bookingId", reason, "penaltyFee", "refundAmount", status, "processedAt") VALUES ($1,$2,'Hủy đơn mô phỏng',0,$3,'COMPLETED',NOW())`, [randomUUID(), id, booking.totalAmount]);
    return readBooking(client, userId, id);
}
