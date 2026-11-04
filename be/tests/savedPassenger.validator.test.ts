import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSavedPassenger } from "../src/validators/savedPassenger.validator";

const input = { fullName: " Nguyễn  Văn An ", passengerType: "ADULT", dateOfBirth: "1990-02-28", identityNumber: " 012345678901 " };
test("saved passenger normalizes fields and ignores client-supplied ownership", () => {
  assert.deepEqual(validateSavedPassenger({ ...input, userId: "another-user", id: "injected" }), {
    fullName: "Nguyễn Văn An", passengerType: "ADULT", dateOfBirth: "1990-02-28", identityNumber: "012345678901",
  });
  assert.equal(validateSavedPassenger({ ...input, identityNumber: "" }).identityNumber, null);
  assert.equal(validateSavedPassenger({ ...input, dateOfBirth: "2000-02-29" }).dateOfBirth, "2000-02-29");
});
test("saved passenger rejects invalid personal data before database writes", () => {
  for (const value of [null, {}, { ...input, fullName: "A" }, { ...input, fullName: "Robert; DROP TABLE" },
    { ...input, passengerType: "unknown" }, { ...input, dateOfBirth: "1990-02-30" },
    { ...input, dateOfBirth: "2999-01-01" }, { ...input, dateOfBirth: "1899-01-01" },
    { ...input, dateOfBirth: "2000-02-29T00:00:00Z" }, { ...input, identityNumber: "abc'123" }]) {
    assert.throws(() => validateSavedPassenger(value), (error: any) => error.statusCode === 400);
  }
});
