import { createHash, randomUUID } from "node:crypto";
import redisConfig from "../config/redis.config";

export interface CacheStore {
  get(key: string): Promise<string | null>;
  setEx(key: string, seconds: number, value: string): Promise<unknown>;
  set(key: string, value: string): Promise<unknown>;
}

export function createPublicCache(
  getStore: () => CacheStore | null,
  prefix = "booking:public:v1",
) {
  const pending = new Map<string, Promise<unknown>>();
  const counters = {
    hits: 0,
    misses: 0,
    coalesced: 0,
    bypasses: 0,
    errors: 0,
    loads: 0,
  };
  const revisionKey = `${prefix}:flights:revision`;
  // Only public-cache metadata is logged; never log payloads, credentials or Redis URLs.
  function log(event: string, scope: string) {
    if (process.env.PUBLIC_CACHE_LOG === "true") {
      console.info(`[PublicCache] ${JSON.stringify({ event, scope })}`);
    }
  }
  async function remember<T>(
    scope: string,
    input: unknown,
    ttl: number,
    load: () => Promise<T>,
    cacheable = true,
  ): Promise<T> {
    const hash = createHash("sha256")
      .update(JSON.stringify(input))
      .digest("hex");
    const key = `${prefix}:${scope}:${hash}`;
    const existing = pending.get(key);
    if (existing) {
      counters.coalesced++;
      log("COALESCED", scope);
      return existing as Promise<T>;
    }
    const work = async () => {
      const store = cacheable ? getStore() : null;
      if (store) {
        try {
          const raw = await store.get(key);
          if (raw !== null) {
            const cached = JSON.parse(raw);
            if (cached?.version === 1 && "data" in cached) {
              counters.hits++;
              log("HIT", scope);
              return cached.data as T;
            }
          }
        } catch {
          counters.errors++;
          log("READ_ERROR", scope);
        }
        counters.misses++;
        log("MISS", scope);
      } else {
        counters.bypasses++;
        log("BYPASS", scope);
      }
      counters.loads++;
      log("LOAD", scope);
      const data = await load();
      if (store) {
        try {
          await store.setEx(key, ttl, JSON.stringify({ version: 1, data }));
          log("SET", scope);
        } catch {
          counters.errors++;
          log("WRITE_ERROR", scope);
        }
      }
      return data;
    };
    if (pending.size >= 1000) return work();
    const request = work().finally(() => {
      pending.delete(key);
    });
    pending.set(key, request);
    return request;
  }

  async function flightRevision(): Promise<string | null> {
    const store = getStore();
    if (!store) return null;
    try {
      return (await store.get(revisionKey)) || "initial";
    } catch {
      counters.errors++;
      log("READ_ERROR", "flights:revision");
      return null;
    }
  }

  async function invalidateFlights() {
    const store = getStore();
    if (!store) return;
    try {
      await store.set(revisionKey, randomUUID());
      log("INVALIDATE", "flights:revision");
    } catch {
      counters.errors++;
      log("WRITE_ERROR", "flights:revision");
    }
  }

  return {
    remember,
    flightRevision,
    invalidateFlights,
    stats: () => ({ ...counters }),
  };
}

export const publicCache = createPublicCache(() => {
  if (process.env.PUBLIC_CACHE_ENABLED === "false") return null;
  const client = redisConfig.getRedis()?.withCommandOptions({ timeout: 150 });
  if (!client) return null;
  return {
    get: async (key) => {
      const value = await client.get(key);
      return value === null ? null : String(value);
    },
    setEx: (key, ttl, value) => client.setEx(key, ttl, value),
    set: (key, value) => client.set(key, value),
  };
}, process.env.PUBLIC_CACHE_PREFIX || "booking:public:v1");
