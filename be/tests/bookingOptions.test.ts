import { afterEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { deleteSavedPassenger, getFavoriteFlights, savePassenger, setFavorite } from "../src/models/bookingOptions.model";
import { savePassengerController, favoriteFlightsController } from "../src/controllers/bookingOptions.controller";

afterEach(() => mock.restoreAll());
const input = { fullName: "Nguyễn Văn An", passengerType: "ADULT" as const, dateOfBirth: "1990-02-28", identityNumber: null };
test("create and edit bind personal data and constrain updates to the authenticated owner", async () => {
  const calls: { sql: string; params: unknown[] }[] = [];
  mock.method(pg.Pool.prototype, "query", async (sql: string, params: unknown[]) => {
    calls.push({ sql, params }); return { rows: [{ ...input, id: "passenger" }] };
  });
  await savePassenger("owner", input);
  await savePassenger("owner", input, "passenger");
  assert.match(calls[0].sql, /INSERT INTO "SavedPassenger"/);
  assert.equal(calls[0].params[0], "owner");
  assert.match(calls[1].sql, /WHERE "userId"=\$1 AND id=\$6 AND "isActive"/);
  assert.deepEqual(calls[1].params, ["owner", input.fullName, "ADULT", input.dateOfBirth, null, "passenger"]);
});
test("missing or other-account passenger edits/deletions return 404", async () => {
  const calls: string[] = [];
  mock.method(pg.Pool.prototype, "query", async (sql: string) => { calls.push(sql); return { rows: [] }; });
  await assert.rejects(savePassenger("owner", input, "other-passenger"), (error: any) => error.statusCode === 404);
  await assert.rejects(deleteSavedPassenger("owner", "other-passenger"), (error: any) => error.statusCode === 404);
  assert.match(calls[1], /WHERE "userId"=\$1 AND id=\$2/);
});
test("favorites are scoped by owner and unavailable flight saves return 404", async () => {
  const calls: { sql: string; params: unknown[] }[] = [];
  mock.method(pg.Pool.prototype, "query", async (sql: string, params: unknown[]) => { calls.push({ sql, params }); return { rows: [] }; });
  assert.deepEqual(await getFavoriteFlights("owner"), []);
  assert.match(calls[0].sql, /WHERE fav\."userId"=\$1/);
  assert.deepEqual(calls[0].params, ["owner"]);
  await assert.rejects(setFavorite("owner", "missing-flight", true), (error: any) => error.statusCode === 404);
});
test("controllers reject anonymous callers and take ownership from JWT", async () => {
  const calls: unknown[][] = [];
  mock.method(pg.Pool.prototype, "query", async (_sql: string, params: unknown[]) => { calls.push(params); return { rows: [input] }; });
  const response: any = { status() { return this; }, json() { return this; } };
  await assert.rejects(favoriteFlightsController({} as any, response), (error: any) => error.statusCode === 401);
  await savePassengerController({ user: { userId: "jwt-owner" }, params: {}, body: { ...input, userId: "attacker-selected-owner" } } as any, response);
  assert.equal(calls[0][0], "jwt-owner");
});
