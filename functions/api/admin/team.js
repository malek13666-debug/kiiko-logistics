import { requireAdmin, loadTeam, sanitizeMembers, json } from '../../../lib/team.js';
export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  return json({ ok: true, ...(await loadTeam(env)) });
}
export async function onRequestPut({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Некоректні дані' }, 400); }
  let members;
  try { members = sanitizeMembers(body.members); } catch (e) { return json({ ok: false, error: e.message }, 422); }
  // видаляємо фото учасників, яких прибрали
  const old = await loadTeam(env);
  const keep = new Set(members.map((m) => m.id));
  await Promise.all(old.members.filter((m) => m.id && !keep.has(m.id)).map((m) => env.TEAM_KV.delete(`photo:${m.id}`)));
  const data = { members, updatedAt: new Date().toISOString() };
  await env.TEAM_KV.put('team', JSON.stringify(data));
  return json({ ok: true, ...data });
}
