import assert from "node:assert/strict";
import { test } from "node:test";
import { createPublicCache, type CacheStore } from "../src/redis/publicCache";

function memoryRedis() {
  let time = 0;
  const entries = new Map<string, { data: string; expires: number }>();
  const store: CacheStore = {
    get: async key => {
      const row = entries.get(key);
      return row && row.expires > time ? row.data : null;
    },
    setEx: async (key, ttl, data) => { entries.set(key, { data, expires: time + ttl * 1000 }); },
    set: async (key, data) => { entries.set(key, { data, expires: Infinity }); },
  };
  return { store, entries, advance: (ms: number) => { time += ms; } };
}

test("Redis hits avoid loading; expiration and input changes query again", async () => {
  const redis = memoryRedis();
  const cache = createPublicCache(() => redis.store);
  let calls = 0;
  const load = async () => [{ price: ++calls }];
  assert.deepEqual(await cache.remember("search", ["SGN", 1], 15, load), [{ price: 1 }]);
  assert.deepEqual(await cache.remember("search", ["SGN", 1], 15, load), [{ price: 1 }]);
  assert.equal(calls, 1);
  redis.advance(15_000);
  await cache.remember("search", ["SGN", 1], 15, load);
  await cache.remember("search", ["SGN", 2], 15, load);
  assert.equal(calls, 3);
  assert.equal(cache.stats().hits, 1);
});

test("cold bursts coalesce DB reads even when Redis is unavailable", async () => {
  for (const store of [memoryRedis().store, null]) {
    const cache = createPublicCache(() => store);
    let calls = 0;
    const replies = await Promise.all(Array.from({ length: 100 }, () => cache.remember("search", [], 15, async () => {
      calls++;
      await new Promise(resolve => setImmediate(resolve));
      return { flights: [] };
    })));
    assert.equal(calls, 1);
    assert.equal(replies.length, 100);
    assert.equal(cache.stats().coalesced, 99);
  }
});

test("cache read/write failures never replay a loader and loader errors are not cached", async () => {
  const broken: CacheStore = {
    get: async () => { throw new Error("offline"); },
    setEx: async () => { throw new Error("offline"); },
    set: async () => { throw new Error("offline"); },
  };
  const cache = createPublicCache(() => broken);
  let calls = 0;
  assert.equal(await cache.remember("search", [], 15, async () => ++calls), 1);
  assert.equal(calls, 1);
  await assert.rejects(cache.remember("failure", [], 15, async () => { throw new Error("DB failed"); }), /DB failed/);
  assert.equal(await cache.remember("failure", [], 15, async () => "recovered"), "recovered");
  assert.equal(await cache.flightRevision(), null);
  await cache.invalidateFlights();
});

test("corrupt cache values are replaced with fresh data", async () => {
  const redis = memoryRedis();
  const cache = createPublicCache(() => redis.store);
  await cache.remember("search", [], 15, async () => "first");
  const key = [...redis.entries.keys()][0];
  redis.entries.get(key)!.data = "invalid json";
  assert.equal(await cache.remember("search", [], 15, async () => "second"), "second");
});

test("new inventory revision bypasses both old results and an in-flight old load", async () => {
  const redis = memoryRedis();
  const cache = createPublicCache(() => redis.store);
  const before = await cache.flightRevision();
  let finish: (value: string) => void;
  const stale = cache.remember("search", [before, "route"], 15, () => new Promise<string>(resolve => { finish = resolve; }));
  await new Promise(resolve => setImmediate(resolve));
  await cache.invalidateFlights();
  const after = await cache.flightRevision();
  assert.notEqual(before, after);
  assert.equal(await cache.remember("search", [after, "route"], 15, async () => "fresh"), "fresh");
  finish!("old");
  await stale;
  assert.equal(await cache.remember("search", [after, "route"], 15, async () => "unexpected"), "fresh");
});
