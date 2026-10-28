// Read-only integration check against the configured database; never seeds data.
import assert from "node:assert/strict";
import express from "express";
import flightRouter from "../src/routes/flight.route";
import authRouter from "../src/routes/auth.route";
import { query } from "../src/config/db.config";

const app = express();
app.use(express.json());
app.use("/api/v1/flights", flightRouter);
app.use("/api/v1/auth", authRouter);
app.use(
  (
    error: { statusCode?: number; message: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res
      .status(error.statusCode || 500)
      .json({ status: "error", message: error.message });
  },
);
const server = app.listen(0, "127.0.0.1");
async function main() {
  if (!server.listening)
    await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as { port: number }).port;
  const post = (path: string, body: unknown) =>
    fetch(`http://127.0.0.1:${port}/api/v1/flights/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  assert.equal((await post("conditions", {})).status, 400);
  const samples = await query(`
    SELECT dep.code AS "departureCode", arr.code AS "arrivalCode",
      TO_CHAR(f."departureTime", 'YYYY-MM-DD') AS "departDate",
      CASE WHEN fc.name ILIKE '%Business%' OR fc.name ILIKE '%Thương gia%' THEN 'Thương gia' ELSE 'Phổ thông' END AS "seatClass"
    FROM "Flight" f
    JOIN "Airport" dep ON dep.id = f."departureAirportId" AND dep."isActive"
    JOIN "Airport" arr ON arr.id = f."arrivalAirportId" AND arr."isActive"
    JOIN "Airline" al ON al.id = f."airlineId" AND al."isActive"
    JOIN "Aircraft" ac ON ac.id = f."aircraftId" AND ac."isActive"
    JOIN "FlightFareInventory" ffi ON ffi."flightId" = f.id AND ffi."isActive"
    JOIN "FareClass" fc ON fc.id = ffi."fareClassId" AND fc."isActive"
    WHERE f."isActive" AND f.status = 'SCHEDULED' AND ffi."totalQuota" > ffi."soldCount"
    ORDER BY f."departureTime" LIMIT 1
  `);
  assert.ok(
    samples.rows.length,
    "Database has no available scheduled flights; no seed was run.",
  );
  const input = { ...samples.rows[0], passengers: 1 };
  const response = await post("conditions", input);
  assert.equal(response.status, 200);
  const flights = (
    (await response.json()) as {
      data: {
        flightId: string;
        ticket: {
          price: number;
          availableSeats: number;
          fareClassId: string;
          fareClassName: string;
        };
      }[];
    }
  ).data;
  assert.ok(flights.length > 0);
  assert.ok(
    flights.every(
      (f) =>
        f.ticket.availableSeats >= input.passengers &&
        Number.isFinite(f.ticket.price) &&
        f.ticket.fareClassId,
    ),
  );
  const fareResponse = await fetch(
    `http://127.0.0.1:${port}/api/v1/flights/${flights[0].flightId}/fares?passengers=1`,
  );
  assert.equal(fareResponse.status, 200);
  const fareOptions = (
    (await fareResponse.json()) as {
      data: {
        flightId: string;
        ticket: {
          fareClassId: string;
          price: number;
          changeFee: number;
          availableSeats: number;
        };
      }[];
    }
  ).data;
  assert.ok(fareOptions.length > 0);
  assert.ok(
    fareOptions.every(
      (fare) =>
        fare.flightId === flights[0].flightId &&
        Number.isFinite(fare.ticket.changeFee) &&
        fare.ticket.availableSeats >= 1,
    ),
  );
  assert.equal(
    (await fetch(`http://127.0.0.1:${port}/api/v1/flights/invalid/fares`))
      .status,
    400,
  );
  const seatResponse = await fetch(
    `http://127.0.0.1:${port}/api/v1/flights/${flights[0].flightId}/seats`,
  );
  assert.equal(seatResponse.status, 200);
  const seats = (
    (await seatResponse.json()) as {
      data: { id: string; available: boolean; priceModifier: number }[];
    }
  ).data;
  assert.ok(Array.isArray(seats));
  assert.ok(
    seats.every(
      (seat) =>
        typeof seat.available === "boolean" &&
        Number.isFinite(seat.priceModifier),
    ),
  );
  assert.equal(
    (await fetch(`http://127.0.0.1:${port}/api/v1/auth/passengers`)).status,
    401,
  );
  assert.equal(
    (
      await fetch(
        `http://127.0.0.1:${port}/api/v1/flights/${flights[0].flightId}/favorite`,
      )
    ).status,
    401,
  );
  const calendarResponse = await post("calendar", {
    ...input,
    startDate: input.departDate,
    endDate: input.departDate,
  });
  assert.equal(calendarResponse.status, 200);
  const calendar = (
    (await calendarResponse.json()) as {
      data: { minPrice: number | null; flightCount: number }[];
    }
  ).data;
  assert.equal(
    calendar[0].minPrice,
    Math.min(...flights.map((f) => f.ticket.price)),
  );
  assert.equal(
    calendar[0].flightCount,
    new Set(flights.map((f) => f.flightId)).size,
  );
  const endDate = new Date(Date.parse(input.departDate) + 6 * 86400000)
    .toISOString()
    .slice(0, 10);
  const weeklyResponse = await post("calendar", {
    ...input,
    startDate: input.departDate,
    endDate,
  });
  assert.equal(weeklyResponse.status, 200);
  const weekly = (
    (await weeklyResponse.json()) as {
      data: { date: string; minPrice: number | null; flightCount: number }[];
    }
  ).data;
  assert.equal(weekly.length, 7);
  for (const day of weekly) {
    const dailyResponse = await post("conditions", {
      ...input,
      departDate: day.date,
    });
    assert.equal(dailyResponse.status, 200);
    const daily = (
      (await dailyResponse.json()) as { data: { ticket: { price: number } }[] }
    ).data;
    assert.equal(
      day.minPrice,
      daily.length ? Math.min(...daily.map((f) => f.ticket.price)) : null,
    );
  }
  const businessResponse = await post("conditions", {
    ...input,
    seatClass: "Thương gia",
  });
  assert.equal(businessResponse.status, 200);
  const business = (
    (await businessResponse.json()) as {
      data: { ticket: { fareClassName: string } }[];
    }
  ).data;
  assert.ok(
    business.every((f) => /Business|Thương gia/i.test(f.ticket.fareClassName)),
  );
  console.log(
    JSON.stringify({
      result: "PASS",
      configuredBackendPort: process.env.PORT || 5000,
      searchOptions: flights.length,
      calendarMinPrice: calendar[0].minPrice,
      businessOptions: business.length,
      fareOptionsChecked: fareOptions.length,
      seatsChecked: seats.length,
      calendarDaysChecked: weekly.length,
      invalidRequestStatus: 400,
    }),
  );
}
main()
  .then(() => server.close(() => process.exit(0)))
  .catch((error) => {
    console.error("Flight API integration check failed:", error.message);
    server.close(() => process.exit(1));
  });
