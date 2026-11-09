// Simple line icons (24×24, drawn with the current text colour).
const P = {
  add: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01" stroke-width="2.6"/>',
  chart: '<path d="M3 20h18M7 16V10M12 16V5M17 16v-4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M2.5 12h3M18.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
  chevDown: '<path d="M6 9l6 6 6-6"/>',
  chevLeft: '<path d="M15 6l-6 6 6 6"/>',
  chevRight: '<path d="M9 6l6 6-6 6"/>',
  out: '<path d="M7 7l10 10M17 9v8H9"/>',
  in: '<path d="M17 17L7 7M7 15V7h8"/>',
  refund: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>',
  refresh: '<path d="M20 11a8 8 0 10-2.4 5.7M20 4v7h-7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  sheet: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 9.5h16M4 14.5h16M10 4v16"/>',
  logout: '<path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 16l-4-4 4-4M6 12h10"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  // categories / sources
  GROC: '<path d="M5.5 9h13l-1.2 11H6.7L5.5 9z"/><path d="M9 9V7a3 3 0 016 0v2"/>',
  FUEL: '<path d="M4 20V5.5A1.5 1.5 0 015.5 4h6A1.5 1.5 0 0113 5.5V20M3 20h11M4 10h9"/><path d="M13 8h1.8a2 2 0 012 2v6.2a1.6 1.6 0 003.2 0V9.2L17 6"/>',
  BILLS: '<path d="M13 3L5 14h6.5l-1 7 8-11.2h-6.4L13 3z"/>',
  DINE: '<path d="M5 3v6.5a2 2 0 002 2 2 2 0 002-2V3M7 11.5V21M17 21V3c-2 1-3.2 3.8-3.2 7 0 2.4.9 3.4 3.2 3.4"/><path d="M10.5 3v5"/>',
  MED: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/>',
  SHOP: '<path d="M5.5 8h13l-1 12.5h-11L5.5 8z"/><path d="M9 8V6.5a3 3 0 016 0V8M9.5 11.5a2.5 2.5 0 005 0"/>',
  EDU: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14 2.5 9.5z"/><path d="M6.5 11.5v4.5c3 2 8 2 11 0v-4.5"/>',
  OTHER: '<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
  SALARY: '<rect x="3" y="7.5" width="18" height="12.5" rx="2"/><path d="M8.5 7.5V5.5a2 2 0 012-2h3a2 2 0 012 2v2"/>',
  RENT: '<path d="M4 11l8-7 8 7v9H4v-9z"/><path d="M10 20v-5h4v5"/>',
  BUSINESS: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  GIFT: '<rect x="3.5" y="8" width="17" height="4" rx=".5"/><path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3.5-5-3.5-5-1.2C7 8 9 8 12 8zm0 0c1.5-3.5 5-3.5 5-1.2C17 8 15 8 12 8z"/>',
  INTEREST: '<circle cx="12" cy="12" r="9"/><path d="M9 8h6M9 11h6M12.5 8c2 0 2 3 0 3H10l4.2 5"/>',
  TAG: '<path d="M3.5 12.2V4h8.2l8.8 8.8-8.2 8.2-8.8-8.8z"/><circle cx="8" cy="8.5" r="1.3"/>',
};

export function icon(name, size = 22, extra = '') {
  const body = P[name] || P.TAG;
  return `<svg class="ico ${extra}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
export const hasIcon = (name) => !!P[name];
