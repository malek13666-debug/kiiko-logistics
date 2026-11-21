#!/usr/bin/env node
/**
 * Локальний перегляд без зовнішніх залежностей: статичні файли з dist/
 * та функція /api/quote (як у Cloudflare Pages).
 *   node scripts/build.mjs && node scripts/serve.mjs [port]
 * Змінні середовища для функції читаються з .dev.vars (формат KEY=value).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const port = Number(process.argv[2] || 8788);
const load = (f) => import(join(root, 'functions', f));
const routes = [
  [/^\/api\/quote$/, await load('api/quote.js')],
  [/^\/api\/team$/, await load('api/team.js')],
  [/^\/api\/team\/photo\/([^/]+)$/, await load('api/team/photo/[id].js')],
  [/^\/api\/admin\/login$/, await load('api/admin/login.js')],
  [/^\/api\/admin\/team$/, await load('api/admin/team.js')],
  [/^\/api\/admin\/photo\/([^/]+)$/, await load('api/admin/photo/[id].js')],
];
// Проста імітація Cloudflare KV у пам'яті
const mem = new Map();
const memKV = {
  async get(k, type) { const v = mem.get(k); if (!v) return null; return type === 'json' ? JSON.parse(new TextDecoder().decode(v.value)) : type === 'arrayBuffer' ? v.value : new TextDecoder().decode(v.value); },
  async getWithMetadata(k) { const v = mem.get(k); return v ? { value: v.value, metadata: v.metadata } : { value: null, metadata: null }; },
  async put(k, value, o = {}) { mem.set(k, { value: typeof value === 'string' ? new TextEncoder().encode(value).buffer : value, metadata: o.metadata || null }); },
  async delete(k) { mem.delete(k); },
};

const env = {};
const varsFile = join(root, '.dev.vars');
if (existsSync(varsFile)) {
  for (const line of readFileSync(varsFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const route = routes.find(([re]) => re.test(url.pathname));
  if (route) {
    const [re, fn] = route;
    const m = url.pathname.match(re);
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    const name = 'onRequest' + req.method[0] + req.method.slice(1).toLowerCase();
    const handler = fn[name] || fn.onRequest;
    if (!handler) { res.writeHead(405); res.end(); return; }
    const r = await handler({ request, env: { TEAM_KV: memKV, ...env }, params: { id: m[1] } });
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
    return;
  }
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(dist, p);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    res.end(await readFile(join(dist, '404.html')).catch(() => 'Not found'));
  }
}).listen(port, () => console.log(`KIIKO preview: http://localhost:${port}`));
