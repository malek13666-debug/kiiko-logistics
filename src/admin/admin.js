/* KIIKO — адмінка команди. Пароль зберігається лише у sessionStorage цієї вкладки. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var KEY = 'kiiko-admin';
  var pw = '';
  try { pw = sessionStorage.getItem(KEY) || ''; } catch (e) {}
  var members = [];
  var dirty = false;

  var loginBox = $('[data-login]'), editor = $('[data-editor]'), list = $('[data-list]'), msg = $('[data-msg]'), logout = $('[data-logout]');
  var tpl = document.getElementById('member-tpl');

  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ Authorization: 'Bearer ' + pw }, opts.headers || {});
    return fetch(path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok || d.ok === false) { var e = new Error(d.error || ('Помилка ' + r.status)); e.status = r.status; throw e; }
        return d;
      });
    });
  }
  function say(el, text, type) { el.textContent = text || ''; el.className = 'adm-msg' + (type ? ' is-' + type : ''); }
  var slug = function () { return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };

  function showEditor() {
    loginBox.hidden = true; editor.hidden = false; logout.hidden = false;
    api('/api/admin/team').then(function (d) { members = d.members.map(function (m) { return Object.assign({}, m); }); render(); })
      .catch(function (e) { say(msg, e.message, 'error'); });
  }
  function doLogout() { try { sessionStorage.removeItem(KEY); } catch (e) {} location.reload(); }

  $('[data-login-form]').addEventListener('submit', function (e) {
    e.preventDefault();
    pw = $('#pw').value;
    var lm = $('[data-login-msg]');
    say(lm, 'Перевіряємо…');
    api('/api/admin/login', { method: 'POST' }).then(function () {
      try { sessionStorage.setItem(KEY, pw); } catch (er) {}
      say(lm, ''); showEditor();
    }).catch(function (er) { say(lm, er.message, 'error'); });
  });
  logout.addEventListener('click', doLogout);

  function readForm() {
    list.querySelectorAll('.adm-card').forEach(function (card, i) {
      ['role', 'name', 'phone', 'email', 'telegram'].forEach(function (f) { members[i][f] = card.querySelector('[name=' + f + ']').value.trim(); });
    });
  }

  function render() {
    list.innerHTML = '';
    members.forEach(function (m, i) {
      var node = tpl.content.firstElementChild.cloneNode(true);
      ['role', 'name', 'phone', 'email', 'telegram'].forEach(function (f) {
        var inp = node.querySelector('[name=' + f + ']');
        inp.value = m[f] || '';
        inp.addEventListener('input', function () { dirty = true; say(msg, 'Є незбережені зміни'); });
      });
      var img = node.querySelector('img'), noph = node.querySelector('.adm-nophoto'), del = node.querySelector('[data-del-photo]');
      if (m.photoVersion) { img.src = '/api/team/photo/' + m.id + '?v=' + m.photoVersion; img.hidden = false; noph.hidden = true; del.hidden = false; }
      img.alt = m.name || m.role;
      node.querySelector('input[type=file]').addEventListener('change', function (e) { if (e.target.files[0]) upload(i, e.target.files[0], node); e.target.value = ''; });
      del.addEventListener('click', function () {
        if (!window.confirm('Видалити фото?')) return;
        node.classList.add('is-busy');
        api('/api/admin/photo/' + m.id, { method: 'DELETE' }).then(function () { m.photoVersion = 0; render(); say(msg, 'Фото видалено', 'ok'); })
          .catch(function (er) { say(msg, er.message, 'error'); }).finally(function () { node.classList.remove('is-busy'); });
      });
      node.querySelector('[data-up]').addEventListener('click', function () { if (i > 0) { readForm(); members.splice(i - 1, 0, members.splice(i, 1)[0]); dirty = true; render(); say(msg, 'Є незбережені зміни'); } });
      node.querySelector('[data-down]').addEventListener('click', function () { if (i < members.length - 1) { readForm(); members.splice(i + 1, 0, members.splice(i, 1)[0]); dirty = true; render(); say(msg, 'Є незбережені зміни'); } });
      node.querySelector('[data-remove]').addEventListener('click', function () {
        if (!window.confirm('Видалити «' + (m.name || m.role) + '»? Зміна застосується після збереження.')) return;
        readForm(); members.splice(i, 1); dirty = true; render(); say(msg, 'Є незбережені зміни — натисніть «Зберегти зміни»');
      });
      list.appendChild(node);
    });
  }

  function save() {
    readForm();
    for (var i = 0; i < members.length; i++) if (!members[i].role) { say(msg, 'Заповніть посаду для кожного співробітника', 'error'); return Promise.reject(new Error('role')); }
    say(msg, 'Зберігаємо…');
    return api('/api/admin/team', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ members: members }) })
      .then(function (d) { members = d.members; dirty = false; render(); say(msg, 'Збережено. Зміни вже на сайті (до 1 хв кешу).', 'ok'); })
      .catch(function (e) { if (e.message !== 'role') say(msg, e.message, 'error'); throw e; });
  }
  $('[data-save]').addEventListener('click', function () { save().catch(function () {}); });
  $('[data-add]').addEventListener('click', function () { readForm(); members.push({ id: slug(), role: '', name: '', photoVersion: 0 }); dirty = true; render(); list.lastElementChild.querySelector('[name=role]').focus(); });

  // Стискаємо фото в браузері: кадр 4:5, 900×1125, JPEG
  function resize(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var W = 900, H = 1125, r = W / H, sw = im.width, sh = im.height, sx = 0, sy = 0;
        if (sw / sh > r) { sx = (sw - sh * r) / 2; sw = sh * r; } else { sy = (sh - sw / r) / 2.5; sh = sw / r; }
        var c = document.createElement('canvas'); c.width = W; c.height = H;
        c.getContext('2d').drawImage(im, sx, sy, sw, sh, 0, 0, W, H);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('Не вдалося обробити фото')); }, 'image/jpeg', 0.85);
      };
      im.onerror = function () { rej(new Error('Файл не є зображенням')); };
      im.src = url;
    });
  }
  function upload(i, file, node) {
    node.classList.add('is-busy');
    say(msg, 'Завантажуємо фото…');
    // спершу зберігаємо список, щоб новий співробітник існував на сервері
    save().then(function () { return resize(file); })
      .then(function (blob) { return api('/api/admin/photo/' + members[i].id, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: blob }); })
      .then(function (d) { members[i].photoVersion = d.version; render(); say(msg, 'Фото збережено і вже на сайті.', 'ok'); })
      .catch(function (e) { if (e.message !== 'role') say(msg, e.message, 'error'); })
      .finally(function () { node.classList.remove('is-busy'); });
  }

  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  if (pw) {
    api('/api/admin/login', { method: 'POST' }).then(showEditor).catch(function () { try { sessionStorage.removeItem(KEY); } catch (e) {} pw = ''; });
  }
})();
