/* global __dirname */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const jwt = require("jsonwebtoken");

function load(relativePath, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, process, console, require: id => {
    if (id in dependencies) return dependencies[id];
    throw new Error(`Unexpected dependency: ${id}`);
  } });
  return exports;
}
const errors = load("src/errors/AppError.ts");
const validators = load("src/middlewares/validate.middleware.ts", {
  "express-validator": require("express-validator"),
  "../errors/AppError": errors,
});

async function validate(chains, body) {
  const req = { body };
  for (const chain of chains.slice(0, -1)) await chain.run(req);
  let error;
  chains.at(-1)(req, {}, failure => { error = failure; });
  return { req, error };
}

test("login accepts existing passwords without applying registration complexity rules", async () => {
  for (const password of ["legacy-password", "123456", "  keep-spaces  ", "Stronger!123"]) {
    const { req, error } = await validate(validators.validateLogin, { identifierValue: " test@example.com ", password });
    assert.equal(error, undefined);
    assert.equal(req.body.password, password);
    assert.equal(req.body.identifierValue, "test@example.com");
  }
});
test("login still rejects missing credentials and registration still requires a strong password", async () => {
  for (const body of [{ identifierValue: "test@example.com", password: "" },
    { identifierValue: "test@example.com" }, { identifierValue: "invalid", password: "123456" },
    { identifierValue: "test@example.com", password: ["123456"] }]) {
    const { error } = await validate(validators.validateLogin, body);
    assert.equal(error?.statusCode, 400);
  }
  const { error } = await validate(validators.validateRegister, {
    email: "test@example.com", password: "123456", fullName: "Nguyen Van An", phone: "0901234567",
  });
  assert.equal(error?.statusCode, 400);
});

async function authenticate(token, blacklisted = false) {
  const middleware = load("src/middlewares/auth.middleware.ts", {
    jsonwebtoken: jwt,
    "../errors/AppError": errors,
    "../redis/redisCache": { get: async () => blacklisted ? "revoked" : null },
  });
  const req = { headers: token ? { authorization: `Bearer ${token}` } : {} };
  let failure;
  let called = false;
  await middleware.authMiddleware(req, {}, error => { called = true; failure = error; });
  assert.equal(called, true);
  return { req, failure };
}

test("missing, expired, malformed and wrong-signature credentials return 401", async () => {
  const secret = process.env.ACCESS_TOKEN_SECRET || "secretKey";
  const tokens = [undefined, "invalid", jwt.sign({ userId: "owner" }, secret, { expiresIn: -1 }),
    jwt.sign({ userId: "owner" }, `${secret}-incorrect`, { expiresIn: 60 }),
    jwt.sign({ role: "USER" }, secret, { expiresIn: 60 })];
  for (const token of tokens) {
    const { failure, req } = await authenticate(token);
    assert.equal(failure?.statusCode, 401);
    assert.equal(req.user, undefined);
  }
});
test("valid JWT reaches protected routes with ownership from its claims", async () => {
  const token = jwt.sign({ userId: "owner", role: "USER" }, process.env.ACCESS_TOKEN_SECRET || "secretKey", { expiresIn: 60 });
  const { failure, req } = await authenticate(token);
  assert.equal(failure, undefined);
  assert.equal(req.user.userId, "owner");
  const revoked = await authenticate(token, true);
  assert.equal(revoked.failure?.statusCode, 401);
  assert.equal(revoked.req.user, undefined);
});
