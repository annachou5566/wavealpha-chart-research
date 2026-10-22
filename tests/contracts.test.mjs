import test from 'node:test';
import assert from 'node:assert/strict';
import { ActionGate } from '../src/action-gate.mjs';
import { DrawingDocument } from '../src/drawing-document.mjs';
import { SaveCoordinator } from '../src/save-coordinator.mjs';
import { viewport, segmentDistance, nearestOhlc } from '../src/geometry.mjs';
import { sma, ema, rsi } from '../src/indicators.mjs';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const doc = () => ({ schema: 1, ownerId: 'A', workspaceId: 'W', symbol: 'BTCUSD', timeframe: '1h', drawings: [] });
const line = id => ({ id, type: 'trendline', anchors: [{ time: 1, price: 100 }, { time: 2, price: 102 }] });
const ack = op => ({ ok: true, operationId: op.operationId, revision: op.expectedRevision + 1 });
const factory = send => { let i = 0; const c = new SaveCoordinator({ send, operationId: () => `op-${++i}` }); c.connect({ ownerId: 'A', revision: 0, snapshot: doc() }); return c; };

test('guest actions show login without invoking the mutation', async () => {
  let prompts = 0, writes = 0;
  const gate = new ActionGate({ readAccess: () => null, openLogin: () => { prompts++; } });
  assert.equal((await gate.run({ feature: 'drawing', contextKey: 'W', execute: () => writes++ })).status, 'login-required');
  assert.equal(prompts, 1); assert.equal(writes, 0);
});
test('concurrent guest drawing and indicator clicks share one login popup', async () => {
  const wait = deferred(); let prompts = 0;
  const gate = new ActionGate({ readAccess: () => null, openLogin: () => { prompts++; return wait.promise; } });
  const a = gate.run({ feature: 'drawing', contextKey: 'W', execute: assert.fail });
  const b = gate.run({ feature: 'indicator', contextKey: 'W', execute: assert.fail });
  await Promise.resolve(); assert.equal(prompts, 1); wait.resolve(); await Promise.all([a, b]);
});
test('login completion does not replay an obsolete chart action', async () => {
  let access = null, writes = 0;
  const gate = new ActionGate({ readAccess: () => access, openLogin: () => { access = { verified: true, userId: 'A', durableReady: true, contextKey: 'other' }; } });
  assert.equal((await gate.run({ feature: 'drawing', contextKey: 'W', execute: () => writes++ })).status, 'login-required');
  assert.equal(writes, 0);
});
test('signed in but unreconciled private storage remains blocked', async () => {
  const gate = new ActionGate({ readAccess: () => ({ verified: true, userId: 'A', contextKey: 'W', durableReady: false }), openLogin: assert.fail });
  assert.equal((await gate.run({ feature: 'indicator', contextKey: 'W', execute: assert.fail })).status, 'storage-pending');
});
test('action fence rejects an account switch during async work', async () => {
  let access = { verified: true, userId: 'A', contextKey: 'W', durableReady: true };
  const gate = new ActionGate({ readAccess: () => access, openLogin: assert.fail });
  const result = await gate.run({ feature: 'drawing', contextKey: 'W', execute: async ({ fence }) => { access = { ...access, userId: 'B' }; return fence(); } });
  assert.equal(result.value, false);
});
test('drawing edit, last-item deletion, undo and redo preserve the empty document', () => {
  const d = new DrawingDocument(doc()); d.upsert(line('L')); d.remove('L');
  assert.deepEqual(d.snapshot().drawings, []); assert.equal(d.undo(), true); assert.equal(d.snapshot().drawings[0].id, 'L');
  assert.equal(d.redo(), true); assert.deepEqual(JSON.parse(d.serialize()).drawings, []);
});
test('drawing snapshot and input references cannot mutate committed state', () => {
  const d = new DrawingDocument(doc()), input = line('L'); d.upsert(input); input.anchors[0].price = 0;
  const snapshot = d.snapshot(); snapshot.drawings[0].anchors[0].price = -1;
  assert.equal(d.snapshot().drawings[0].anchors[0].price, 100);
});
test('invalid edits fail atomically and preserve valid drawings', () => {
  const d = new DrawingDocument(doc()); d.upsert(line('L'));
  assert.throws(() => d.upsert({ ...line('L'), anchors: [{ time: NaN, price: 1 }] }));
  assert.equal(d.snapshot().drawings.length, 1); assert.equal(d.snapshot().drawings[0].anchors[0].price, 100);
});
test('owner mismatch prevents importing another account document', () => {
  assert.throws(() => DrawingDocument.parse(JSON.stringify(doc()), 'B'), /owner mismatch/);
});
test('unknown schema and duplicate drawing identifiers are rejected', () => {
  assert.throws(() => new DrawingDocument({ ...doc(), schema: 2 }));
  assert.throws(() => new DrawingDocument({ ...doc(), drawings: [line('L'), line('L')] }));
});
test('new edit after undo discards the redo branch', () => {
  const d = new DrawingDocument(doc()); d.upsert(line('A')); d.undo(); d.upsert(line('B'));
  assert.equal(d.redo(), false); assert.equal(d.snapshot().drawings[0].id, 'B');
});
test('no-op drawing deletion creates no undo history', () => {
  const d = new DrawingDocument(doc()); assert.equal(d.remove('missing'), false); assert.equal(d.undo(), false);
});
test('client stays dirty until matching revision and operation ACK', async () => {
  const wait = deferred(); let op;
  const c = factory(value => { op = value; return wait.promise; });
  c.stage({ ...doc(), drawings: [line('L')] }); const f = c.flush(); await Promise.resolve();
  assert.equal(c.state().dirty, true); assert.equal(c.state().status, 'saving'); wait.resolve(ack(op)); await f;
  assert.equal(c.state().dirty, false); assert.equal(c.state().revision, 1);
});
test('uncertain network failure reuses exactly the same operation on retry', async () => {
  const sent = []; const c = factory(async op => { sent.push(op); if (sent.length === 1) throw Error('offline'); return ack(op); });
  c.stage({ ...doc(), drawings: [line('L')] }); await c.flush(); assert.equal(c.state().status, 'retry-pending');
  await c.flush(); assert.equal(sent.length, 2); assert.deepEqual(sent[0], sent[1]); assert.equal(c.state().dirty, false);
});
test('ACK for another operation never marks local changes saved', async () => {
  const c = factory(async op => ({ ...ack(op), operationId: 'wrong' }));
  c.stage({ changed: true }); await c.flush(); assert.equal(c.state().dirty, true); assert.equal(c.state().revision, 0);
});
test('wrong ACK revision never advances local revision', async () => {
  const c = factory(async op => ({ ...ack(op), revision: 500 }));
  c.stage({ changed: true }); await c.flush(); assert.equal(c.state().status, 'retry-pending'); assert.equal(c.state().revision, 0);
});
test('concurrent flushes have a single in-flight sender', async () => {
  const wait = deferred(); let sends = 0, op;
  const c = factory(value => { sends++; op = value; return wait.promise; }); c.stage({ changed: true });
  const a = c.flush(), b = c.flush(); assert.equal(a, b); await Promise.resolve(); assert.equal(sends, 1);
  wait.resolve(ack(op)); await a;
});
test('adapter reentrancy cannot start a duplicate writer', async () => {
  let c, sends = 0, recursive;
  c = factory(async op => { sends++; recursive = c.flush(); return ack(op); }); c.stage({ changed: true });
  const f = c.flush(); await f; assert.equal(recursive, f); assert.equal(sends, 1);
});
test('edits during an in-flight save are drained with the next revision', async () => {
  const first = deferred(), ops = []; const c = factory(op => { ops.push(op); return ops.length === 1 ? first.promise : Promise.resolve(ack(op)); });
  c.stage({ n: 1 }); const f = c.flush(); await Promise.resolve(); c.stage({ n: 2 }); first.resolve(ack(ops[0])); await f;
  assert.deepEqual(ops.map(o => o.expectedRevision), [0, 1]); assert.equal(JSON.parse(ops[1].body).n, 2); assert.equal(c.state().dirty, false);
});
test('account switch makes an old asynchronous ACK inert', async () => {
  const wait = deferred(); let op; const c = factory(value => { op = value; return wait.promise; });
  c.stage({ secret: 'A-only-test-value' }); const f = c.flush(); await Promise.resolve();
  c.connect({ ownerId: 'B', revision: 8, snapshot: { publicTest: true } }); wait.resolve(ack(op)); assert.equal((await f).status, 'stale');
  assert.deepEqual(c.state(), { status: 'saved', revision: 8, dirty: false, ownerId: 'B' });
});
test('disconnect makes old errors inert', async () => {
  const wait = deferred(); const c = factory(() => wait.promise); c.stage({ n: 1 }); const f = c.flush(); await Promise.resolve();
  c.disconnect(); wait.resolve({ ok: false }); await f; assert.equal(c.state().status, 'disconnected');
});
test('revision conflict freezes retries until explicit reconcile', async () => {
  let sends = 0; const c = factory(async () => { sends++; return { status: 409 }; }); c.stage({ n: 1 }); await c.flush();
  c.stage({ n: 2 }); await c.flush(); assert.equal(sends, 1); assert.equal(c.state().status, 'conflict');
  c.connect({ ownerId: 'A', revision: 4, snapshot: { reconciled: true } }); assert.equal(c.state().status, 'saved');
});
test('save coordinator does not send unchanged or disconnected state', async () => {
  const c = factory(assert.fail); await c.flush(); c.disconnect(); await c.flush(); assert.throws(() => c.stage({}));
});
test('geometry roundtrip preserves anchors and inverted price axis', () => {
  const v = viewport({ width: 1000, height: 500, fromTime: 100, toTime: 200, minPrice: 10, maxPrice: 20 });
  const a = { time: 125, price: 18 }; assert.deepEqual(v.toAnchor(v.toScreen(a)), a); assert.deepEqual(v.toScreen({ time: 100, price: 20 }), { x: 0, y: 0 });
});
test('degenerate viewport is rejected and zero-length segments are safe', () => {
  assert.throws(() => viewport({ width: 1, height: 1, fromTime: 1, toTime: 1, minPrice: 1, maxPrice: 2 }));
  assert.equal(segmentDistance({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 }), 5);
});
test('magnet snapping uses a screen-distance threshold', () => {
  const v = viewport({ width: 100, height: 100, fromTime: 0, toTime: 10, minPrice: 0, maxPrice: 10 });
  const candles = [{ time: 5, open: 5, high: 8, low: 2, close: 6 }];
  assert.equal(nearestOhlc({ x: 51, y: 21 }, candles, v, 3).field, 'high');
  assert.equal(nearestOhlc({ x: 0, y: 0 }, candles, v, 3), null);
});
test('SMA warmup and rolling averages match explicit numeric expectations', () => {
  assert.deepEqual(sma([1, 2, 3, 4, 5], 3), [null, null, 2, 3, 4]);
});
test('EMA seeds with SMA then uses standard recursive smoothing', () => {
  assert.deepEqual(ema([1, 2, 3, 7], 3), [null, null, 2, 4.5]);
});
test('Wilder RSI has explicit warmup, flat, gain-only and loss-only behavior', () => {
  assert.deepEqual(rsi([1, 2, 3, 4], 2), [null, null, 100, 100]);
  assert.deepEqual(rsi([4, 3, 2, 1], 2), [null, null, 0, 0]);
  assert.deepEqual(rsi([2, 2, 2, 2], 2), [null, null, 50, 50]);
});
test('indicators reject missing/non-finite data instead of fabricating zero', () => {
  for (const fn of [sma, ema, rsi]) { assert.throws(() => fn([1, NaN], 2)); assert.throws(() => fn([1, 2], 0)); assert.throws(() => fn([1, null], 2)); }
});
