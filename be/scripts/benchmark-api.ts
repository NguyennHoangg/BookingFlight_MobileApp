// Reads existing flight data. Writes only expiring, isolated Redis benchmark keys.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import express from "express";
import pg from "pg";

process.env.PUBLIC_CACHE_PREFIX = `booking:benchmark:${randomUUID()}`;
const { default: redis } = await import("../src/config/redis.config");
const { publicCache } = await import("../src/redis/publicCache");
const { query, closePool } = await import("../src/config/db.config");
const { default: flightRouter } = await import("../src/routes/flight.route");
const { default: errorHandler } =
  await import("../src/middlewares/errorrHandler");
const app = express();
app.use(express.json());
app.use("/flights", flightRouter);
app.use(errorHandler);
const server = app.listen(0, "127.0.0.1");
let dbQueries = 0;
const originalQuery = pg.Pool.prototype.query;
// Instrument this process only; do not log SQL parameters or credentials.
(pg.Pool.prototype as any).query = function (...args: unknown[]) {
  dbQueries++;
  return originalQuery.apply(this, args as any);
};

try {
  await Promise.race([
    redis.init(),
    new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Redis connection timed out; start Redis or set REDIS_URL.",
            ),
          ),
        5000,
      ).unref(),
    ),
  ]);
  assert.ok(redis.getRedisStatus(), "Redis must be ready for a real benchmark");
  const sample =
    await query(`SELECT dep.code AS "departureCode", arr.code AS "arrivalCode",
    TO_CHAR(f."departureTime", 'YYYY-MM-DD') AS "departDate"
    FROM "Flight" f JOIN "Airport" dep ON dep.id = f."departureAirportId"
    JOIN "Airport" arr ON arr.id = f."arrivalAirportId"
    WHERE f."isActive" AND f.status = 'SCHEDULED' ORDER BY f."departureTime" LIMIT 1`);
  assert.ok(
    sample.rows[0],
    "No scheduled flights in the database; benchmark does not seed data",
  );
  const input = { ...sample.rows[0], passengers: 1, seatClass: "Phổ thông" };
  if (!server.listening) await once(server, "listening");
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/flights/conditions`;
  async function request() {
    const started = performance.now();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await response.json()) as { data: unknown[] };
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body.data));
    return { ms: performance.now() - started, body };
  }
  const summarize = (times: number[], queries: number) => {
    const sorted = [...times].sort((a, b) => a - b);
    return {
      requests: times.length,
      databaseQueries: queries,
      p50Ms: Number(sorted[Math.ceil(sorted.length * 0.5) - 1].toFixed(2)),
      p95Ms: Number(sorted[Math.ceil(sorted.length * 0.95) - 1].toFixed(2)),
    };
  };
  process.env.PUBLIC_CACHE_ENABLED = "false";
  const baseline = await request(); // Exclude initial DB/TLS/HTTP connection establishment.
  let before = dbQueries;
  const uncached: number[] = [];
  for (let i = 0; i < 20; i++) uncached.push((await request()).ms);
  const baselineSummary = summarize(uncached, dbQueries - before);
  process.env.PUBLIC_CACHE_ENABLED = "true";
  const cold = await request();
  assert.deepEqual(
    cold.body,
    baseline.body,
    "Redis must preserve the response contract",
  );
  before = dbQueries;
  const cached: number[] = [];
  for (let i = 0; i < 20; i++) cached.push((await request()).ms);
  const cachedSummary = summarize(cached, dbQueries - before);
  await publicCache.invalidateFlights();
  before = dbQueries;
  const burst = await Promise.all(Array.from({ length: 20 }, request));
  for (const response of burst) assert.deepEqual(response.body, baseline.body);
  const burstSummary = summarize(
    burst.map((value) => value.ms),
    dbQueries - before,
  );
  assert.equal(cachedSummary.databaseQueries, 0);
  assert.equal(
    burstSummary.databaseQueries,
    1,
    "A cold burst must coalesce database reads",
  );
  const results = {
    scope:
      "HTTP flight search, existing PostgreSQL data, real Redis; one API process",
    input,
    resultCount: baseline.body.data.length,
    uncached: baselineSummary,
    redisWarm: cachedSummary,
    redisColdBurst: burstSummary,
    p50Speedup: Number(
      (baselineSummary.p50Ms / cachedSummary.p50Ms).toFixed(2),
    ),
    cache: publicCache.stats(),
  };
  console.log(JSON.stringify(results, null, 2));
  await writeFile(
    new URL("../docs/performance-results.json", import.meta.url),
    JSON.stringify(results, null, 2) + "\n",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Benchmark failed");
  process.exitCode = 1;
} finally {
  (pg.Pool.prototype as any).query = originalQuery;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  const client = redis.getRedis();
  // Delete only our own revision; result keys expire within 15 seconds.
  if (client)
    await client
      .del(`${process.env.PUBLIC_CACHE_PREFIX}:flights:revision`)
      .catch(() => {});
  await redis.closeRedis();
  await closePool();
}
