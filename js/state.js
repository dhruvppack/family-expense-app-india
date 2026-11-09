// Shared app state + small per-device preferences (kept in this browser only).

const KEY = 'feai.';

export function pref(name, fallback) {
  try {
    const v = localStorage.getItem(KEY + name);
    return v === null ? fallback : JSON.parse(v);
  } catch { return fallback; }
}
export function setPref(name, value) {
  try { localStorage.setItem(KEY + name, JSON.stringify(value)); } catch { /* private mode etc. */ }
}

export const state = {
  lang: pref('lang', 'en'),          // 'en' | 'gu'
  digits: pref('digits', 'latin'),   // 'latin' (123) | 'gu' (૧૨૩) — only used in Gujarati mode
  demo: new URLSearchParams(location.search).has('demo'),

  // Loaded from Excel
  categories: [],   // {Code, NameEN, NameGU, Kind, Colour, Active, SortOrder}
  persons: [],      // {Code, NameEN, NameGU, Active}
  modes: [],        // {Code, NameEN, NameGU, Active}
  entries: [],      // normalised entries, see store.js
  fileUrl: '',
  lastSync: null,
  account: null,
};
