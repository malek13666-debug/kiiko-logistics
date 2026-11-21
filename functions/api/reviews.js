import { loadReviews } from '../../lib/reviews.js';
import { json } from '../../lib/team.js';
export async function onRequestGet({ env }) {
  return json({ reviews: await loadReviews(env) }, 200, { 'Cache-Control': 'public, max-age=60' });
}
