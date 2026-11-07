import { performance } from 'node:perf_hooks';
import { writeFile } from 'node:fs/promises';

const base = (process.argv[2] || 'https://bookingflight-mobileapp.onrender.com').replace(/\/$/, '');
const samples = 20;
async function request(path, input) {
  const start = performance.now();
  const response = await fetch(`${base}${path}`, {
    method: input ? 'POST' : 'GET',
    headers: input ? { 'Content-Type': 'application/json' } : undefined,
    body: input ? JSON.stringify(input) : undefined,
    signal: AbortSignal.timeout(55000),
  });
  const body = await response.json();
  const ms = performance.now() - start;
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return { ms, body, serverTiming: response.headers.get('server-timing') };
}
function summary(results) {
  const times = results.map(r => r.ms).sort((a, b) => a - b);
  const round = value => Number(value.toFixed(2));
  return {
    requests: results.length,
    p50Ms: round(times[Math.ceil(times.length * .5) - 1]),
    p95Ms: round(times[Math.ceil(times.length * .95) - 1]),
    minMs: round(times[0]), maxMs: round(times.at(-1)),
    serverTiming: results.map(r => r.serverTiming),
  };
}
const health = await request('/health');
console.log(`Health: ${health.body.status}; ${health.ms.toFixed(2)} ms`);
const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
let input = { departureCode: 'HAN', arrivalCode: 'SGN', departDate: date, passengers: 1, seatClass: 'Phổ thông' };
// Find a non-empty sample using public reads only, including the original local benchmark fixture.
const candidates = [input, { ...input, arrivalCode: 'FUK', departDate: '2026-11-03' }];
let initial;
for (const candidate of candidates) {
  initial = await request('/api/v1/flights/conditions', candidate);
  if (!Array.isArray(initial.body.data)) throw new Error('Invalid flight response');
  input = candidate;
  if (initial.body.data.length) break;
}
console.log(`Search sample: ${input.departureCode}-${input.arrivalCode} ${input.departDate}; ${initial.body.data.length} results`);
const sequential = [];
for (let i = 0; i < samples; i++) sequential.push(await request('/api/v1/flights/conditions', input));
console.log('Sequential:', JSON.stringify(summary(sequential)));
const burstStart = performance.now();
const burst = await Promise.all(Array.from({ length: samples }, () => request('/api/v1/flights/conditions', input)));
const burstWallMs = performance.now() - burstStart;
const result = {
  measuredAt: new Date().toISOString(), baseUrl: base,
  scope: 'Remote HTTPS from this workstation to Render; one search; no frontend rendering; no forced cache invalidation or cache toggle',
  health: { ...health.body, responseMs: Number(health.ms.toFixed(2)) },
  input, resultCount: initial.body.data.length,
  initialSearchMs: Number(initial.ms.toFixed(2)),
  sequential: summary(sequential),
  concurrentBurst: { ...summary(burst), wallMs: Number(burstWallMs.toFixed(2)) },
  limitations: [
    'Cache hits/misses and DB query counts are not observable from this public API.',
    'Initial request is not a verified cold-cache or cold-start measurement.',
    'Includes network, TLS, response parsing and server processing; only 20 samples per scenario.',
    'No production capacity, frontend performance or cache speedup claim can be inferred.',
  ],
};
await writeFile(new URL('../docs/remote-performance-results.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
