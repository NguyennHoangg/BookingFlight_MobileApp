/** Add missing template seats to flights with existing inventory. Never reseed or overwrite reservations. */
import { query } from "../src/config/db.config";

const missingSql = `SELECT f.id AS "flightId", t."seatNumber", t."seatClass", t."seatType", t."defaultExtraPrice"
  FROM "Flight" f JOIN "Aircraft" a ON a.id = f."aircraftId" AND a."isActive"
  JOIN "SeatTemplate" t ON t."aircraftId" = f."aircraftId" AND t."isActive"
  WHERE f."isActive" AND f.status = 'SCHEDULED'
    AND EXISTS (SELECT 1 FROM "FlightSeat" existing WHERE existing."flightId" = f.id AND existing."isActive")
    AND NOT EXISTS (SELECT 1 FROM "FlightSeat" existing WHERE existing."flightId" = f.id AND existing."seatNumber" = t."seatNumber")`;

async function main() {
  const missing = await query(`SELECT COUNT(*)::int AS seats, COUNT(DISTINCT "flightId")::int AS flights FROM (${missingSql}) missing`);
  const apply = process.argv.includes("--apply");
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", ...missing.rows[0] }));
  if (!apply || !missing.rows[0].seats) return;
  // One atomic INSERT; unique constraints also protect concurrent reruns.
  const result = await query(`INSERT INTO "FlightSeat"
    (id,"flightId","seatNumber","seatClass","seatType","priceModifier","isBooked","isActive")
    SELECT gen_random_uuid()::text, missing."flightId", missing."seatNumber", missing."seatClass",
      missing."seatType", missing."defaultExtraPrice", false, true
    FROM (${missingSql}) missing
    ON CONFLICT ("flightId","seatNumber") DO NOTHING`);
  console.log(JSON.stringify({ insertedSeats: result.rowCount ?? 0 }));
}
main().then(() => process.exit(0)).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
