/**
 * KIIKO — головний файл налаштувань сайту.
 *
 * Усе, що стосується реальних даних компанії, змінюється ТУТ.
 * Порожній рядок ('') означає «дані ще не надані»: відповідний елемент
 * просто не показується на сайті (нічого не вигадується).
 *
 * Секрети (API-ключі, токени) тут НЕ зберігаються — лише у змінних
 * середовища Cloudflare (див. README.md → «Змінні середовища»).
 */
export default {
  /** Публічна адреса сайту без слеша в кінці. Змініть після підключення власного домену. */
  siteUrl: 'https://kiiko-logistics.pages.dev',

  company: {
    brand: 'KIIKO',
    legalName: 'ФОП «Кійко»',
    foundingNote: 'понад 20 років на ринку міжнародних перевезень',
  },

  /** Контакти. Заповніть реальними даними — порожні поля не відображаються. */
  contacts: {
    phone: '',          // наприклад '+380 67 000 00 00'
    phone2: '',         // додатковий номер (необов'язково)
    email: '1917090@gmail.com',
    address: '',        // наприклад 'м. Луцьк, вул. …' (необов'язково)
    workingHours: '',   // наприклад 'Пн–Пт 08:00–19:00'
    messengers: {
      viber: '',        // номер у форматі +380XXXXXXXXX
      telegram: '',     // username без @
      whatsapp: '',     // номер у форматі 380XXXXXXXXX
    },
  },

  /** Профіль компанії на Lardi-Trans (повне посилання). Поки порожній — кнопка не показується. */
  lardiTransUrl: '',
  reviewsCount: '220+',

  /** Публічний Site Key Cloudflare Turnstile. Секретний ключ — лише в env TURNSTILE_SECRET_KEY. */
  turnstileSiteKey: '',

  /**
   * Фотографії. Зараз — ілюстративні фото з Unsplash (Unsplash License).
   * Щоб поставити власні фото автопарку: покладіть файли в src/assets/img/
   * та вкажіть шлях, наприклад '/assets/img/fleet.jpg', і встановіть illustrative: false.
   */
  images: {
    hero: {
      src: 'https://images.unsplash.com/photo-1695222833131-54ee679ae8e5',
      unsplash: true,
      alt: 'Тягач із напівпричепом рухається трасою',
      credit: 'Фото: Artem Balashevsky / Unsplash',
      illustrative: true,
    },
    fleet: {
      src: 'https://images.unsplash.com/photo-1780172168745-2dac9174eb88',
      unsplash: true,
      alt: 'Сідельний тягач із напівпричепом на майданчику',
      credit: 'Фото: Dexter Studio / Unsplash',
      illustrative: true,
    },
  },

  /** Мови. Додайте 'en' або 'pl' після створення src/content/en.mjs / pl.mjs. */
  locales: ['uk'],
  defaultLocale: 'uk',
};
