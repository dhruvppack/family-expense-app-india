// Dashboard numbers. Rules:
//  - Money out = purchases − refunds (a refund lowers its original category, person and the
//    payment mode it came back to, in the month of the refund).
//  - A period "has data" if it has at least one (not deleted) entry.
import { live } from './store.js';
import { serialToParts, partsToSerial, todaySerial } from './format.js';

export const daysIn = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

function add(map, k, v) { map.set(k, (map.get(k) || 0) + v); }

/** Totals for a set of entries. */
function aggregate(entries, y, m) {
  const r = {
    count: entries.length, inc: 0, buy: 0, ref: 0,
    byCat: new Map(), byPerson: new Map(), byMode: new Map(), incBySrc: new Map(), refunds: [],
    daily: null,
  };
  if (m !== undefined) r.daily = new Array(daysIn(y, m)).fill(0);
  for (const e of entries) {
    if (e.type === 'Income') { r.inc += e.amount; add(r.incBySrc, e.cat, e.amount); continue; }
    const sign = e.type === 'Refund' ? -1 : 1;
    if (e.type === 'Refund') { r.ref += e.amount; r.refunds.push(e); } else r.buy += e.amount;
    add(r.byCat, e.cat, sign * e.amount);
    if (e.person) add(r.byPerson, e.person, sign * e.amount);
    add(r.byMode, e.mode, sign * e.amount);
    if (r.daily) r.daily[serialToParts(e.date).d - 1] += sign * e.amount;
  }
  r.out = r.buy - r.ref;
  r.saved = r.inc - r.out;
  r.hasData = r.count > 0;
  return r;
}

export function monthAgg(y, m) {
  const a = partsToSerial(y, m, 1), b = partsToSerial(y, m, daysIn(y, m));
  return aggregate(live().filter((e) => e.date >= a && e.date <= b), y, m);
}

/** Months 0..upto of a year (upto = 11 for a whole year). */
export function rangeAgg(y, upto = 11) {
  const a = partsToSerial(y, 0, 1), b = partsToSerial(y, upto, daysIn(y, upto));
  return aggregate(live().filter((e) => e.date >= a && e.date <= b));
}

export function yearMonths(y) {
  return Array.from({ length: 12 }, (_, m) => monthAgg(y, m));
}

/** Running total of spending per day (array of length = days in month). Stops at today for the current month. */
export function runningTotal(agg, y, m) {
  const t = serialToParts(todaySerial());
  const stop = y === t.y && m === t.m ? t.d : agg.daily.length;
  let s = 0;
  return agg.daily.map((v, i) => (i < stop ? (s += v) : null));
}

/** Years that have any entries, plus the current year. */
export function dataYears() {
  const set = new Set([serialToParts(todaySerial()).y]);
  for (const e of live()) set.add(serialToParts(e.date).y);
  return [...set].sort((a, b) => a - b);
}

/**
 * Change between now and before.
 * upIsGood: true for income/savings, false for spending.
 * Returns { dir: 'up'|'down'|'flat', diff, pct (null when before is 0), good: true/false/null }
 */
export function change(now, before, upIsGood) {
  const diff = now - before;
  const dir = Math.abs(diff) < 0.5 ? 'flat' : diff > 0 ? 'up' : 'down';
  const pct = before > 0 ? (diff / before) * 100 : null;
  const good = dir === 'flat' ? null : (dir === 'up') === upIsGood;
  return { dir, diff, pct, good };
}
