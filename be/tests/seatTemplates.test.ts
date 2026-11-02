import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeatTemplates } from "../src/utils/seatTemplates";

test("large aircraft layouts include rows beyond 45 and a partial last row", () => {
  const seats = buildSeatTemplates({ id: "a380", seatLayout: "3-4-3", totalSeats: 517 });
  assert.equal(seats.length, 517);
  assert.equal(new Set(seats.map(s => s.seatNumber)).size, 517);
  assert.equal(seats.at(-1)?.seatNumber, "52G");
  assert.equal(seats.filter(s => s.seatClass === "BUSINESS").length, 40);
  assert.equal(seats.find(s => s.seatNumber === "46A")?.seatType, "WINDOW");
});

test("capacities and aisle positions follow each aircraft layout", () => {
  for (const seatLayout of ["3-3", "2-4-2", "3-3-3", "3-4-3"]) {
    const seats = buildSeatTemplates({ id: seatLayout, seatLayout, totalSeats: 203 });
    assert.equal(seats.length, 203);
    assert.equal(seats.find(s => s.seatNumber === "11A")?.seatType, "EXIT_ROW");
  }
  assert.throws(() => buildSeatTemplates({ id: "bad", seatLayout: "unknown", totalSeats: 180 }));
});
