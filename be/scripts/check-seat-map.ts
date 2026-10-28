// Read-only check: no seed, migration, or booking writes.
import assert from "node:assert/strict";
import { query } from "../src/config/db.config";
import { getFlightSeatMap } from "../src/models/bookingOptions.model";
import { getFlightFares } from "../src/models/flight.model";
import { writeFileSync } from "node:fs";

async function main() {
  const flights = await query(`SELECT DISTINCT ON (a."seatLayout") f.id, a."seatLayout"
    FROM "Flight" f JOIN "Aircraft" a ON a.id = f."aircraftId"
    WHERE f."isActive" AND a."isActive" AND f.status = 'SCHEDULED'
      AND EXISTS (SELECT 1 FROM "FlightSeat" s WHERE s."flightId" = f.id AND s."isActive")
    ORDER BY a."seatLayout", f."departureTime"`);
  assert.ok(flights.rows.length, "No scheduled flights with seat inventory");
  const fixtures: unknown[] = [];
  for (const flight of flights.rows) {
    const map = await getFlightSeatMap(flight.id);
    assert.equal(map.columnGroups.map((group) => group.length).join("-"), flight.seatLayout);
    assert.ok(map.seats.every((seat) => typeof seat.priceModifier === "number" && typeof seat.available === "boolean"));
    const invalid = map.seats.filter((seat) => !map.columnGroups.flat().includes(seat.columnLetter));
    console.log(JSON.stringify({ layout: flight.seatLayout, seats: map.seats.length, columns: map.columnGroups, legacySeatsOutsideLayout: invalid.length }));
    if (process.argv.includes("--fixtures")) {
      const fares = await getFlightFares(flight.id, 2);
      const fare = fares.find((item) => !/business|thương gia/i.test(item.ticket.fareClassName));
      if (fare) fixtures.push({ layout: flight.seatLayout, fare, map });
    }
  }
  if (process.argv.includes("--fixtures")) writeFileSync("../fe/.expo/seat-fixtures.json", JSON.stringify(fixtures));
}
main().then(() => process.exit(0)).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
