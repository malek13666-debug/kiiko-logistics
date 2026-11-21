// Тести серверної функції /api/quote: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, validate } from '../functions/api/quote.js';

const future = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10);
const good = { from: 'Україна, Луцьк', to: 'Німеччина, Мюнхен', cargo: 'Обладнання на палетах', weight: '18', date: future, name: 'Олена', phone: '+380 67 123 45 67', email: 'olena@example.com', consent: true, ts: String(Date.now() - 60000), website: '' };
const req = (body, headers = {}) => new Request('https://kiiko.test/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://kiiko.test', ...headers }, body: JSON.stringify(body) });
const withFetch = async (impl, fn) => { const orig = globalThis.fetch; globalThis.fetch = impl; try { return await fn(); } finally { globalThis.fetch = orig; } };
const mailEnv = { RESEND_API_KEY: 'test', MAIL_TO: 'a@b.ua', MAIL_FROM: 'KIIKO <noreply@b.ua>' };

test('validate: коректні дані', () => { assert.deepEqual(validate(good).fields, {}); });
test('validate: помилки полів', () => {
  const { fields } = validate({ ...good, weight: '25', phone: 'abc', email: 'x@', date: '2020-01-01', consent: false, cargo: '' });
  assert.ok(fields.weight && fields.phone && fields.email && fields.date && fields.consent && fields.cargo);
});
test('422 при невалідних даних', async () => {
  const r = await onRequestPost({ request: req({ ...good, phone: '' }), env: mailEnv });
  assert.equal(r.status, 422); const j = await r.json(); assert.equal(j.ok, false); assert.ok(j.fields.phone);
});
test('503 якщо канал доставки не налаштовано (без імітації успіху)', async () => {
  const r = await onRequestPost({ request: req(good), env: {} });
  assert.equal(r.status, 503); assert.equal((await r.json()).ok, false);
});
test('honeypot відхиляється', async () => {
  const r = await onRequestPost({ request: req({ ...good, website: 'spam' }), env: mailEnv });
  assert.equal(r.status, 400);
});
test('чужий Origin відхиляється', async () => {
  const r = await onRequestPost({ request: req(good, { Origin: 'https://evil.example' }), env: mailEnv });
  assert.equal(r.status, 403);
});
test('успіх лише після підтвердження Resend', async () => {
  let sent;
  const r = await withFetch(async (url, init) => { sent = { url, body: JSON.parse(init.body) }; return new Response('{"id":"1"}', { status: 200 }); },
    () => onRequestPost({ request: req(good), env: mailEnv }));
  assert.equal(r.status, 200); assert.equal((await r.json()).ok, true);
  assert.match(sent.url, /api\.resend\.com/); assert.deepEqual(sent.body.to, ['a@b.ua']); assert.equal(sent.body.reply_to, 'olena@example.com');
});
test('502 якщо Resend повернув помилку', async () => {
  const r = await withFetch(async () => new Response('bad', { status: 500 }), () => onRequestPost({ request: req(good), env: mailEnv }));
  assert.equal(r.status, 502); assert.equal((await r.json()).ok, false);
});
test('Turnstile: невдала перевірка → 403', async () => {
  const r = await withFetch(async (url) => { assert.match(String(url), /turnstile/); return new Response('{"success":false}'); },
    () => onRequestPost({ request: req({ ...good, turnstileToken: 'x' }), env: { ...mailEnv, TURNSTILE_SECRET_KEY: 's' } }));
  assert.equal(r.status, 403);
});
test('Turnstile OK + Telegram', async () => {
  const urls = [];
  const r = await withFetch(async (url) => { urls.push(String(url)); return new Response(String(url).includes('turnstile') ? '{"success":true}' : '{"ok":true}'); },
    () => onRequestPost({ request: req({ ...good, turnstileToken: 'x' }), env: { TURNSTILE_SECRET_KEY: 's', TELEGRAM_BOT_TOKEN: 't', TELEGRAM_CHAT_ID: '1' } }));
  assert.equal(r.status, 200); assert.ok(urls.some((u) => u.includes('api.telegram.org')));
});
