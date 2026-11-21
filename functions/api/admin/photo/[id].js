import { requireAdmin, validId, loadTeam, MAX_PHOTO, PHOTO_TYPES, json } from '../../../../lib/team.js';

async function setVersion(env, id, version) {
  const team = await loadTeam(env);
  const members = team.members.map((m) => (m.id === id ? { ...m, photoVersion: version } : m));
  await env.TEAM_KV.put('team', JSON.stringify({ members, updatedAt: new Date().toISOString() }));
}
export async function onRequestPut({ request, env, params }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  if (!validId(params.id)) return json({ ok: false, error: 'Некоректний id' }, 400);
  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  if (!PHOTO_TYPES.includes(type)) return json({ ok: false, error: 'Дозволені формати: JPG, PNG, WebP' }, 415);
  const buf = await request.arrayBuffer();
  if (!buf.byteLength || buf.byteLength > MAX_PHOTO) return json({ ok: false, error: 'Фото має бути до 3 МБ' }, 413);
  await env.TEAM_KV.put(`photo:${params.id}`, buf, { metadata: { type } });
  const version = Date.now();
  await setVersion(env, params.id, version);
  return json({ ok: true, version });
}
export async function onRequestDelete({ request, env, params }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  if (!validId(params.id)) return json({ ok: false, error: 'Некоректний id' }, 400);
  await env.TEAM_KV.delete(`photo:${params.id}`);
  await setVersion(env, params.id, 0);
  return json({ ok: true });
}
