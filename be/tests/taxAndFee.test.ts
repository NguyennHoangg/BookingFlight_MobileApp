import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import express from 'express';
import pg from 'pg';
import airlineRouter from '../src/routes/airline.route';
import errorHandler from '../src/middlewares/errorrHandler';
import { getTaxAndFeeService } from '../src/services/airport.service';

test('tax and fee API uses airline configuration and preserves error statuses', async (t) => {
  const row = {
    id: 'config-1', airline_id: 'airline-1', admin_fee: '50000',
    airport_fee: '100000', security_fee: '0', fuel_surcharge: null,
    vat_percent: '8', currency: 'VND',
  };
  let rows = [row];
  let databaseError = false;
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const queryMock = mock.method(pg.Pool.prototype, 'query', async (sql: string, params: unknown[]) => {
    calls.push({ sql, params });
    if (databaseError) throw new Error('database unavailable');
    return { rows } as any;
  });
  const app = express();
  app.use('/api/v1/airlines', airlineRouter);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1/airlines/airline-1/tax-and-fee`;
  try {
    await t.test('returns numeric fees, including zero, and preserves null', async () => {
      const response = await fetch(endpoint);
      assert.equal(response.status, 200);
      assert.deepEqual((await response.json()).data, {
        ...row, admin_fee: 50000, airport_fee: 100000, security_fee: 0, vat_percent: 8,
      });
      assert.match(calls[0].sql, /FROM "TaxAndFee"/);
      assert.match(calls[0].sql, /a\."isActive" = true/);
      assert.deepEqual(calls[0].params, ['airline-1']);
    });
    await t.test('rejects invalid IDs before querying and trims valid IDs', async () => {
      const count = calls.length;
      for (const id of ['', '  ', undefined, null, ['airline-1'], 12]) {
        await assert.rejects(getTaxAndFeeService(id), { statusCode: 400 });
      }
      assert.equal(calls.length, count);
      await getTaxAndFeeService(' airline-1 ');
      assert.deepEqual(calls.at(-1)?.params, ['airline-1']);
      assert.equal((await fetch(endpoint.replace('airline-1', '%20'))).status, 400);
    });
    await t.test('returns 404 for a missing configuration or inactive airline', async () => {
      rows = [];
      assert.equal((await fetch(endpoint)).status, 404);
    });
    await t.test('returns 409 for ambiguous configurations', async () => {
      rows = [row, { ...row, id: 'config-2' }];
      assert.equal((await fetch(endpoint)).status, 409);
    });
    await t.test('rejects amounts that would lose precision or are negative', async () => {
      for (const admin_fee of ['9007199254740993', '-1']) {
        rows = [{ ...row, admin_fee }];
        assert.equal((await fetch(endpoint)).status, 500);
      }
    });
    await t.test('returns a controlled 500 when database access fails', async () => {
      databaseError = true;
      const logMock = mock.method(console, 'error', () => {});
      try {
        const response = await fetch(endpoint);
        assert.equal(response.status, 500);
        assert.equal((await response.json()).message, 'Không thể lấy được thông tin thuế và phí');
      } finally {
        logMock.mock.restore();
      }
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    queryMock.mock.restore();
  }
});
