# Redis cache and API performance

The backend uses Redis for public reads, alongside the existing authentication
keys. Start the existing Redis service with `docker compose up -d redis` from the
repository root. Configure `REDIS_URL=redis://127.0.0.1:6379` in `be/.env` for local
development. `REDIS_URL_DEV` and `REDIS_URL_PROD` remain supported; `REDIS_URL` takes
precedence. `/health` reports `redis: ready` or `unavailable`.

| Read | Redis TTL |
| --- | --- |
| Flight search | 15 seconds |
| Calendar | 30 seconds |
| Airports, destinations, assistant catalog | 300 seconds |

Keys use a versioned namespace and a SHA-256 digest of validated, normalized
inputs. Search and calendar keys include the inventory revision. Only public data
is stored here; fares at checkout, seat availability, quotes, bookings, payments,
tax configuration and passenger data retain their live database reads.

Identical concurrent misses are coalesced within each API process, including
when Redis is unavailable. Other API instances share Redis results, but cold
loads are not protected by a distributed lock. No database exception is cached
or automatically retried. Invalid JSON and failed Redis reads/writes fall back
to the database. Public Redis commands have a 150 ms deadline, offline queues
are disabled, and pending-key bookkeeping is limited to 1,000 requests.

Successful booking creation/cancellation changes the shared inventory revision
**after** the database transaction commits. In-flight results for the old
revision cannot populate the new revision. Old result keys expire naturally,
without scanning or deleting the whole keyspace. Redis invalidation failure does
not undo a committed booking; the short TTL limits staleness. The frontend clears
its own search/calendar cache after booking creation, recovery or cancellation.
Manual database/admin updates rely on TTL, or should call
`publicCache.invalidateFlights()` after committing an inventory change.

Frontend cache can add up to 30 seconds of search staleness and 60 seconds of
calendar staleness on top of Redis TTL. Search prices are provisional: checkout
checks live price, quota and seats inside the existing database transaction.
Pull to refresh discards the frontend cache; Redis still honors its short TTL.

`Server-Timing: app;dur=...` on the search/calendar responses measures backend
work. `publicCache.stats()` provides process-local hit/miss/coalesced/error/load
counters for diagnosis. `PUBLIC_CACHE_ENABLED=false` disables Redis public caching
without affecting authentication. `PUBLIC_CACHE_PREFIX` isolates a deployment's
public keyspace. Use separate Redis instances for independently managed apps;
do not enable an eviction policy that might discard token blacklist keys.

## Measured HTTP benchmark

Set `PUBLIC_CACHE_LOG=true` to print public-cache events in server logs. Events
include `HIT`, `MISS`, `LOAD`, `SET`, `COALESCED`, `BYPASS`, `READ_ERROR`,
`WRITE_ERROR` and `INVALIDATE`, together with the public data scope. Logging is
off by default and does not print request payloads, credentials or Redis URLs.
`LOAD` counts loader calls, not individual SQL queries. `MISS` can follow a
read error; `BYPASS` means no usable cache store for that operation. Deploy this
code before enabling the variable. Frontend cache hits do not reach the server
and therefore produce no backend cache log.

Run `npm run perf:api` from `be`. It reads an existing scheduled flight, starts a
loopback HTTP API, compares responses with Redis disabled/enabled, and saves
`docs/performance-results.json`. It writes only a unique Redis benchmark namespace:
result keys expire after 15 seconds and its revision key is removed on exit.
It does not seed or update the booking database. Timings include HTTP, JSON and
backend processing. Initial connection establishment is excluded.

Measured with local Redis and the configured PostgreSQL database, one API process,
one search returning one fare:

| Scenario | HTTP requests | DB queries | p50 | p95 |
| --- | ---: | ---: | ---: | ---: |
| Redis disabled, sequential | 20 | 20 | 154.07 ms | 193.59 ms |
| Redis warm, sequential | 20 | 0 | 3.16 ms | 10.06 ms |
| Redis cold, concurrent burst | 20 | 1 | 189.36 ms | 190.87 ms |

Warm-cache p50 was 48.76 times faster in this run. The cold burst still waits for
one DB load; coalescing reduces database pressure rather than that query's latency.
This is a small repeatable local benchmark, not a production capacity or mobile
frame-rate claim. Dataset, network and deployment topology affect the result.

Validate with `npm run build`, `npm run test:auth`, `npm run test:cache` and
`npx tsx --test tests/*.test.ts`. Tests cover TTL, key separation, malformed cache,
Redis outages, concurrent misses and revision races.
