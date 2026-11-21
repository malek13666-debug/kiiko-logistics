/* KIIKO — клієнтський скрипт. Без залежностей. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: стан при прокрутці ---------- */
  var header = document.querySelector('[data-header]');
  var hero = document.querySelector('.hero');
  if (header && !hero) header.classList.add('is-solid');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Мобільне меню ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var panel = document.querySelector('[data-nav-panel]');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    var label = toggle.querySelector('.visually-hidden');
    if (label) label.textContent = open ? toggle.dataset.labelClose : toggle.dataset.labelOpen;
    if (open) { var first = panel.querySelector('a'); if (first) first.focus(); }
  }
  if (toggle && panel) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 1121px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- Поява секцій ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Активний пункт меню ---------- */
  var navLinks = document.querySelectorAll('[data-nav]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    navLinks.forEach(function (a) { map[a.dataset.nav] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          navLinks.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
          map[en.target.id].classList.add('is-active');
          map[en.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- Мобільна CTA-панель ---------- */
  var mcta = document.querySelector('[data-mobile-cta]');
  var quote = document.getElementById('quote');
  if (mcta && hero && quote && 'IntersectionObserver' in window) {
    var heroVisible = true, quoteVisible = false;
    var upd = function () { mcta.classList.toggle('is-visible', !heroVisible && !quoteVisible); };
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; upd(); }, { threshold: 0.15 }).observe(hero);
    new IntersectionObserver(function (e) { quoteVisible = e[0].isIntersecting; upd(); }, { threshold: 0.05 }).observe(quote);
  }

  /* ---------- Карта: підсвітка напрямку ---------- */
  var mapEl = document.querySelector('[data-map]');
  if (mapEl) {
    var svg = mapEl.querySelector('svg');
    var routes = mapEl.querySelector('.routes');
    var chips = document.querySelectorAll('.country-chip');
    var pinned = null;
    var hl = function (iso) {
      routes.classList.toggle('has-hl', !!iso);
      mapEl.querySelectorAll('[data-iso]').forEach(function (el) { el.classList.toggle('is-hl', el.dataset.iso === iso); });
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.iso === iso && pinned === iso)); });
    };
    chips.forEach(function (c) {
      c.addEventListener('mouseenter', function () { hl(c.dataset.iso); });
      c.addEventListener('mouseleave', function () { hl(pinned); });
      c.addEventListener('focus', function () { hl(c.dataset.iso); });
      c.addEventListener('blur', function () { hl(pinned); });
      c.addEventListener('click', function () { pinned = pinned === c.dataset.iso ? null : c.dataset.iso; hl(pinned); });
    });
    mapEl.querySelectorAll('.node, .route').forEach(function (g) {
      g.addEventListener('mouseenter', function () { hl(g.dataset.iso); });
      g.addEventListener('mouseleave', function () { hl(pinned); });
      g.addEventListener('click', function () { pinned = pinned === g.dataset.iso ? null : g.dataset.iso; hl(pinned); });
    });
    // SMIL-анімації: зупиняємо при reduced motion та поза екраном
    if (svg && svg.pauseAnimations) {
      if (reduceMotion) svg.pauseAnimations();
      else if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { e[0].isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations(); }).observe(svg);
      }
    }
  }

  /* ---------- Рік у футері ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Команда: дані з адмінки (/api/team) ---------- */
  var teamEl = document.querySelector('[data-team]');
  if (teamEl && window.fetch) {
    var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    var I = {
      phone: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/></svg>',
      mail: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3.5 6 8.5 7 8.5-7"/></svg>',
      chat: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
      user: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.8-4 3.8-6 7.5-6s6.7 2 7.5 6"/></svg>',
    };
    var ini = function (n) { return n.trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0] || ''; }).join('').toUpperCase(); };
    fetch('/api/team', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !Array.isArray(d.members) || !d.members.length) return;
        teamEl.innerHTML = d.members.map(function (m) {
          var photo = m.photo
            ? '<img src="' + E(m.photo) + '" alt="' + E(m.name || m.role) + '" width="600" height="750" loading="lazy" decoding="async">'
            : '<span class="team-ph" aria-hidden="true">' + (m.name ? E(ini(m.name)) : I.user) + '</span>';
          var links = [];
          if (m.phone) links.push('<a href="tel:' + E(m.phone.replace(/[^\d+]/g, '')) + '">' + I.phone + '<span>' + E(m.phone) + '</span></a>');
          if (m.email) links.push('<a href="mailto:' + E(m.email) + '">' + I.mail + '<span>' + E(m.email) + '</span></a>');
          if (m.telegram) links.push('<a href="https://t.me/' + E(m.telegram.replace(/^@/, '')) + '" target="_blank" rel="noopener">' + I.chat + '<span>Telegram</span></a>');
          return '<li class="team-card is-in"><div class="team-photo">' + photo + '</div><div class="team-body"><p class="team-role">' + E(m.role) + '</p><h3 class="team-name">' + (m.name ? E(m.name) : '<span class="muted">—</span>') + '</h3>' + (links.length ? '<div class="team-links">' + links.join('') + '</div>' : '') + '</div></li>';
        }).join('');
      })
      .catch(function () { /* залишаємо статичні картки */ });
  }

  /* ---------- Форма заявки ---------- */
  var form = document.querySelector('[data-quote-form]');
  if (!form) return;
  var M = form.dataset;
  var statusEl = form.querySelector('[data-form-status]');
  var submitBtn = form.querySelector('[data-submit]');
  var submitLabel = form.querySelector('[data-submit-label]');
  var defaultLabel = submitLabel.textContent;
  var tsField = form.querySelector('[data-ts]');
  tsField.value = String(Date.now());

  var dateInput = form.querySelector('#f-date');
  var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  var todayStr = today.toISOString().slice(0, 10);
  dateInput.min = todayStr;

  // Turnstile — підвантажуємо лише коли форма поруч (економія для Performance)
  var siteKey = M.turnstile;
  var tsWidget = null;
  if (siteKey) {
    var slot = form.querySelector('[data-turnstile-slot]');
    var loadTs = function () {
      if (window.turnstile || document.getElementById('cf-ts')) return;
      window.kiikoTsReady = function () {
        tsWidget = window.turnstile.render(slot, { sitekey: siteKey, theme: 'light', language: 'uk', size: 'flexible' });
      };
      var s = document.createElement('script');
      s.id = 'cf-ts'; s.async = true; s.defer = true;
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=kiikoTsReady';
      document.head.appendChild(s);
    };
    if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { loadTs(); tio.disconnect(); } }, { rootMargin: '600px 0px' });
      tio.observe(form);
    } else loadTs();
    form.addEventListener('focusin', loadTs, { once: true });
  }

  var rules = {
    from: function (v) { return v.trim().length >= 2 || M.msgRequired; },
    to: function (v) { return v.trim().length >= 2 || M.msgRequired; },
    cargo: function (v) { return v.trim().length >= 2 || M.msgRequired; },
    weight: function (v) {
      if (!v.trim()) return M.msgRequired;
      var n = parseFloat(v.replace(',', '.'));
      return (n >= 0.1 && n <= 24) || M.msgWeight;
    },
    date: function (v) { if (!v) return M.msgRequired; return v >= todayStr || M.msgDate; },
    name: function (v) { return v.trim().length >= 2 || M.msgRequired; },
    phone: function (v) {
      if (!v.trim()) return M.msgRequired;
      var d = v.replace(/\D/g, '');
      return (/^[+\d\s()\-.]+$/.test(v.trim()) && d.length >= 9 && d.length <= 15) || M.msgPhone;
    },
    email: function (v) { return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || M.msgEmail; },
    consent: function (_, el) { return el.checked || M.msgConsent; },
  };

  function setError(el, msg) {
    var field = el.closest('.field');
    var errEl = form.querySelector('[data-error-for="' + el.id + '"]');
    if (msg) {
      field.classList.add('has-error');
      el.setAttribute('aria-invalid', 'true');
      if (errEl) { errEl.textContent = msg; errEl.hidden = false; }
    } else {
      field.classList.remove('has-error');
      el.removeAttribute('aria-invalid');
      if (errEl) { errEl.textContent = ''; errEl.hidden = true; }
    }
  }
  function validateField(el) {
    var rule = rules[el.name];
    if (!rule) return true;
    var r = rule(el.value || '', el);
    setError(el, r === true ? '' : r);
    return r === true;
  }
  Object.keys(rules).forEach(function (name) {
    var el = form.elements[name];
    if (!el) return;
    el.addEventListener('blur', function () { if (el.value || el.type === 'checkbox') validateField(el); });
    el.addEventListener('input', function () { if (el.closest('.field').classList.contains('has-error')) validateField(el); });
    el.addEventListener('change', function () { if (el.type === 'checkbox') validateField(el); });
  });

  function showStatus(type, html) {
    statusEl.className = 'form-status ' + (type === 'ok' ? 'is-ok' : 'is-error');
    var ic = type === 'ok'
      ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
      : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16.2v.1"/></svg>';
    statusEl.innerHTML = ic + '<div>' + html + '</div>';
    statusEl.hidden = false;
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.setAttribute('aria-busy', String(busy));
    submitLabel.textContent = busy ? M.msgSending : defaultLabel;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.hidden = true;
    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      if (el && !validateField(el) && !firstInvalid) firstInvalid = el;
    });
    if (firstInvalid) {
      showStatus('error', escapeHtml(M.msgInvalid) + '.');
      firstInvalid.focus();
      return;
    }
    var fd = new FormData(form);
    var payload = {};
    fd.forEach(function (v, k) { payload[k] = typeof v === 'string' ? v : ''; });
    payload.consent = form.elements.consent.checked;
    if (siteKey) {
      var token = window.turnstile && tsWidget !== null ? window.turnstile.getResponse(tsWidget) : '';
      if (!token) { showStatus('error', escapeHtml(M.msgCaptcha) + '.'); return; }
      payload.turnstileToken = token;
    }

    setBusy(true);
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 20000) : null;
    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined,
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, status: res.status, data: data }; });
      })
      .then(function (r) {
        // Успіх показуємо ЛИШЕ коли сервер підтвердив доставку заявки
        if (r.ok && r.data && r.data.ok === true) {
          form.reset();
          tsField.value = String(Date.now());
          form.querySelectorAll('.field').forEach(function (f) { f.classList.remove('has-error'); });
          showStatus('ok', escapeHtml(M.msgSuccess));
          statusEl.focus();
        } else {
          if (r.data && r.data.fields) {
            Object.keys(r.data.fields).forEach(function (n) { var el = form.elements[n]; if (el) setError(el, r.data.fields[n]); });
          }
          var msg = (r.data && r.data.error) ? r.data.error : M.msgGeneric;
          showStatus('error', escapeHtml(msg) + '.');
        }
      })
      .catch(function () { showStatus('error', escapeHtml(M.msgNetwork) + '.'); })
      .finally(function () {
        if (timer) clearTimeout(timer);
        setBusy(false);
        if (siteKey && window.turnstile && tsWidget !== null) window.turnstile.reset(tsWidget);
      });
  });
})();
