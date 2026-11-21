import { requireAdmin, json } from '../../../lib/team.js';
import { loadReviews, sanitizeReviews } from '../../../lib/reviews.js';
export async function onRequestGet({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  return json({ ok: true, reviews: await loadReviews(env) });
}
export async function onRequestPut({ request, env }) {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Некоректні дані' }, 400); }
  let reviews;
  try { reviews = sanitizeReviews(body.reviews); } catch (e) { return json({ ok: false, error: e.message }, 422); }
  await env.TEAM_KV.put('reviews', JSON.stringify({ reviews, updatedAt: new Date().toISOString() }));
  return json({ ok: true, reviews });
}
