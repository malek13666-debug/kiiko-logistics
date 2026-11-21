#!/usr/bin/env node
/**
 * Збірка сайту KIIKO без залежностей (лише Node.js ≥ 18).
 *   node scripts/build.mjs   → результат у dist/
 * Cloudflare Pages: Build command `npm run build`, Output directory `dist`.
 */
import { mkdirSync, rmSync, writeFileSync, readFileSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const { default: cfg } = await import(join(root, 'site.config.mjs'));
const { indexPage, privacyPage, notFoundPage } = await import(join(root, 'src/templates/pages.mjs'));

// Дозволяємо перевизначити адресу сайту змінною середовища (напр. для preview)
if (process.env.SITE_URL) cfg.siteUrl = process.env.SITE_URL.replace(/\/$/, '');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// 1. Статичні файли
cpSync(join(root, 'src/assets'), join(dist, 'assets'), { recursive: true });
cpSync(join(root, 'public'), dist, { recursive: true });
for (const f of ['favicon.svg']) cpSync(join(root, 'src/assets', f), join(dist, f));

// Адмінка (статичні файли; доступ захищено паролем на рівні API)
cpSync(join(root, 'src/admin'), join(dist, 'admin'), { recursive: true });

// 2. Хеш для скидання кешу CSS/JS
const hash = createHash('sha1')
  .update(readFileSync(join(root, 'src/assets/css/main.css')))
  .update(readFileSync(join(root, 'src/assets/js/main.js')))
  .update(readFileSync(join(root, 'src/admin/admin.js')))
  .update(readFileSync(join(root, 'src/admin/admin.css')))
  .digest('hex').slice(0, 10);

const write = (rel, html) => {
  const out = join(dist, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html.replaceAll('__BUILD__', hash));
};

// 3. Сторінки для кожної мови
const warnings = [];
const urls = [];
for (const locale of cfg.locales) {
  const { default: t } = await import(join(root, `src/content/${locale}.mjs`));
  const prefix = locale === cfg.defaultLocale ? '' : `/${locale}`;
  t.path = `${prefix}/`;
  write(`${prefix.slice(1)}${prefix ? '/' : ''}index.html`, indexPage(cfg, t));
  urls.push({ loc: `${cfg.siteUrl}${prefix}/`, priority: '1.0' });
  if (locale === cfg.defaultLocale) {
    write('privacy/index.html', privacyPage(cfg, t));
    write('404.html', notFoundPage(cfg, t));
    urls.push({ loc: `${cfg.siteUrl}/privacy/`, priority: '0.3' });
  }
}

{ const f = join(dist, 'admin/index.html'); writeFileSync(f, readFileSync(f, 'utf8').replaceAll('__BUILD__', hash)); }

// 4. sitemap.xml та robots.txt
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`);
writeFileSync(join(dist, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${cfg.siteUrl}/sitemap.xml
`);

// 5. Попередження про незаповнені дані
const c = cfg.contacts;
if (!c.phone) warnings.push('contacts.phone — телефон не вказано');
if (!c.email) warnings.push('contacts.email — email не вказано');
if (!cfg.lardiTransUrl) warnings.push('lardiTransUrl — посилання на профіль Lardi-Trans не вказано (кнопка прихована)');
if (!cfg.turnstileSiteKey) warnings.push('turnstileSiteKey — Turnstile не підключено (працює лише honeypot-захист)');
if (Object.values(cfg.images).some((i) => i.illustrative)) warnings.push('images — використовуються ілюстративні фото, замініть на фото власного автопарку');

const size = (dir) => readdirSync(dir).reduce((s, f) => { const p = join(dir, f); const st = statSync(p); return s + (st.isDirectory() ? size(p) : st.size); }, 0);
console.log(`✔ KIIKO build ${hash} → dist/ (${(size(dist) / 1024).toFixed(0)} KB), сторінок: ${urls.length + 1}`);
if (warnings.length) console.log('⚠ Потрібно заповнити в site.config.mjs:\n  - ' + warnings.join('\n  - '));
if (!existsSync(join(dist, 'assets/img/og-kiiko.png'))) console.log('⚠ Немає assets/img/og-kiiko.png');
