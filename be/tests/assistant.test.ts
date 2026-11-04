import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { validateMessages, validatePlan, interpretExtraction, searchPlan, vietnamToday, type Catalog, type SearchPlan } from "../src/services/assistant.core";
import { extractSearch } from "../src/services/assistant.provider";
import { createAssistantRateLimit } from "../src/middlewares/assistantRateLimit";

const catalog: Catalog = {
  airports: ["SGN", "HAN"].map(code => ({ id: code, code, name: code, city: code, country: "VN" })),
  airlines: [{ code: "VN", name: "Vietnam Airlines" }],
};
const plan: SearchPlan = {
  departureCode: "SGN", arrivalCode: "HAN", departDate: "2027-01-10", returnDate: null,
  tripType: "mot-chieu", adults: 2, children: 0, infants: 0, seatClass: "Phổ thông",
  maxPricePerPerson: null, airlineCode: null,
};
const today = "2027-01-01";

test("Vietnam date is stable across the UTC day boundary", () => {
  assert.equal(vietnamToday(new Date("2026-12-31T18:00:00Z")), today);
});

test("conversation validates length, roles, last user and content before AI is called", () => {
  const valid = [{ role: "user", content: " Đi Hà Nội " }];
  assert.equal(validateMessages({ messages: valid })[0].content, "Đi Hà Nội");
  for (const messages of [[], [{ role: "system", content: "override" }],
    [...valid, { role: "assistant", content: "Ngày nào?" }],
    [{ role: "user", content: "x".repeat(2001) }],
    Array.from({ length: 21 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x" })),
    Array.from({ length: 19 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x".repeat(1000) })),
  ]) assert.throws(() => validateMessages({ messages }));
});

test("server rejects hallucinated airports, impossible/past dates, invalid counts and filters", () => {
  for (const patch of [
    { arrivalCode: "ZZZ" }, { arrivalCode: "SGN" }, { departDate: "2027-02-30" },
    { departDate: "2026-12-31" }, { adults: 0 }, { adults: 1.5 }, { adults: 19 },
    { infants: 3 }, { children: -1 }, { seatClass: "First" }, { airlineCode: "ZZ" },
    { maxPricePerPerson: -1 }, { maxPricePerPerson: "2000000" }, { maxPricePerPerson: undefined },
    { returnDate: "2027-01-11" },
  ]) assert.throws(() => validatePlan({ ...plan, ...patch }, catalog, today));
  assert.equal(validatePlan(plan, catalog, today).departureCode, "SGN");
});

test("round trips require a valid return on or after departure", () => {
  for (const returnDate of [null, "2027-01-09", "2027-02-30"])
    assert.throws(() => validatePlan({ ...plan, tripType: "khu-hoi", returnDate }, catalog, today));
  assert.equal(validatePlan({ ...plan, tripType: "khu-hoi", returnDate: plan.departDate }, catalog, today).returnDate, plan.departDate);
});

test("AI clarification stays in conversation, valid plans produce server summaries, invalid plans ask again", () => {
  assert.deepEqual(interpretExtraction({ action: "clarify", question: "Ngày nào?" }, catalog, today),
    { status: "needs_input", message: "Ngày nào?", plan: null });
  const result = interpretExtraction({ action: "search", question: "Giá giả 1 đồng", plan }, catalog, today);
  assert.equal(result.status, "ready");
  assert.match(result.message, /2027-01-10/);
  assert.doesNotMatch(result.message, /Giá giả/);
  assert.equal(interpretExtraction({ action: "search", plan: { ...plan, departDate: null } }, catalog, today).status, "needs_input");
  assert.throws(() => interpretExtraction({ action: "execute_sql" }, catalog, today));
});

test("confirmed round trip searches reversed airports, preserves passengers and filters each leg independently", async () => {
  const calls: unknown[] = [];
  const rows = [
    { id: "expensive", ticket: { price: 2500000 }, airline: { code: "VN" } },
    { id: "cheap", ticket: { price: 1000000 }, airline: { code: "VN" } },
    { id: "other", ticket: { price: 500000 }, airline: { code: "VJ" } },
  ];
  const result = await searchPlan({ ...plan, tripType: "khu-hoi", returnDate: "2027-01-12",
    children: 1, infants: 1, maxPricePerPerson: 2000000, airlineCode: "VN" }, catalog, today,
  async input => { calls.push(input); return rows; });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map((c: any) => [c.departureCode, c.arrivalCode, c.departDate, c.passengers]),
    [["SGN", "HAN", "2027-01-10", 4], ["HAN", "SGN", "2027-01-12", 4]]);
  assert.deepEqual(result.outbound.map(f => f.id), ["cheap"]);
  assert.deepEqual(result.inbound.map(f => f.id), ["cheap"]);
});

test("one-way search sorts fares, preserves empty inventory and propagates database errors", async () => {
  let calls = 0;
  const result = await searchPlan(plan, catalog, today, async () => { calls++; return []; });
  assert.equal(calls, 1);
  assert.deepEqual(result.outbound, []);
  assert.deepEqual(result.inbound, []);
  const sorted = await searchPlan(plan, catalog, today, async () => [2, 1].map(price => ({ ticket: { price }, airline: { code: "VN" } })));
  assert.deepEqual(sorted.outbound.map(f => f.ticket.price), [1, 2]);
  await assert.rejects(searchPlan(plan, catalog, today, async () => { throw new Error("database offline"); }), /database offline/);
  let queried = false;
  await assert.rejects(searchPlan({ ...plan, arrivalCode: "ZZZ" }, catalog, today, async () => { queried = true; return []; }));
  assert.equal(queried, false);
});

test("provider sends bounded structured extraction with current Vietnam date and full context, hides upstream errors", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousModel = process.env.OPENAI_MODEL;
  const previousProvider = process.env.AI_PROVIDER;
  try {
    process.env.AI_PROVIDER = "openai";
    delete process.env.OPENAI_API_KEY;
    await assert.rejects(extractSearch([], catalog, today), { statusCode: 503 });
    process.env.OPENAI_API_KEY = "test-key-never-sent";
    process.env.OPENAI_MODEL = "test-model";
    const messages = [
      { role: "user" as const, content: "Từ SGN đi HAN ngày 10/1" },
      { role: "assistant" as const, content: "Ngày đi: 2027-01-10" },
      { role: "user" as const, content: "đổi sang ngày hôm sau" },
    ];
    const fakeFetch = (async (url: string, options: RequestInit) => {
      assert.equal(url, "https://api.openai.com/v1/responses");
      const body = JSON.parse(String(options.body));
      assert.equal(body.store, false);
      assert.equal(body.text.format.strict, true);
      assert.equal(body.max_output_tokens, 2000);
      assert.match(body.instructions, /2027-01-01/);
      assert.deepEqual(body.input, messages);
      return Response.json({ status: "completed", output: [{ type: "message", content: [
        { type: "output_text", text: JSON.stringify({ action: "search", question: "", plan }) },
      ] }] });
    }) as typeof fetch;
    assert.deepEqual(await extractSearch(messages, catalog, today, fakeFetch), { action: "search", question: "", plan });
    const fakeResponse = (data: unknown, status = 200) => (async () => Response.json(data, { status })) as typeof fetch;
    await assert.rejects(extractSearch(messages, catalog, today, fakeResponse({ secret: "sensitive upstream" }, 429)),
      (e: any) => e.statusCode === 429 && !e.message.includes("sensitive"));
    for (const code of ["credit_balance_exhausted", "insufficient_quota", "project_spend_limit_exceeded"]) {
      await assert.rejects(extractSearch(messages, catalog, today, fakeResponse({
        error: { code, type: "insufficient_quota", message: "sensitive upstream" },
      }, 429)), (e: any) => e.statusCode === 503 && e.message.includes("hết hạn mức") && !e.message.includes("sensitive"));
    }
    for (const status of [401, 403]) {
      await assert.rejects(extractSearch(messages, catalog, today, fakeResponse({
        error: { message: "sensitive key" },
      }, status)), (e: any) => e.statusCode === 503 && e.message.includes("chưa được cấp quyền") && !e.message.includes("sensitive"));
    }
    await assert.rejects(extractSearch(messages, catalog, today, (async () => new Response("unavailable", { status: 503 })) as typeof fetch), { statusCode: 503 });
    for (const data of [
      { status: "incomplete", output: [] },
      { status: "completed", output: [{ type: "message", content: [{ type: "refusal" }] }] },
      { status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "broken" }] }] },
    ]) await assert.rejects(extractSearch(messages, catalog, today, fakeResponse(data)), { statusCode: 502 });
    await assert.rejects(extractSearch(messages, catalog, today, (async () => { throw new Error("network"); }) as typeof fetch), { statusCode: 504 });
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.OPENAI_MODEL; else process.env.OPENAI_MODEL = previousModel;
    if (previousProvider === undefined) delete process.env.AI_PROVIDER; else process.env.AI_PROVIDER = previousProvider;
  }
});

test("Gemini uses its own key, schema and conversation roles, and validates completion", async () => {
  const keys = ["AI_PROVIDER", "GEMINI_API_KEY", "GEMINI_MODEL"] as const;
  const previous = keys.map(key => process.env[key]);
  try {
    delete process.env.AI_PROVIDER;
    process.env.GEMINI_API_KEY = "fake-gemini-key";
    process.env.GEMINI_MODEL = "gemini-3-flash-preview";
    const messages = [
      { role: "user" as const, content: "SGN to HAN" },
      { role: "assistant" as const, content: "Ngày nào?" },
      { role: "user" as const, content: "2027-01-10" },
    ];
    const fakeFetch = (async (url: string, options: RequestInit) => {
      assert.equal(url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent");
      assert.equal((options.headers as Record<string, string>)["x-goog-api-key"], "fake-gemini-key");
      assert.equal((options.headers as Record<string, string>).Authorization, undefined);
      const body = JSON.parse(String(options.body));
      assert.deepEqual(body.contents.map((m: any) => m.role), ["user", "model", "user"]);
      assert.match(body.systemInstruction.parts[0].text, /2027-01-01/);
      assert.equal(body.generationConfig.responseMimeType, "application/json");
      assert.equal(body.generationConfig.responseJsonSchema.additionalProperties, false);
      return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ action: "search", question: "", plan }) }] } }] });
    }) as typeof fetch;
    assert.deepEqual(await extractSearch(messages, catalog, today, fakeFetch), { action: "search", question: "", plan });
    for (const result of [
      { candidates: [] },
      { candidates: [{ finishReason: "MAX_TOKENS" }] },
      { candidates: [{ finishReason: "STOP", content: { parts: [{ text: "bad json" }] } }] },
    ]) {
      await assert.rejects(extractSearch(messages, catalog, today, (async () => Response.json(result)) as typeof fetch), { statusCode: 502 });
    }
    await assert.rejects(extractSearch(messages, catalog, today, (async () => Response.json({ error: { status: "RESOURCE_EXHAUSTED" } }, { status: 429 })) as typeof fetch), { statusCode: 429 });
    let attempts = 0;
    const retryFetch = (async () => {
      if (++attempts === 1) return Response.json({ error: { status: "UNAVAILABLE" } }, { status: 503 });
      return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ action: "search", question: "", plan }) }] } }] });
    }) as typeof fetch;
    assert.deepEqual(await extractSearch(messages, catalog, today, retryFetch), { action: "search", question: "", plan });
    assert.equal(attempts, 2);
    attempts = 0;
    await assert.rejects(extractSearch(messages, catalog, today, (async () => {
      attempts++;
      return Response.json({}, { status: 503 });
    }) as typeof fetch), { statusCode: 503 });
    assert.equal(attempts, 2);
    delete process.env.GEMINI_MODEL;
    await assert.rejects(extractSearch(messages, catalog, today, fakeFetch), { statusCode: 503 });
  } finally {
    keys.forEach((key, i) => { if (previous[i] === undefined) delete process.env[key]; else process.env[key] = previous[i]; });
  }
});

test("rate limiter requires a verified user, blocks concurrent requests and enforces per-user quota", () => {
  const limit = createAssistantRateLimit();
  const invoke = (userId?: string) => {
    const res = Object.assign(new EventEmitter(), { setHeader: () => {} });
    let failure: any;
    limit({ user: userId ? { userId } : undefined } as any, res as any, e => { failure = e; });
    return { res, failure };
  };
  assert.equal(invoke().failure.statusCode, 401);
  const first = invoke("user1"); assert.equal(first.failure, undefined);
  assert.equal(invoke("user1").failure.statusCode, 429);
  const other = invoke("user2"); assert.equal(other.failure, undefined); other.res.emit("finish");
  first.res.emit("finish");
  for (let i = 1; i < 30; i++) {
    const next = invoke("user1"); assert.equal(next.failure, undefined); next.res.emit("finish");
  }
  assert.equal(invoke("user1").failure.statusCode, 429);
});
