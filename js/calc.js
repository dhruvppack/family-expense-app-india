// Totals shared by several screens.
import { live } from './store.js';
import { serialToParts } from './format.js';

export function inMonth(e, y, m) {
  const p = serialToParts(e.date);
  return p.y === y && p.m === m;
}

/** Money in / purchases / refunds / money out (= purchases − refunds) / saved for one month. */
export function monthTotals(y, m) {
  let inc = 0, buy = 0, ref = 0;
  for (const e of live()) {
    if (!inMonth(e, y, m)) continue;
    if (e.type === 'Income') inc += e.amount;
    else if (e.type === 'Expense') buy += e.amount;
    else if (e.type === 'Refund') ref += e.amount;
  }
  const out = buy - ref;
  return { inc, buy, ref, out, saved: inc - out };
}

/** Refund status of a purchase: '' | 'part' | 'full' */
export function returnStatus(purchase) {
  if (purchase.type !== 'Expense') return '';
  const r = live().filter((e) => e.type === 'Refund' && e.linked === purchase.id).reduce((s, e) => s + e.amount, 0);
  if (r <= 0) return '';
  return r >= purchase.amount - 0.001 ? 'full' : 'part';
}
