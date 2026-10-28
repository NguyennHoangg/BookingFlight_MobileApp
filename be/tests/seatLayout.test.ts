import { test } from "node:test";
import assert from "node:assert/strict";
import { seatColumnGroups } from "../src/utils/seatLayout";

test("all supported configurations preserve aisle positions and skipped letters", () => {
  assert.deepEqual(seatColumnGroups("3-3"), [["A", "B", "C"], ["D", "E", "F"]]);
  assert.deepEqual(seatColumnGroups("2-4-2"), [["A", "C"], ["D", "E", "F", "G"], ["H", "K"]]);
  assert.deepEqual(seatColumnGroups("3-3-3").map((group) => group.length), [3, 3, 3]);
  assert.deepEqual(seatColumnGroups("3-4-3"), [["A", "B", "C"], ["D", "E", "F", "G"], ["H", "J", "K"]]);
});
test("additional layouts require complete explicit columns, never guessed labels", () => {
  assert.deepEqual(seatColumnGroups("1-2-1", ["K", "D", "A", "G"]), [["A"], ["D", "G"], ["K"]]);
  for (const value of ["", "other", "0-3", "3-9", "3", "3--3"]) assert.deepEqual(seatColumnGroups(value, ["A", "B", "C"]), []);
  assert.deepEqual(seatColumnGroups("2-2", ["A", "C"]), []);
});
