import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateFlightSearch,
  validateFlightCalendar,
  validateFlightFares,
} from "../src/validators/flight.validator";

const input = {
  departureCode: "SGN",
  arrivalCode: "HAN",
  departDate: "2026-11-01",
  passengers: 2,
  seatClass: "Thương gia",
};
test("search normalizes airport codes and preserves the requested fare", () => {
  assert.deepEqual(
    validateFlightSearch({ ...input, departureCode: " sgn " }),
    input,
  );
});
test("invalid search input fails with HTTP 400 before database access", () => {
  for (const value of [
    null,
    {},
    { ...input, arrivalCode: "SGN" },
    { ...input, departDate: "2026-02-31" },
    { ...input, passengers: 0 },
    { ...input, passengers: 1.5 },
    { ...input, seatClass: "unknown" },
  ]) {
    assert.throws(
      () => validateFlightSearch(value),
      (error) => (error as { statusCode: number }).statusCode === 400,
    );
  }
});
test("calendar validates date ordering and bounds the query range", () => {
  const calendar = { ...input, startDate: "2026-11-01", endDate: "2026-11-07" };
  assert.equal(validateFlightCalendar(calendar).endDate, "2026-11-07");
  assert.throws(() =>
    validateFlightCalendar({ ...calendar, endDate: "2026-10-31" }),
  );
  assert.throws(() =>
    validateFlightCalendar({ ...calendar, endDate: "2026-12-02" }),
  );
});

test("fare lookup validates UUID and passenger count before querying PostgreSQL", () => {
  const id = "11111111-1111-1111-1111-111111111111";
  assert.deepEqual(validateFlightFares(id, "2"), {
    flightId: id,
    passengers: 2,
  });
  assert.equal(validateFlightFares(id, undefined).passengers, 1);
  for (const count of ["bad", "1.5", "0", "19", [], {}])
    assert.throws(() => validateFlightFares(id, count));
  assert.throws(() => validateFlightFares("invalid", 1));
});
