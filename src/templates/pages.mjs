import { icon } from './icons.mjs';
import { renderMap, DESTINATIONS } from './map.mjs';
import { DEFAULT_REVIEWS } from '../../lib/reviews.js';

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const telHref = (p) => 'tel:' + String(p).replace(/[^\d+]/g, '');

/* ---------- Зображення ---------- */
const WIDTHS = [640, 960, 1280, 1600, 2000];
function imgSources(img) {
  if (!img.unsplash) return { src: img.src, srcset: '' };
  const u = (w) => `${img.src}?auto=format&fit=crop&q=62&w=${w}`;
  return { src: u(1600), srcset: WIDTHS.map((w) => `${u(w)} ${w}w`).join(', ') };
}
function picture(img, { cls = '', sizes = '100vw', eager = false, width = 1600, height = 1067 } = {}) {
  const { src, srcset } = imgSources(img);
  return `<img class="${cls}" src="${esc(src)}"${srcset ? ` srcset="${esc(srcset)}" sizes="${sizes}"` : ''} alt="${esc(img.alt)}" width="${width}" height="${height}" decoding="async" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
}

/* ---------- Схема автопоїзда ---------- */
function truckDiagram(t) {
  const ribs = Array.from({ length: 9 }, (_, i) => 222 + i * 46)
    .map((x) => `<path class="td-rib" d="M${x} 46V146"/>`).join('');
  return `<svg class="truck-diagram" viewBox="0 0 680 230" role="img" aria-label="${esc(t.fleet.diagramLabel)}">
  <path class="td-ground" d="M0 199H680"/>
  <rect class="td-trailer" x="200" y="38" width="460" height="116" rx="3"/>${ribs}
  <path class="td-frame" d="M206 154h448v10H206z"/>
  <path class="td-cab" d="M38 162V76c0-22 12-38 34-40l72-4c10 0 16 6 16 16v114z"/>
  <path class="td-glass" d="M48 84c2-24 14-34 32-36l20-1v37H48z"/>
  <path class="td-line" d="M112 48v114M38 120h122"/>
  <path class="td-chassis" d="M24 162h176M150 150h56"/>
  <rect class="td-bumper" x="22" y="150" width="22" height="14" rx="2"/>
  ${[66, 168].map((x) => `<circle class="td-wheel" cx="${x}" cy="180" r="19"/><circle class="td-hub" cx="${x}" cy="180" r="6"/>`).join('')}
  ${[526, 568, 610].map((x) => `<circle class="td-wheel" cx="${x}" cy="180" r="19"/><circle class="td-hub" cx="${x}" cy="180" r="6"/>`).join('')}
  <text class="td-load" x="430" y="108" text-anchor="middle">24 т</text>
  <g class="td-callout"><path d="M100 30V12h120"/><circle cx="100" cy="30" r="3"/><text x="226" y="16">EURO 6</text></g>
  <g class="td-callout"><path d="M600 38V12H470"/><circle cx="600" cy="38" r="3"/><text x="464" y="16" text-anchor="end">Тент</text></g>
  <g class="td-callout"><path d="M300 199v22h-40"/><circle cx="300" cy="199" r="3"/><text x="254" y="225" text-anchor="end">FTL</text></g>
</svg>`;
}



/* ---------- Відгуки ---------- */
const fmtDate = (d) => (d ? d.split('-').reverse().join('.') : '');
export function reviewCard(r, t, cfg) {
  const href = cfg.lardiTransUrl ? cfg.lardiTransUrl + 'responses/?scopeType=POSITIVE' : '';
  return `<li class="review-card"><blockquote><p>${esc(r.text)}</p></blockquote><footer><p class="review-author">${esc(r.author)}${r.city ? `<span>${esc(r.city)}</span>` : ''}</p><p class="review-meta">${r.countries ? `<span class="review-route">${esc(r.countries)}</span>` : ''}${r.route ? `<span>${esc(r.route)}</span>` : ''}${r.date ? `<time datetime="${esc(r.date)}">${fmtDate(r.date)}</time>` : ''}</p>${href ? `<a class="review-src" href="${esc(href)}" target="_blank" rel="noopener">${t.reputation.source}</a>` : `<span class="review-src">${t.reputation.source}</span>`}</footer></li>`;
}

/* ---------- Команда ---------- */
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();
export function teamCard(m, t) {
  const photo = m.photo
    ? `<img src="${esc(m.photo)}" alt="${esc(m.name || m.role)}" width="600" height="600" loading="lazy" decoding="async">`
    : `<span class="team-ph" aria-hidden="true">${m.name ? esc(initials(m.name)) : icon('user')}</span>`;
  const links = [];
  if (m.phone) links.push(`<a href="${telHref(m.phone)}">${icon('phone')}<span>${esc(m.phone)}</span></a>`);
  if (m.email) links.push(`<a href="mailto:${esc(m.email)}">${icon('mail')}<span>${esc(m.email)}</span></a>`);
  if (m.telegram) links.push(`<a href="https://t.me/${esc(String(m.telegram).replace(/^@/, ''))}" target="_blank" rel="noopener">${icon('chat')}<span>Telegram</span></a>`);
  return `<li class="team-card reveal"><div class="team-photo">${photo}</div><div class="team-body"><p class="team-role">${esc(m.role)}</p><h3 class="team-name">${m.name ? esc(m.name) : '<span class="muted">—</span>'}</h3>${links.length ? `<div class="team-links">${links.join('')}</div>` : ''}</div></li>`;
}

/* ---------- Schema.org ---------- */
function schema(cfg, t) {
  const c = cfg.contacts;
  const url = cfg.siteUrl + '/';
  const org = {
    '@type': 'Organization',
    '@id': url + '#organization',
    name: cfg.company.brand,
    legalName: cfg.company.legalName,
    url,
    logo: cfg.siteUrl + '/assets/img/logo-dark.svg',
    description: t.meta.description,
    areaServed: ['UA', ...DESTINATIONS].map((code) => ({ '@type': 'Country', name: code })),
    knowsAbout: ['Міжнародні вантажні перевезення', 'FTL', 'Тентовані перевезення', 'TIR', 'CMR'],
    memberOf: { '@type': 'Organization', name: 'Асоціація міжнародних автомобільних перевізників України (АСМАП України)' },
  };
  if (c.phone) org.telephone = c.phone;
  if (c.email) org.email = c.email;
  if (c.address) org.address = { '@type': 'PostalAddress', streetAddress: c.address, addressCountry: 'UA' };
  if (cfg.lardiTransUrl) org.sameAs = [cfg.lardiTransUrl];
  if (c.phone || c.email) {
    org.contactPoint = [{ '@type': 'ContactPoint', contactType: 'sales', availableLanguage: ['uk'], ...(c.phone && { telephone: c.phone }), ...(c.email && { email: c.email }) }];
  }
  const service = {
    '@type': 'Service',
    '@id': url + '#service',
    serviceType: 'Міжнародні вантажні автоперевезення',
    name: 'Міжнародні вантажні перевезення Україна — Європа',
    provider: { '@id': url + '#organization' },
    areaServed: org.areaServed,
    description: t.fleet.text,
  };
  const website = { '@type': 'WebSite', '@id': url + '#website', url, name: 'KIIKO', inLanguage: t.htmlLang, publisher: { '@id': url + '#organization' } };
  const faq = {
    '@type': 'FAQPage',
    mainEntity: t.faq.items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, website, service, faq] }).replace(/</g, '\\u003c');
}

/* ---------- Layout ---------- */
export function layout({ cfg, t, title, description, path, body, ogType = 'website', jsonld = '', preloadHero = '', noindex = false }) {
  const canonical = cfg.siteUrl + path;
  const ogImage = cfg.siteUrl + '/assets/img/og-kiiko.png';
  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
${noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<meta name="theme-color" content="#0b1522">
<meta name="format-detection" content="telephone=no">
<link rel="alternate" hreflang="${t.htmlLang}" href="${esc(canonical)}">
<link rel="alternate" hreflang="x-default" href="${esc(canonical)}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="KIIKO">
<meta property="og:locale" content="${t.ogLocale}">
<meta property="og:title" content="${esc(t.meta.ogTitle)}">
<meta property="og:description" content="${esc(t.meta.ogDescription)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="KIIKO — міжнародні вантажні перевезення Україна ↔ Європа">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/IBMPlexSansCondensed-Bold-Cyrillic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/IBMPlexSans-Regular-Cyrillic.woff2" as="font" type="font/woff2" crossorigin>
${preloadHero}
<link rel="stylesheet" href="/assets/css/main.css?v=__BUILD__">
${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ''}
<script src="/assets/js/main.js?v=__BUILD__" defer></script>
</head>
<body>
<a class="skip-link" href="#main">${t.skip}</a>
${body}
</body>
</html>`;
}

function header(t, home = '') {
  const links = t.nav.map(([id, label]) => `<li><a href="${home}#${id}" data-nav="${id}">${label}</a></li>`).join('');
  return `<header class="site-header" data-header>
  <div class="container header-inner">
    <a class="logo" href="${home || '#top'}" aria-label="KIIKO — на головну"><picture><source media="(max-width: 520px)" srcset="/assets/img/logo-mark-white.svg"><img src="/assets/img/logo-white.svg" alt="KIIKO — Professional Transportation Company" width="138" height="44"></picture></a>
    <nav class="main-nav" id="main-nav" aria-label="Основна навігація" data-nav-panel>
      <ul>${links}</ul>
      <a class="btn btn--accent btn--sm nav-cta" href="${home}#quote">${t.navCta}</a>
    </nav>
    <a class="btn btn--accent btn--sm header-cta" href="${home}#quote">${t.navCta}</a>
    <button class="menu-toggle" type="button" aria-controls="main-nav" aria-expanded="false" data-menu-toggle data-label-open="${t.menuOpen}" data-label-close="${t.menuClose}">
      <span class="visually-hidden">${t.menuOpen}</span>${icon('menu', 'i-open')}${icon('close', 'i-close')}
    </button>
  </div>
</header>`;
}

function contactList(cfg, t, cls = '') {
  const c = cfg.contacts;
  const items = [];
  if (c.phone) items.push(`<li>${icon('phone')}<div><span class="cl-label">${t.contacts.phone}</span><a href="${telHref(c.phone)}">${esc(c.phone)}</a>${c.phone2 ? `<a href="${telHref(c.phone2)}">${esc(c.phone2)}</a>` : ''}</div></li>`);
  if (c.email) items.push(`<li>${icon('mail')}<div><span class="cl-label">${t.contacts.email}</span><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></div></li>`);
  const m = c.messengers;
  const ms = [];
  if (m.viber) ms.push(`<a href="viber://chat?number=${encodeURIComponent(m.viber.replace(/[^\d+]/g, ''))}">Viber</a>`);
  if (m.telegram) ms.push(`<a href="https://t.me/${esc(m.telegram.replace(/^@/, ''))}" target="_blank" rel="noopener">Telegram</a>`);
  if (m.whatsapp) ms.push(`<a href="https://wa.me/${esc(m.whatsapp.replace(/\D/g, ''))}" target="_blank" rel="noopener">WhatsApp</a>`);
  if (ms.length) items.push(`<li>${icon('chat')}<div><span class="cl-label">${t.contacts.messengers}</span><span class="cl-inline">${ms.join('')}</span></div></li>`);
  if (c.address) items.push(`<li>${icon('pin')}<div><span class="cl-label">${t.contacts.address}</span><span>${esc(c.address)}</span></div></li>`);
  if (c.workingHours) items.push(`<li>${icon('clock')}<div><span class="cl-label">${t.contacts.hours}</span><span>${esc(c.workingHours)}</span></div></li>`);
  return items.length ? `<ul class="contact-list ${cls}">${items.join('')}</ul>` : '';
}

function footer(cfg, t, home = '') {
  const year = new Date().getFullYear();
  const c = cfg.contacts;
  const anyIllustrative = Object.values(cfg.images).some((i) => i.illustrative);
  const credits = Object.values(cfg.images).filter((i) => i.credit).map((i) => esc(i.credit)).join(' · ');
  return `<footer class="site-footer">
  <div class="container footer-grid">
    <div class="footer-brand">
      <a class="logo logo--footer" href="${home || '#top'}" aria-label="KIIKO — на головну"><img src="/assets/img/logo-white.svg" alt="KIIKO — Professional Transportation Company" width="201" height="64" loading="lazy"></a>
      <p>${t.footer.tagline}<br><span class="muted">${esc(cfg.company.legalName)}</span></p>
    </div>
    <nav aria-label="${t.footer.nav}">
      <p class="footer-title">${t.footer.nav}</p>
      <ul class="footer-links">${t.nav.map(([id, l]) => `<li><a href="${home}#${id}">${l}</a></li>`).join('')}<li><a href="${home}#quote">${t.navCta}</a></li></ul>
    </nav>
    <div>
      <p class="footer-title">${t.footer.contacts}</p>
      <ul class="footer-links">
        ${c.phone ? `<li><a href="${telHref(c.phone)}">${esc(c.phone)}</a></li>` : ''}
        ${c.email ? `<li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>` : ''}
        ${c.address ? `<li>${esc(c.address)}</li>` : ''}
        <li><a href="${home}#quote">${t.contacts.order}</a></li>
        ${cfg.lardiTransUrl ? `<li><a href="${esc(cfg.lardiTransUrl)}" target="_blank" rel="noopener">Lardi-Trans</a></li>` : ''}
      </ul>
    </div>
  </div>
  <div class="container footer-bottom">
    <p>© <span data-year>${year}</span> ${esc(cfg.company.legalName)} (KIIKO). ${t.footer.rights}</p>
    <p><a href="/privacy/">${t.footer.privacy}</a></p>
  </div>
  ${anyIllustrative ? `<div class="container footer-credits"><p>${t.footer.photos} ${credits}. ${esc(t.geography.attribution)}. Шрифт IBM Plex (SIL OFL 1.1).</p></div>` : ''}
</footer>`;
}

/* ---------- Головна сторінка ---------- */
export function indexPage(cfg, t) {
  const h = t.hero;
  const heroImg = cfg.images.hero;
  const fleetImg = cfg.images.fleet;
  const hs = imgSources(heroImg);
  const preloadHero = `<link rel="preconnect" href="https://images.unsplash.com" crossorigin>\n<link rel="preload" as="image" href="${esc(hs.src)}"${hs.srcset ? ` imagesrcset="${esc(hs.srcset)}" imagesizes="100vw"` : ''} fetchpriority="high">`;
  const c = cfg.contacts;
  const hasDirect = Boolean(c.phone || c.email || c.messengers.viber || c.messengers.telegram || c.messengers.whatsapp);
  const q = t.quote;
  const f = q.fields;
  const opt = `<span class="opt">${q.optional}</span>`;
  const err = (id) => `<p class="field-error" id="${id}-err" data-error-for="${id}" hidden></p>`;

  const body = `${header(t)}
<main id="main">
<!-- 1. HERO -->
<section class="hero" id="top" aria-labelledby="hero-title">
  <div class="hero-media">
    ${picture(heroImg, { cls: 'hero-img', eager: true, width: 2000, height: 1333 })}
    <div class="hero-shade"></div>
  </div>
  <div class="container hero-inner">
    <p class="eyebrow eyebrow--light"><span class="dot"></span>${h.eyebrow}</p>
    <h1 id="hero-title" class="hero-title">${h.title.replace('\u00a0↔\u00a0', '<span class="visually-hidden"> ↔ </span><svg class="h1-arrow" viewBox="0 0 70 40" aria-hidden="true" focusable="false"><path d="M4 20h62M16 8 4 20l12 12M54 8l12 12-12 12"/></svg>')}</h1>
    <p class="hero-lead">${h.lead}</p>
    <div class="hero-actions">
      <a class="btn btn--accent btn--lg" href="#quote">${h.primary}${icon('arrow')}</a>
      <a class="btn btn--ghost btn--lg" href="#about">${h.secondary}</a>
    </div>
    <p class="hero-route" aria-hidden="true"><span>UA</span>${icon('swap')}<span>EU · ${DESTINATIONS.length} ${t.hero.routeLabel}</span></p>
  </div>
  <div class="hero-facts">
    <ul class="container facts">
      ${h.facts.map(([n, l]) => `<li><strong>${n}</strong><span>${l}</span></li>`).join('')}
    </ul>
  </div>
  ${heroImg.illustrative ? `<p class="photo-note">${h.illustrative}</p>` : ''}
</section>

<!-- 2. ABOUT -->
<section class="section about" id="about" aria-labelledby="about-title">
  <div class="container about-grid">
    <div class="about-head reveal">
      <p class="eyebrow">${t.about.eyebrow}</p>
      <h2 id="about-title" class="h2">${t.about.title}</h2>
      <div class="about-mark" aria-hidden="true"><span>20+</span><small>років<br>на маршрутах</small></div>
    </div>
    <div class="about-body reveal">
      <p class="lead">${t.about.lead}</p>
      ${t.about.paragraphs.map((p) => `<p>${p}</p>`).join('')}
      <dl class="about-points">
        ${t.about.points.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
      </dl>
    </div>
  </div>
</section>

<!-- 3. FLEET -->
<section class="section fleet section--dark" id="fleet" aria-labelledby="fleet-title">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow eyebrow--light">${t.fleet.eyebrow}</p>
      <h2 id="fleet-title" class="h2">${t.fleet.title}</h2>
      <p class="section-text">${t.fleet.text}</p>
    </div>
    <div class="fleet-grid">
      <figure class="fleet-photo reveal">
        ${picture(fleetImg, { cls: 'fleet-img', sizes: '(min-width: 1024px) 55vw, 100vw', width: 1600, height: 1067 })}
        ${fleetImg.illustrative ? `<figcaption>${h.illustrative}</figcaption>` : ''}
      </figure>
      <dl class="spec-sheet reveal">
        ${t.fleet.specs.map(([k, v, u]) => `<div class="spec"><dt>${k}</dt><dd><strong>${v}</strong><span>${u}</span></dd></div>`).join('')}
      </dl>
    </div>
    <div class="diagram-wrap reveal">${truckDiagram(t)}</div>
  </div>
</section>

<!-- 4. GEOGRAPHY -->
<section class="section geo" id="geography" aria-labelledby="geo-title">
  <div class="container geo-grid">
    <div class="geo-side reveal">
      <p class="eyebrow">${t.geography.eyebrow}</p>
      <h2 id="geo-title" class="h2">${t.geography.title}</h2>
      <p class="section-text">${t.geography.text}</p>
      <p class="geo-both">${icon('swap')}${t.geography.both}</p>
      <ul class="country-list" data-country-list>
        ${DESTINATIONS.map((iso) => `<li><button type="button" class="country-chip" data-iso="${iso}" aria-pressed="false"><span class="cc">${iso}</span>${t.geography.countries[iso]}</button></li>`).join('')}
      </ul>
    </div>
    <div class="geo-map reveal" data-map>
      ${renderMap(t)}
    </div>
  </div>
</section>

<!-- 5. DOCUMENTS -->
<section class="section docs section--paper" id="documents" aria-labelledby="docs-title">
  <div class="container">
    <div class="section-head section-head--row reveal">
      <div><p class="eyebrow">${t.documents.eyebrow}</p>
      <h2 id="docs-title" class="h2">${t.documents.title}</h2></div>
    </div>
    <ul class="doc-grid">
      ${t.documents.items.map(([ic, title, text]) => `<li class="doc-card reveal"><span class="doc-icon">${icon(ic)}</span><h3>${title}</h3><p>${text}</p></li>`).join('')}
    </ul>
  </div>
</section>

<!-- 6. REPUTATION -->
<section class="section reputation" id="reputation" aria-labelledby="rep-title">
  <div class="container">
    <div class="rep-grid">
      <div class="rep-count reveal">
        <span class="rep-num" aria-hidden="true">${cfg.lardi.positive}</span>
        <dl class="rep-stats">
          <div><dt>${t.reputation.stats[0]}</dt><dd>${cfg.lardi.positive}</dd></div>
          <div><dt>${t.reputation.stats[1]}</dt><dd>${cfg.lardi.negative}</dd></div>
          <div><dt>${t.reputation.stats[2]}</dt><dd>${cfg.lardi.claims}</dd></div>
        </dl>
        <p class="rep-meta">${t.reputation.since} ${cfg.lardi.since} · ${t.reputation.asOf} ${esc(cfg.lardi.asOf)}</p>
      </div>
      <div class="rep-body reveal">
        <p class="eyebrow">${t.reputation.eyebrow}</p>
        <h2 id="rep-title" class="h2">${t.reputation.title}</h2>
        <p class="section-text">${t.reputation.text}</p>
        ${cfg.lardiTransUrl ? `<a class="btn btn--dark" href="${esc(cfg.lardiTransUrl)}responses/?scopeType=POSITIVE" target="_blank" rel="noopener">${t.reputation.button}${icon('external')}</a>` : ''}
      </div>
    </div>
    <ul class="review-grid" data-reviews data-source="${esc(t.reputation.source)}" data-href="${esc(cfg.lardiTransUrl ? cfg.lardiTransUrl + 'responses/?scopeType=POSITIVE' : '')}">
      ${DEFAULT_REVIEWS.map((r) => reviewCard(r, t, cfg)).join('')}
    </ul>
    <p class="review-more"><button class="btn btn--ghost-dark" type="button" data-reviews-more hidden>${t.reputation.more}</button></p>
  </div>
</section>

<!-- 7. ADVANTAGES -->
<section class="section adv section--dark" id="advantages" aria-labelledby="adv-title">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow eyebrow--light">${t.advantages.eyebrow}</p>
      <h2 id="adv-title" class="h2">${t.advantages.title}</h2>
    </div>
    <ol class="adv-grid">
      ${t.advantages.items.map(([title, text], i) => `<li class="adv-card reveal"><span class="adv-num">${String(i + 1).padStart(2, '0')}</span><h3>${title}</h3><p>${text}</p></li>`).join('')}
    </ol>
  </div>
</section>

<!-- 7b. TEAM -->
<section class="section team" id="team" aria-labelledby="team-title">
  <div class="container">
    <div class="section-head section-head--row reveal">
      <div><p class="eyebrow">${t.team.eyebrow}</p>
      <h2 id="team-title" class="h2">${t.team.title}</h2></div>
      <p class="section-text">${t.team.text}</p>
    </div>
    <ul class="team-grid" data-team data-photo-soon="${esc(t.team.photoSoon)}">
      ${t.team.defaults.map((m) => teamCard(m, t)).join('')}
    </ul>
  </div>
</section>

<!-- 8. QUOTE FORM -->
<section class="section quote" id="quote" aria-labelledby="quote-title">
  <div class="container quote-grid">
    <div class="quote-side reveal">
      <p class="eyebrow">${q.eyebrow}</p>
      <h2 id="quote-title" class="h2">${q.title}</h2>
      <p class="section-text">${q.text}</p>
      <ol class="quote-steps">${q.steps.map((s, i) => `<li><span>${i + 1}</span>${s}</li>`).join('')}</ol>
      ${contactList(cfg, t, 'contact-list--compact')}
    </div>
    <form class="quote-form reveal" id="quote-form" action="/api/quote" method="post" novalidate data-quote-form
      data-msg-required="${esc(q.validation.required)}" data-msg-phone="${esc(q.validation.phone)}" data-msg-email="${esc(q.validation.email)}"
      data-msg-weight="${esc(q.validation.weight)}" data-msg-date="${esc(q.validation.date)}" data-msg-consent="${esc(q.validation.consent)}"
      data-msg-sending="${esc(q.sending)}" data-msg-success="${esc(q.success)}" data-msg-generic="${esc(q.errors.generic)}"
      data-msg-network="${esc(q.errors.network)}" data-msg-captcha="${esc(q.errors.captcha)}" data-msg-invalid="${esc(q.errors.invalid)}"
      ${cfg.turnstileSiteKey ? `data-turnstile="${esc(cfg.turnstileSiteKey)}"` : ''}>
      <fieldset class="form-group">
        <legend class="visually-hidden">Маршрут</legend>
        <div class="field"><label for="f-from">${f.from[0]} <span class="req" aria-hidden="true">*</span></label><input id="f-from" name="from" type="text" autocomplete="off" placeholder="${f.from[1]}" required maxlength="120" aria-describedby="f-from-err">${err('f-from')}</div>
        <div class="field"><label for="f-to">${f.to[0]} <span class="req" aria-hidden="true">*</span></label><input id="f-to" name="to" type="text" autocomplete="off" placeholder="${f.to[1]}" required maxlength="120" aria-describedby="f-to-err">${err('f-to')}</div>
      </fieldset>
      <fieldset class="form-group form-group--3">
        <legend class="visually-hidden">Вантаж</legend>
        <div class="field field--wide"><label for="f-cargo">${f.cargo[0]} <span class="req" aria-hidden="true">*</span></label><input id="f-cargo" name="cargo" type="text" placeholder="${f.cargo[1]}" required maxlength="160" aria-describedby="f-cargo-err">${err('f-cargo')}</div>
        <div class="field"><label for="f-weight">${f.weight[0]} <span class="req" aria-hidden="true">*</span></label><input id="f-weight" name="weight" type="number" inputmode="decimal" min="0.1" max="24" step="0.1" placeholder="${f.weight[1]}" required aria-describedby="f-weight-err">${err('f-weight')}</div>
        <div class="field"><label for="f-date">${f.date[0]} <span class="req" aria-hidden="true">*</span></label><input id="f-date" name="date" type="date" required aria-describedby="f-date-err">${err('f-date')}</div>
      </fieldset>
      <fieldset class="form-group">
        <legend class="visually-hidden">Контакти</legend>
        <div class="field"><label for="f-name">${f.name[0]} <span class="req" aria-hidden="true">*</span></label><input id="f-name" name="name" type="text" autocomplete="name" placeholder="${f.name[1]}" required maxlength="80" aria-describedby="f-name-err">${err('f-name')}</div>
        <div class="field"><label for="f-phone">${f.phone[0]} <span class="req" aria-hidden="true">*</span></label><input id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="${f.phone[1]}" required maxlength="30" aria-describedby="f-phone-err">${err('f-phone')}</div>
        <div class="field"><label for="f-email">${f.email[0]} ${opt}</label><input id="f-email" name="email" type="email" autocomplete="email" placeholder="${f.email[1]}" maxlength="120" aria-describedby="f-email-err">${err('f-email')}</div>
        <div class="field"><label for="f-company">${f.company[0]} ${opt}</label><input id="f-company" name="company" type="text" autocomplete="organization" placeholder="${f.company[1]}" maxlength="120"></div>
      </fieldset>
      <div class="field"><label for="f-message">${f.message[0]} ${opt}</label><textarea id="f-message" name="message" rows="3" placeholder="${f.message[1]}" maxlength="2000"></textarea></div>
      <div class="hp" aria-hidden="true"><label for="f-website">Website</label><input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
      <input type="hidden" name="ts" value="" data-ts>
      <div class="field field--check">
        <input id="f-consent" name="consent" type="checkbox" value="yes" required aria-describedby="f-consent-err">
        <label for="f-consent">${q.consent} <a href="/privacy/" target="_blank">${q.consentLink}</a> <span class="req" aria-hidden="true">*</span></label>
        ${err('f-consent')}
      </div>
      <div class="turnstile-slot" data-turnstile-slot></div>
      <div class="form-footer">
        <button class="btn btn--accent btn--lg btn--block" type="submit" data-submit><span data-submit-label>${q.submit}</span>${icon('arrow')}</button>
        <p class="form-note"><span class="req">*</span> ${q.required}</p>
      </div>
      <div class="form-status" role="status" aria-live="polite" tabindex="-1" data-form-status hidden></div>
    </form>
  </div>
</section>

<!-- 9. FAQ -->
<section class="section faq section--paper" id="faq" aria-labelledby="faq-title">
  <div class="container faq-grid">
    <div class="reveal">
      <p class="eyebrow">${t.faq.eyebrow}</p>
      <h2 id="faq-title" class="h2">${t.faq.title}</h2>
    </div>
    <div class="faq-list reveal">
      ${t.faq.items.map(([qq, a]) => `<details class="faq-item"><summary><h3>${qq}</h3><span class="faq-icon">${icon('plus')}</span></summary><div class="faq-answer"><p>${a}</p></div></details>`).join('')}
    </div>
  </div>
</section>

<!-- 10. CONTACTS -->
<section class="section contacts section--dark" id="contacts" aria-labelledby="contacts-title">
  <div class="container contacts-grid">
    <div class="reveal">
      <p class="eyebrow eyebrow--light">${t.contacts.eyebrow}</p>
      <h2 id="contacts-title" class="h2">${t.contacts.title}</h2>
      <p class="section-text">${t.contacts.text}</p>
      <div class="contacts-actions">
        <a class="btn btn--accent btn--lg" href="#quote">${t.contacts.order}${icon('arrow')}</a>
        ${c.phone ? `<a class="btn btn--ghost btn--lg" href="${telHref(c.phone)}">${icon('phone')}${esc(c.phone)}</a>` : ''}
      </div>
    </div>
    <div class="contacts-card reveal">
      <p class="cl-company"><span class="cl-label">${t.contacts.company}</span><strong>KIIKO</strong><span>${esc(cfg.company.legalName)}</span></p>
      ${hasDirect || c.address ? contactList(cfg, t) : `<p class="muted">${t.contacts.noDirect}</p>`}
    </div>
  </div>
</section>
</main>
${footer(cfg, t)}
<div class="mobile-cta" data-mobile-cta>
  <a class="btn btn--accent" href="#quote">${t.mobileCta}</a>
  ${c.phone ? `<a class="btn btn--icon" href="${telHref(c.phone)}" aria-label="${t.call}">${icon('phone')}</a>` : ''}
</div>`;

  return layout({
    cfg, t, title: t.meta.title, description: t.meta.description, path: t.path, body,
    jsonld: schema(cfg, t), preloadHero,
  });
}

/* ---------- Політика конфіденційності ---------- */
export function privacyPage(cfg, t) {
  const c = cfg.contacts;
  const contact = [c.email && `email <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`, c.phone && `телефон <a href="${telHref(c.phone)}">${esc(c.phone)}</a>`].filter(Boolean).join(' або ');
  const body = `${header(t, '/')}
<main id="main" class="legal">
  <div class="container legal-inner">
    <a class="back-link" href="/">← ${t.privacy.back}</a>
    <h1 class="h2">${t.privacy.title}</h1>
    <p class="muted">Редакція від ${new Date().toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <h2>1. Хто обробляє дані</h2>
    <p>Володільцем персональних даних, отриманих через цей сайт, є ${esc(cfg.company.legalName)} (торговельна марка KIIKO). Ми обробляємо дані відповідно до Закону України «Про захист персональних даних», а у випадках, коли це застосовно, — Загального регламенту ЄС про захист даних (GDPR).</p>
    <h2>2. Які дані ми отримуємо</h2>
    <p>Через форму заявки ви передаєте: ім’я, номер телефону, email і назву компанії (за бажанням), а також відомості про маршрут, вантаж, вагу та бажану дату завантаження. Технічно сервер також отримує IP-адресу та тип браузера — їх використовуємо лише для захисту від спаму та зловживань.</p>
    <h2>3. Мета обробки</h2>
    <p>Дані використовуються виключно для того, щоб опрацювати вашу заявку, зв’язатися з вами, розрахувати вартість перевезення та, за вашим бажанням, укласти договір. Ми не використовуємо їх для розсилок без окремої згоди і не продаємо третім особам.</p>
    <h2>4. Передача даних</h2>
    <p>Для доставки заявки та захисту сайту ми користуємося послугами технічних партнерів: Cloudflare (хостинг, зберігання даних сайту та перевірка Cloudflare Turnstile) та сервісу доставки електронної пошти (FormSubmit або Resend) чи месенджера, через який заявка надходить нам. Ці сервіси обробляють дані лише в обсязі, потрібному для виконання своїх функцій.</p>
    <h2>5. Строк зберігання</h2>
    <p>Ми зберігаємо дані заявки стільки, скільки це потрібно для її опрацювання та подальшої співпраці, а також протягом строків, визначених законодавством для облікових документів.</p>
    <h2>6. Ваші права</h2>
    <p>Ви можете дізнатися, які ваші дані ми маємо, вимагати їх виправлення або видалення, а також відкликати згоду на обробку. ${contact ? `Для цього зв’яжіться з нами: ${contact}.` : 'Для цього скористайтеся контактами, вказаними на головній сторінці сайту.'}</p>
    <h2>7. Файли cookie</h2>
    <p>Сайт не використовує рекламні чи аналітичні файли cookie. Сервіс Cloudflare Turnstile може використовувати технічні дані браузера для перевірки, що заявку надсилає людина.</p>
  </div>
</main>
${footer(cfg, t, '/')}`;
  return layout({ cfg, t, title: t.privacy.metaTitle, description: t.privacy.metaDescription, path: '/privacy/', body });
}

/* ---------- 404 ---------- */
export function notFoundPage(cfg, t) {
  const body = `${header(t, '/')}
<main id="main" class="legal not-found">
  <div class="container legal-inner">
    <p class="eyebrow">404</p>
    <h1 class="h2">${t.notFound.title}</h1>
    <p>${t.notFound.text}</p>
    <p><a class="btn btn--dark" href="/">${t.notFound.back}</a></p>
  </div>
</main>
${footer(cfg, t, '/')}`;
  return layout({ cfg, t, title: `${t.notFound.title} | KIIKO`, description: t.notFound.text, path: '/404', body, noindex: true });
}
