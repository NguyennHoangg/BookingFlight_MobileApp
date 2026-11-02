import { test } from "node:test";
import assert from "node:assert/strict";
import { seatRepairDays, assertSeatRepairBudget } from "../src/utils/seatRepairPolicy";

test("maintenance defaults to 30 days and rejects unbounded windows", () => {
  assert.equal(seatRepairDays([]), 30);
  assert.equal(seatRepairDays(["--days=7"]), 7);
  for (const days of ["0", "31", "365", "NaN", "1.5"])
    assert.throws(() => seatRepairDays([`--days=${days}`]));
});
test("maintenance rejects large insertions and preserves database headroom", () => {
  assert.ok(assertSeatRepairBudget(23000, 91_000_000) < 20_000_000);
  assert.throws(() => assertSeatRepairBudget(250001, 91_000_000));
  assert.throws(() => assertSeatRepairBudget(23000, 345_000_000));
  assert.ok(assertSeatRepairBudget(100, 90_000_000, 1000) > assertSeatRepairBudget(100, 90_000_000));
});
