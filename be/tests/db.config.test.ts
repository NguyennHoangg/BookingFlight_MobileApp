import { afterEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { query } from "../src/config/db.config";
import authModel from "../src/models/auth.model";

afterEach(() => mock.restoreAll());

const reset = () => Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" });

test("an opted-in lookup retries a reset once with the same parameters", async () => {
  const calls: unknown[][] = [];
  const result = { rows: [{ id: "user" }] };
  mock.method(pg.Pool.prototype, "query", async (...args: unknown[]) => {
    calls.push(args);
    if (calls.length === 1) throw reset();
    return result;
  });
  assert.equal(await query("SELECT id FROM users WHERE email = $1", ["test@example.com"], { retryOnConnectionReset: true }), result);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], calls[1]);
});

test("persistent resets stop after two attempts and preserve the error", async () => {
  mock.method(console, "error", () => {});
  const error = reset();
  const stub = mock.method(pg.Pool.prototype, "query", async () => { throw error; });
  await assert.rejects(query("SELECT 1", [], { retryOnConnectionReset: true }), e => e === error);
  assert.equal(stub.mock.callCount(), 2);
});

test("writes and transaction commands are never retried by default", async () => {
  mock.method(console, "error", () => {});
  const error = reset();
  const stub = mock.method(pg.Pool.prototype, "query", async () => { throw error; });
  for (const sql of ["INSERT INTO users DEFAULT VALUES", "BEGIN", "COMMIT"]) {
    await assert.rejects(query(sql), e => e === error);
  }
  assert.equal(stub.mock.callCount(), 3);
});

test("SQL and credential errors are not retried", async () => {
  mock.method(console, "error", () => {});
  for (const code of ["42601", "28P01"]) {
    const error = Object.assign(new Error("database error"), { code });
    const stub = mock.method(pg.Pool.prototype, "query", async () => { throw error; });
    await assert.rejects(query("SELECT 1", [], { retryOnConnectionReset: true }), e => e === error);
    assert.equal(stub.mock.callCount(), 1);
    stub.mock.restore();
  }
});

test("all login lookups recover from a single reset", async () => {
  let calls = 0;
  mock.method(pg.Pool.prototype, "query", async () => {
    if (++calls % 2 === 1) throw reset();
    return { rows: [{ id: "user" }] };
  });
  assert.deepEqual(await authModel.checkUserExits("test@example.com"), { id: "user" });
  assert.deepEqual(await authModel.checkUserExitsByPhone("0123456789"), { id: "user" });
  assert.deepEqual(await authModel.findByIdentifier("test@example.com", "email"), { id: "user" });
  assert.equal(calls, 6);
});
