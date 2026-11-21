import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeMembers, publicTeam, requireAdmin, DEFAULT_TEAM } from '../lib/team.js';

test('sanitizeMembers очищає та перевіряє дані', () => {
  const [m] = sanitizeMembers([{ id: 'head', role: ' Керівник ', name: 'Іван <b>', telegram: '@ivan_k', phone: '+380 67 1', photoVersion: 5 }]);
  assert.equal(m.role, 'Керівник'); assert.equal(m.name, 'Іван b'); assert.equal(m.telegram, 'ivan_k'); assert.equal(m.photoVersion, 5);
  assert.throws(() => sanitizeMembers([{ id: 'x', role: '' }]));
  assert.throws(() => sanitizeMembers([{ id: 'x', role: 'A', email: 'bad' }]));
  assert.throws(() => sanitizeMembers([{ id: 'x', role: 'A' }, { id: 'x', role: 'B' }]));
});
test('publicTeam не видає зайвого і формує URL фото', () => {
  const p = publicTeam({ members: [{ id: 'head', role: 'Керівник', photoVersion: 7, secret: 1 }] });
  assert.equal(p.members[0].photo, '/api/team/photo/head?v=7'); assert.equal(p.members[0].secret, undefined);
  assert.equal(publicTeam({ members: DEFAULT_TEAM }).members.length, 4);
});
test('requireAdmin: пароль', async () => {
  const kv = {};
  const req = (h) => new Request('https://x/api/admin/login', { method: 'POST', headers: h ? { Authorization: 'Bearer ' + h } : {} });
  assert.equal((await requireAdmin(req('a'), { TEAM_KV: kv })).status, 503);
  assert.equal((await requireAdmin(req('wrong'), { TEAM_KV: kv, ADMIN_PASSWORD: 'secret' })).status, 401);
  assert.equal((await requireAdmin(req(''), { TEAM_KV: kv, ADMIN_PASSWORD: 'secret' })).status, 401);
  assert.equal(await requireAdmin(req('secret'), { TEAM_KV: kv, ADMIN_PASSWORD: 'secret' }), null);
});
