/**
 * Cloudflare Pages Function: POST /api/quote
 * Приймає заявку на розрахунок вартості, перевіряє її та доставляє
 * на email (Resend) та/або в Telegram. Успіх повертається ЛИШЕ після
 * підтвердження хоча б одним каналом доставки.
 *
 * Змінні середовища (Cloudflare → Pages → Settings → Variables and Secrets):
 *   TURNSTILE_SECRET_KEY  — секрет Cloudflare Turnstile (рекомендовано)
 *   RESEND_API_KEY        — ключ Resend (https://resend.com) для email
 *   MAIL_TO               — email(и) отримувача, через кому
 *   MAIL_FROM             — відправник, напр. "KIIKO <noreply@kiiko.com.ua>" (домен підтверджений у Resend)
 *   TELEGRAM_BOT_TOKEN    — токен бота (необов'язково)
 *   TELEGRAM_CHAT_ID      — chat id для заявок (необов'язково)
 *   ALLOWED_ORIGINS       — дозволені Origin через кому (необов'язково; за замовчуванням — той самий хост)
 */

const MAX_BODY = 16 * 1024;
const MIN_FILL_MS = 2500; // заявки, заповнені швидше, вважаємо ботами

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
const escHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function validate(body, now = Date.now()) {
  const d = {
    from: clean(body.from, 120),
    to: clean(body.to, 120),
    cargo: clean(body.cargo, 160),
    weight: clean(body.weight, 10).replace(',', '.'),
    date: clean(body.date, 10),
    name: clean(body.name, 80),
    company: clean(body.company, 120),
    phone: clean(body.phone, 30),
    email: clean(body.email, 120),
    message: clean(body.message, 2000),
  };
  const fields = {};
  for (const k of ['from', 'to', 'cargo', 'name']) if (d[k].length < 2) fields[k] = 'Заповніть це поле';
  const w = Number(d.weight);
  if (!d.weight) fields.weight = 'Заповніть це поле';
  else if (!Number.isFinite(w) || w < 0.1 || w > 20) fields.weight = 'Вкажіть вагу від 0,1 до 20 т';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || Number.isNaN(Date.parse(d.date))) fields.date = 'Вкажіть дату завантаження';
  else {
    // допускаємо різницю часових поясів: дата не раніше ніж «вчора» за UTC
    const yesterday = new Date(now - 36 * 3600 * 1000).toISOString().slice(0, 10);
    if (d.date < yesterday) fields.date = 'Дата не може бути в минулому';
  }
  const digits = d.phone.replace(/\D/g, '');
  if (!d.phone) fields.phone = 'Заповніть це поле';
  else if (!/^[+\d\s()\-.]+$/.test(d.phone) || digits.length < 9 || digits.length > 15) fields.phone = 'Вкажіть коректний номер телефону';
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) fields.email = 'Вкажіть коректний email';
  if (body.consent !== true && body.consent !== 'yes') fields.consent = 'Потрібна ваша згода';
  return { data: d, fields };
}

async function verifyTurnstile(secret, token, ip) {
  if (!token) return false;
  const fd = new FormData();
  fd.append('secret', secret);
  fd.append('response', String(token).slice(0, 2048));
  if (ip) fd.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: fd });
  if (!r.ok) return false;
  const out = await r.json();
  return out.success === true;
}

function render(d, meta) {
  const rows = [
    ['Звідки', d.from], ['Куди', d.to], ['Вантаж', d.cargo], ['Вага, т', d.weight], ['Дата завантаження', d.date],
    ['Ім’я', d.name], ['Компанія', d.company], ['Телефон', d.phone], ['Email', d.email], ['Додатково', d.message],
  ].filter(([, v]) => v);
  const text = `Нова заявка на розрахунок перевезення (сайт KIIKO)\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nНадіслано: ${meta.time}\nIP: ${meta.ip || '—'}`;
  const html = `<h2 style="font-family:Arial,sans-serif">Нова заявка на розрахунок перевезення</h2>
<table cellpadding="8" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows
    .map(([k, v]) => `<tr><td style="border-bottom:1px solid #ddd;color:#555">${escHtml(k)}</td><td style="border-bottom:1px solid #ddd"><b>${escHtml(v).replace(/\n/g, '<br>')}</b></td></tr>`)
    .join('')}</table><p style="font-family:Arial,sans-serif;color:#888;font-size:12px">Надіслано: ${escHtml(meta.time)} · IP: ${escHtml(meta.ip || '—')}</p>`;
  return { text, html, subject: `Заявка: ${d.from} → ${d.to}, ${d.weight} т` };
}

async function sendEmail(env, msg, replyTo) {
  const to = env.MAIL_TO.split(',').map((s) => s.trim()).filter(Boolean);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, to, subject: msg.subject, html: msg.html, text: msg.text, ...(replyTo && { reply_to: replyTo }) }),
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return true;
}

async function sendTelegram(env, msg) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: msg.text.slice(0, 4000), disable_web_page_preview: true }),
  });
  if (!r.ok) throw new Error(`telegram ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return true;
}

function originAllowed(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return true; // не браузерний запит — далі все одно діють перевірки
  const host = new URL(request.url).host;
  try {
    const o = new URL(origin);
    if (o.host === host) return true;
    const list = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    return list.includes(o.origin);
  } catch { return false; }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!originAllowed(request, env)) return json({ ok: false, error: 'Запит відхилено' }, 403);
    const ct = request.headers.get('Content-Type') || '';
    if (!ct.includes('application/json')) return json({ ok: false, error: 'Непідтримуваний формат запиту' }, 415);
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ ok: false, error: 'Занадто великий запит' }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return json({ ok: false, error: 'Некоректні дані форми' }, 400); }
    if (!body || typeof body !== 'object') return json({ ok: false, error: 'Некоректні дані форми' }, 400);

    // Honeypot та час заповнення: тихо відкидаємо ботів (без імітації успіху для людей)
    const ts = Number(body.ts);
    if (body.website || (Number.isFinite(ts) && ts > 0 && Date.now() - ts < MIN_FILL_MS)) {
      return json({ ok: false, error: 'Заявку не прийнято. Спробуйте ще раз' }, 400);
    }

    const { data, fields } = validate(body);
    if (Object.keys(fields).length) return json({ ok: false, error: 'Перевірте виділені поля', fields }, 422);

    const ip = request.headers.get('CF-Connecting-IP') || '';
    if (env.TURNSTILE_SECRET_KEY) {
      const ok = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, body.turnstileToken, ip);
      if (!ok) return json({ ok: false, error: 'Перевірка антиспаму не пройдена. Оновіть сторінку та спробуйте ще раз' }, 403);
    }

    const hasEmail = Boolean(env.RESEND_API_KEY && env.MAIL_TO && env.MAIL_FROM);
    const hasTg = Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
    if (!hasEmail && !hasTg) {
      console.error('quote: no delivery channel configured');
      return json({ ok: false, error: 'Прийом заявок через сайт тимчасово не налаштовано. Будь ласка, зв’яжіться з нами телефоном або email' }, 503);
    }

    const time = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });
    const msg = render(data, { ip, time });
    const jobs = [];
    if (hasEmail) jobs.push(sendEmail(env, msg, data.email || undefined));
    if (hasTg) jobs.push(sendTelegram(env, msg));
    const results = await Promise.allSettled(jobs);
    const delivered = results.some((r) => r.status === 'fulfilled');
    results.filter((r) => r.status === 'rejected').forEach((r) => console.error('quote delivery failed:', r.reason?.message));
    if (!delivered) return json({ ok: false, error: 'Не вдалося доставити заявку. Спробуйте пізніше або зв’яжіться з нами напряму' }, 502);
    return json({ ok: true });
  } catch (e) {
    console.error('quote: unexpected', e?.message);
    return json({ ok: false, error: 'Внутрішня помилка сервера. Спробуйте пізніше' }, 500);
  }
}

export function onRequest({ request }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { Allow: 'POST, OPTIONS' } });
  return json({ ok: false, error: 'Method not allowed' }, 405);
}
