import { randomUUID } from "node:crypto";
import { query } from "../config/db.config";
import { AppError } from "../errors/AppError";
import { seatColumnGroups } from "../utils/seatLayout";
import type { validateSavedPassenger } from "../validators/savedPassenger.validator";

export async function savePassenger(userId: string, input: ReturnType<typeof validateSavedPassenger>, id?: string) {
  const values = [userId, input.fullName, input.passengerType, input.dateOfBirth, input.identityNumber];
  const result = id
    ? await query(`UPDATE "SavedPassenger" SET "fullName"=$2, "passengerType"=$3, "dateOfBirth"=$4, "identityNumber"=$5
        WHERE "userId"=$1 AND id=$6 AND "isActive" RETURNING id, "fullName", "passengerType", "dateOfBirth", "identityNumber"`, [...values, id])
    : await query(`INSERT INTO "SavedPassenger" (id, "userId", "fullName", "passengerType", "dateOfBirth", "identityNumber", "isActive")
        VALUES ($6, $1, $2, $3, $4, $5, true) RETURNING id, "fullName", "passengerType", "dateOfBirth", "identityNumber"`, [...values, randomUUID()]);
  if (!result.rows[0]) throw new AppError("Không tìm thấy hành khách đã lưu.", 404);
  return result.rows[0];
}

export async function deleteSavedPassenger(userId: string, id: string) {
  const result = await query('DELETE FROM "SavedPassenger" WHERE "userId"=$1 AND id=$2 RETURNING id', [userId, id]);
  if (!result.rows.length) throw new AppError("Không tìm thấy hành khách đã lưu.", 404);
}

export async function getFavoriteFlights(userId: string) {
  const result = await query(`SELECT f.id AS "flightId", f."flightNumber", f."departureTime", f."arrivalTime", f.status,
    al.name AS "airlineName", al.code AS "airlineCode", ac.model AS aircraft,
    dep.code AS "departureCode", dep.city AS "departureCity", arr.code AS "arrivalCode", arr.city AS "arrivalCity"
    FROM "FavoriteFlight" fav JOIN "Flight" f ON f.id=fav."flightId"
    JOIN "Airline" al ON al.id=f."airlineId" JOIN "Aircraft" ac ON ac.id=f."aircraftId"
    JOIN "Airport" dep ON dep.id=f."departureAirportId" JOIN "Airport" arr ON arr.id=f."arrivalAirportId"
    WHERE fav."userId"=$1 ORDER BY fav."createdAt" DESC`, [userId]);
  return result.rows;
}

/** Chỉ đọc danh sách hành khách thuộc tài khoản đang xác thực. */
export async function getSavedPassengers(userId: string) {
  const result = await query(
    `SELECT id, "fullName", "passengerType", "dateOfBirth", "identityNumber" FROM "SavedPassenger" WHERE "userId" = $1 AND "isActive" = true ORDER BY "fullName"`,
    [userId],
  );
  return result.rows;
}

/** Trạng thái ghế là ảnh chụp tồn chỗ; API này không khóa ghế hoặc tạo booking. */
export async function getFlightSeats(flightId: string) {
  const result = await query(
    `SELECT s.id, s."seatNumber", s."seatClass", COALESCE(t."seatType", s."seatType") AS "seatType", s."priceModifier",
    substring(s."seatNumber" FROM '^[0-9]+')::int AS "rowNumber",
    substring(s."seatNumber" FROM '[A-Z]+$') AS "columnLetter",
    CASE WHEN s."isBooked" THEN 'BOOKED'
      WHEN s."lockedUntil" > NOW() THEN 'LOCKED' ELSE 'AVAILABLE' END AS status,
    (NOT s."isBooked" AND (s."lockedUntil" IS NULL OR s."lockedUntil" <= NOW())) AS available
    FROM "FlightSeat" s JOIN "Flight" f ON f.id = s."flightId" AND f."isActive" AND f.status = 'SCHEDULED'
    LEFT JOIN "SeatTemplate" t ON t."aircraftId" = f."aircraftId" AND t."seatNumber" = s."seatNumber" AND t."isActive"
    WHERE s."flightId" = $1 AND s."isActive" ORDER BY substring(s."seatNumber" FROM '^[0-9]+')::int, s."seatNumber"`,
    [flightId],
  );
  return result.rows.map((row) => ({
    ...row,
    priceModifier: Number(row.priceModifier),
  }));
}

/** Keep the legacy /seats array contract; /seat-map adds aircraft geometry. */
export async function getFlightSeatMap(flightId: string) {
  const [metadata, seats] = await Promise.all([
    query(
      `SELECT a.id, a.model, a."seatLayout", a."totalSeats",
        ARRAY(SELECT DISTINCT t."columnLetter" FROM "SeatTemplate" t
          WHERE t."aircraftId" = a.id AND t."isActive" ORDER BY t."columnLetter") AS columns
       FROM "Flight" f JOIN "Aircraft" a ON a.id = f."aircraftId" AND a."isActive"
       WHERE f.id = $1 AND f."isActive" AND f.status = 'SCHEDULED'`,
      [flightId],
    ),
    getFlightSeats(flightId),
  ]);
  const aircraft = metadata.rows[0];
  if (!aircraft) throw new AppError("Chuyến bay không còn mở chọn ghế.", 404);
  const columnGroups = seatColumnGroups(aircraft.seatLayout, aircraft.columns);
  const { columns: _columns, ...details } = aircraft;
  return { aircraft: details, columnGroups, seats };
}

/** Dùng khóa duy nhất user/chuyến để thao tác yêu thích có thể gọi lặp an toàn. */
export async function getFavorite(userId: string, flightId: string) {
  const result = await query(
    'SELECT id FROM "FavoriteFlight" WHERE "userId" = $1 AND "flightId" = $2',
    [userId, flightId],
  );
  return result.rows.length > 0;
}
export async function setFavorite(
  userId: string,
  flightId: string,
  favorite: boolean,
) {
  if (favorite) {
    const result = await query(
      `INSERT INTO "FavoriteFlight" (id, "userId", "flightId", "createdAt") SELECT $1, $2, id, NOW() FROM "Flight" WHERE id = $3 AND "isActive" ON CONFLICT ("userId", "flightId") DO UPDATE SET "flightId" = EXCLUDED."flightId" RETURNING id`,
      [randomUUID(), userId, flightId],
    );
    if (!result.rows.length) throw new AppError("Chuyến bay không còn tồn tại hoặc đã ngừng hoạt động.", 404);
  }
  else
    await query(
      'DELETE FROM "FavoriteFlight" WHERE "userId" = $1 AND "flightId" = $2',
      [userId, flightId],
    );
  return getFavorite(userId, flightId);
}
