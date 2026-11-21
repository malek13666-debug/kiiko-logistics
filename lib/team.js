// Спільна логіка для команди та адмінки (використовується Pages Functions).
export const DEFAULT_TEAM = [
  { id: 'head', role: 'Керівник' },
  { id: 'senior-logist', role: 'Старший логіст' },
  { id: 'logist', role: 'Логіст' },
  { id: 'mechanic', role: 'Механік' },
];
export const MAX_PHOTO = 3 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra },
  });

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001F\u007F<>]/g, '').trim().slice(0, max);
export const validId = (id) => /^[a-z0-9-]{1,40}$/.test(String(id || ''));

export async function loadTeam(env) {
  const raw = env.TEAM_KV ? await env.TEAM_KV.get('team', 'json') : null;
  const members = raw && Array.isArray(raw.members) ? raw.members : DEFAULT_TEAM;
  return { members, updatedAt: raw?.updatedAt || null };
}

export function publicTeam(team) {
  return {
    members: team.members.map((m) => ({
      role: m.role || '',
      name: m.name || '',
      phone: m.phone || '',
      email: m.email || '',
      telegram: m.telegram || '',
      photo: m.photoVersion ? `/api/team/photo/${m.id}?v=${m.photoVersion}` : '',
    })),
  };
}

export function sanitizeMembers(list) {
  if (!Array.isArray(list) || list.length > 30) throw new Error('Некоректний список');
  const seen = new Set();
  return list.map((m) => {
    const id = clean(m.id, 40).toLowerCase();
    if (!validId(id) || seen.has(id)) throw new Error('Некоректний id');
    seen.add(id);
    const email = clean(m.email, 120);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error(`Некоректний email: ${email}`);
    const phone = clean(m.phone, 30);
    if (phone && !/^[+\d\s()\-.]+$/.test(phone)) throw new Error(`Некоректний телефон: ${phone}`);
    const role = clean(m.role, 60);
    if (!role) throw new Error('Посада обов’язкова');
    return {
      id, role, name: clean(m.name, 80), phone, email,
      telegram: clean(m.telegram, 40).replace(/^@/, '').replace(/[^\w]/g, ''),
      photoVersion: Number.isFinite(Number(m.photoVersion)) && Number(m.photoVersion) > 0 ? Number(m.photoVersion) : 0,
    };
  });
}

async function sha(s) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
}
/** Повертає Response з помилкою або null, якщо доступ дозволено. */
export async function requireAdmin(request, env) {
  if (!env.ADMIN_PASSWORD) return json({ ok: false, error: 'Адмінку не налаштовано: задайте ADMIN_PASSWORD у Cloudflare' }, 503);
  if (!env.TEAM_KV) return json({ ok: false, error: 'Сховище TEAM_KV не підключено' }, 503);
  const h = request.headers.get('Authorization') || '';
  const given = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [a, b] = await Promise.all([sha(given), sha(env.ADMIN_PASSWORD)]);
  let diff = given.length ? 0 : 1;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) {
    await new Promise((r) => setTimeout(r, 600));
    return json({ ok: false, error: 'Невірний пароль' }, 401);
  }
  return null;
}
