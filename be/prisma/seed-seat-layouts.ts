/** Add missing seats only in the bounded upcoming window. */
import { query } from "../src/config/db.config";
import { seatRepairDays, assertSeatRepairBudget } from "../src/utils/seatRepairPolicy";

const days = seatRepairDays(process.argv);

const missingSql = `SELECT f.id AS "flightId", t."seatNumber", t."seatClass", t."seatType", t."defaultExtraPrice"
  FROM "Flight" f JOIN "Aircraft" a ON a.id = f."aircraftId" AND a."isActive"
  JOIN "SeatTemplate" t ON t."aircraftId" = f."aircraftId" AND t."isActive"
  WHERE f."isActive" AND f.status = 'SCHEDULED'
    AND f."departureTime" >= NOW() AND f."departureTime" < NOW() + ($1::int * INTERVAL '1 day')
    AND NOT EXISTS (SELECT 1 FROM "FlightSeat" existing WHERE existing."flightId" = f.id AND existing."seatNumber" = t."seatNumber")`;

async function main() {
  const missing = await query(`SELECT COUNT(*)::int AS seats, COUNT(DISTINCT "flightId")::int AS flights FROM (${missingSql}) missing`, [days]);
  const size = await query('SELECT pg_database_size(current_database())::text AS bytes');
  assertSeatRepairBudget(missing.rows[0].seats, Number(size.rows[0].bytes));
  const apply = process.argv.includes("--apply");
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", days, ...missing.rows[0] }));
  if (!apply || !missing.rows[0].seats) return;
  // One atomic INSERT; unique constraints also protect concurrent reruns.
  const result = await query(`INSERT INTO "FlightSeat"
    (id,"flightId","seatNumber","seatClass","seatType","priceModifier","isBooked","isActive")
    SELECT gen_random_uuid()::text, missing."flightId", missing."seatNumber", missing."seatClass",
      missing."seatType", missing."defaultExtraPrice", false, true
    FROM (${missingSql}) missing
    ON CONFLICT ("flightId","seatNumber") DO NOTHING`, [days]);
  console.log(JSON.stringify({ insertedSeats: result.rowCount ?? 0 }));
}
main().then(() => process.exit(0)).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
