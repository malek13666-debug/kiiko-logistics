import { validId } from '../../../../lib/team.js';
export async function onRequestGet({ params, env }) {
  if (!env.TEAM_KV || !validId(params.id)) return new Response('Not found', { status: 404 });
  const { value, metadata } = await env.TEAM_KV.getWithMetadata(`photo:${params.id}`, 'arrayBuffer');
  if (!value) return new Response('Not found', { status: 404 });
  return new Response(value, {
    headers: { 'Content-Type': metadata?.type || 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
  });
}
