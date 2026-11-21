import { loadTeam, publicTeam, json } from '../../lib/team.js';
export async function onRequestGet({ env }) {
  const team = await loadTeam(env);
  return json(publicTeam(team), 200, { 'Cache-Control': 'public, max-age=60' });
}
