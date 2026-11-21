import { requireAdmin, json } from '../../../lib/team.js';
export async function onRequestPost({ request, env }) {
  const denied = await requireAdmin(request, env);
  return denied || json({ ok: true });
}
