// Набір лінійних іконок (24×24, stroke). Без зовнішніх бібліотек.
const wrap = (body, cls = '') =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const icons = {
  arrow: (c) => wrap('<path d="M4 12h15M13 6l6 6-6 6"/>', c),
  arrowDown: (c) => wrap('<path d="M12 4v15M6 13l6 6 6-6"/>', c),
  external: (c) => wrap('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', c),
  phone: (c) => wrap('<path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/>', c),
  mail: (c) => wrap('<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3.5 6 8.5 7 8.5-7"/>', c),
  pin: (c) => wrap('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>', c),
  clock: (c) => wrap('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', c),
  chat: (c) => wrap('<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9.5h8M8 12.5h5"/>', c),
  menu: (c) => wrap('<path d="M4 7h16M4 12h16M4 17h10"/>', c),
  close: (c) => wrap('<path d="M6 6l12 12M18 6 6 18"/>', c),
  plus: (c) => wrap('<path d="M12 5v14M5 12h14"/>', c),
  check: (c) => wrap('<path d="m5 12.5 4.5 4.5L19 7.5"/>', c),
  alert: (c) => wrap('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16.2v.1"/>', c),
  swap: (c) => wrap('<path d="M4 8.5h15M15 4.5l4 4-4 4M20 15.5H5M9 11.5l-4 4 4 4"/>', c),
  // Документи
  asmap: (c) => wrap('<path d="M12 3 4 6.5v5c0 4.6 3.4 8.4 8 9.5 4.6-1.1 8-4.9 8-9.5v-5L12 3Z"/><path d="M8.5 13.5h7M9.5 10.5h5"/><circle cx="12" cy="16.5" r=".6"/>', c),
  tir: (c) => wrap('<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M6.5 10h3M8 10v4.5M11.5 10v4.5M14.5 14.5V10h2a1.4 1.4 0 0 1 0 2.8h-2M16.4 12.8l1.6 1.7"/>', c),
  ecmt: (c) => wrap('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5S9.7 5.9 12 3.5Z"/>', c),
  cmr: (c) => wrap('<path d="M12 3 4 6.5v5c0 4.6 3.4 8.4 8 9.5 4.6-1.1 8-4.9 8-9.5v-5L12 3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>', c),
  euro6: (c) => wrap('<path d="M5 19c0-8 5-13 14-14-.5 9-5.5 14-13 14H5Z"/><path d="M5 19c3-4 6-6.5 9.5-8.5"/>', c),
  vat: (c) => wrap('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="m9 14 6-6M9.5 8.5v.1M14.5 13.5v.1"/>', c),
};

export const icon = (name, cls) => (icons[name] ? icons[name](cls) : '');
