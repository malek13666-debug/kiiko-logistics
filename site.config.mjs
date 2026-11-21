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
    email: '',          // наприклад 'info@kiiko.com.ua'
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
      src: 'https://images.unsplash.com/photo-1590164948562-8e412aa9e62b',
      unsplash: true,
      alt: 'Вантажний автомобіль на автомагістралі серед лісу',
      credit: 'Фото: zibik / Unsplash',
      illustrative: true,
    },
    fleet: {
      src: 'https://images.unsplash.com/photo-1741495515999-0567609a236e',
      unsplash: true,
      alt: 'Сідельні тягачі, що стоять у ряд',
      credit: 'Фото: Sijmen van Hooff / Unsplash',
      illustrative: true,
    },
  },

  /** Мови. Додайте 'en' або 'pl' після створення src/content/en.mjs / pl.mjs. */
  locales: ['uk'],
  defaultLocale: 'uk',
};
