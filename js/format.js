// Money and date formatting (Indian grouping 1,25,000; Excel date serials).
import { state } from './state.js';
import { t, MONTHS, MONTHS_SHORT, WEEKDAYS } from './i18n.js';

const GU_DIGITS = '૦૧૨૩૪૫૬૭૮૯';

/** Convert 0-9 to Gujarati digits when the user picked that option in Gujarati mode. */
export function digits(s) {
  s = String(s);
  if (state.lang === 'gu' && state.digits === 'gu') return s.replace(/[0-9]/g, (c) => GU_DIGITS[c]);
  return s;
}

/** 125000 -> "1,25,000"; 1250.5 -> "1,250.50" (no digit conversion). */
export function group(n) {
  const neg = n < 0;
  const fixed = (Math.round(Math.abs(n) * 100) / 100).toFixed(2);
  let [i, d] = fixed.split('.');
  const last3 = i.slice(-3);
  let rest = i.slice(0, -3);
  if (rest) rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',';
  return (neg ? '-' : '') + rest + last3 + (d !== '00' ? '.' + d : '');
}

/** ₹ amount. sign: '+', '-' or undefined. */
export function inr(n, sign) {
  const s = (sign === '+' ? '+' : sign === '-' ? '−' : '') + '₹' + group(Math.abs(n));
  return digits(s);
}

/** ₹ amount that shows a minus sign when negative (e.g. Saved). */
export function inrNet(n) { return n < 0 ? inr(n, '-') : inr(n); }

/** Short form for chart axes: ₹40k, ₹1.2L */
export function inrShort(n) {
  const a = Math.abs(n);
  let s;
  if (a >= 1e7) s = (a / 1e7).toFixed(1).replace(/\.0$/, '') + 'Cr';
  else if (a >= 1e5) s = (a / 1e5).toFixed(1).replace(/\.0$/, '') + 'L';
  else if (a >= 1e3) s = Math.round(a / 1e3) + 'k';
  else s = String(Math.round(a));
  return digits('₹' + s);
}

// ---- Dates. Entries store Excel serial day numbers (1 = 1 Jan 1900). ----
const EPOCH = Date.UTC(1899, 11, 30);
const DAY = 86400000;

export function serialToParts(serial) {
  const d = new Date(EPOCH + Math.floor(serial) * DAY);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay() };
}
export function partsToSerial(y, m, d) {
  return Math.round((Date.UTC(y, m, d) - EPOCH) / DAY);
}
export function todaySerial() {
  const n = new Date();
  return partsToSerial(n.getFullYear(), n.getMonth(), n.getDate());
}
/** Current local date+time as an Excel serial (with fraction). */
export function nowSerial() {
  const n = new Date();
  const local = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate(), n.getHours(), n.getMinutes(), n.getSeconds());
  return Math.round(((local - EPOCH) / DAY) * 1e6) / 1e6;
}
export function serialToISO(serial) {
  const p = serialToParts(serial);
  return `${p.y}-${String(p.m + 1).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}
export function isoToSerial(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return partsToSerial(y, m - 1, d);
}

const L = () => (state.lang === 'gu' ? 'gu' : 'en');

export function monthName(m) { return MONTHS[L()][m]; }
export function monthShort(m) { return MONTHS_SHORT[L()][m]; }
/** "Nov 2026" */
export function monthYear(y, m, long) {
  return (long ? monthName(m) : monthShort(m)) + ' ' + digits(y);
}

/** "9 Nov" */
export function dayMonth(serial) {
  const p = serialToParts(serial);
  return digits(p.d) + ' ' + monthShort(p.m);
}

/** For the date card: "Today, 9 Nov" / "Yesterday, 8 Nov" / "1 Nov 2026" */
export function dateCardLabel(serial) {
  const today = todaySerial();
  if (serial === today) return t('today') + ', ' + dayMonth(serial);
  if (serial === today - 1) return t('yesterday') + ', ' + dayMonth(serial);
  const p = serialToParts(serial);
  return dayMonth(serial) + ' ' + digits(p.y);
}

/** For Entries day headers: "Today, 9 Nov" / "Sun, 8 Nov" */
export function dayHeader(serial) {
  const today = todaySerial();
  if (serial === today) return t('today') + ', ' + dayMonth(serial);
  if (serial === today - 1) return t('yesterday') + ', ' + dayMonth(serial);
  const p = serialToParts(serial);
  const yr = p.y !== serialToParts(today).y ? ' ' + digits(p.y) : '';
  return WEEKDAYS[L()][p.wd] + ', ' + dayMonth(serial) + yr;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
