# KIIKO — сайт міжнародного автоперевізника

Односторінковий сайт ФОП «Кійко» (KIIKO): міжнародні вантажні перевезення Україна ↔ Європа.
Статичний HTML + Cloudflare Pages Function для форми заявки. Жодних npm-залежностей — збірка працює на «чистому» Node.js ≥ 18.

## Структура

```
site.config.mjs          ← ГОЛОВНІ НАЛАШТУВАННЯ: телефон, email, Lardi-Trans, Turnstile, фото
src/content/uk.mjs       ← усі тексти українською (для EN/PL — додати en.mjs / pl.mjs)
src/templates/           ← розмітка сторінок, іконки, карта
src/assets/              ← CSS, JS, шрифти IBM Plex (self-hosted), зображення
src/data/europe-map.json ← спрощені межі країн для карти
functions/api/quote.js   ← серверна обробка форми (Cloudflare Pages Function)
public/                  ← _headers (безпека/кеш), іконки, manifest
scripts/build.mjs        ← збірка → dist/
scripts/serve.mjs        ← локальний перегляд разом із /api/quote
tests/                   ← тести серверної функції (node --test)
```

## Локальна робота

```bash
npm run build                 # зібрати dist/
node scripts/serve.mjs        # http://localhost:8788 (+ /api/quote)
npm test                      # тести функції форми
```

## Публікація на Cloudflare Pages (автодеплой з GitHub)

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Оберіть репозиторій `kiiko-logistics`, гілка `main`.
3. Налаштування збірки:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION = 22` (необов’язково)
4. **Save and Deploy**. Кожен push у `main` автоматично публікує сайт; гілки та PR отримують preview-адреси.

Папка `functions/` підхоплюється Cloudflare автоматично — `/api/quote` запрацює без додаткових налаштувань.

## Змінні середовища (форма заявки)

Cloudflare → проєкт → **Settings → Variables and Secrets** (тип *Secret* для ключів):

| Змінна | Призначення |
|---|---|
| `RESEND_API_KEY` | ключ [Resend](https://resend.com) для відправки листів |
| `MAIL_TO` | email отримувача заявок (можна кілька через кому) |
| `MAIL_FROM` | відправник, напр. `KIIKO <noreply@kiiko.com.ua>` (домен має бути підтверджений у Resend) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | (необов’язково) дублювання заявок у Telegram |
| `TURNSTILE_SECRET_KEY` | секрет Cloudflare Turnstile (антиспам) |

Достатньо одного каналу: email **або** Telegram. Поки жоден не налаштовано, форма чесно повідомляє відвідувачу, що прийом заявок тимчасово недоступний — успіх показується **лише** після підтвердження доставки сервером.

**Turnstile:** Cloudflare → Turnstile → Add widget (домен сайту) → публічний *Site Key* впишіть у `site.config.mjs → turnstileSiteKey`, *Secret Key* — у змінну `TURNSTILE_SECRET_KEY`. Додатково завжди працюють honeypot-поле та перевірка часу заповнення.

## Як оновлювати сайт

- **Контакти, посилання Lardi-Trans, Turnstile** — `site.config.mjs`. Порожні поля просто не відображаються.
- **Тексти** — `src/content/uk.mjs`.
- **Фото** — покладіть свої файли у `src/assets/img/` (JPG/WebP, ширина ~2000 px для hero, ~1600 px для автопарку), у `site.config.mjs → images` вкажіть `src: '/assets/img/назва.jpg'`, `unsplash: false`, `illustrative: false`, приберіть `credit`.
- **Власний домен** — Cloudflare Pages → Custom domains; потім змініть `siteUrl` у `site.config.mjs` (canonical, sitemap, Open Graph).

Редагувати можна прямо на github.com (олівець ✏️ → Commit changes) — Cloudflare перезбере сайт за 1–2 хвилини.

## Додавання мов (EN / PL)

1. Скопіюйте `src/content/uk.mjs` → `src/content/en.mjs`, перекладіть, змініть `lang`, `htmlLang`, `ogLocale`.
2. Додайте мову в `site.config.mjs → locales: ['uk', 'en']`. Сторінка з’явиться за адресою `/en/`.
3. Перемикач мов і `hreflang` для всіх версій — у `src/templates/pages.mjs` (функція `layout`).

## Ліцензії сторонніх матеріалів

- Шрифт IBM Plex — SIL Open Font License 1.1 (`src/assets/fonts/OFL-LICENSE.txt`).
- Межі країн на карті — World Borders Dataset, thematicmapping.org, CC BY-SA 3.0 (через github.com/leakyMirror/map-of-europe).
- Ілюстративні фото — Unsplash License (автори вказані у футері сайту). Їх слід замінити на фото власного автопарку.
