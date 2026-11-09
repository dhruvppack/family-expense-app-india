// Pieces shared by the Add and Entries screens.
import { t } from '../i18n.js';
import { inr, esc, dayMonth } from '../format.js';
import { findCat, findPerson, findMode } from '../store.js';
import { nm } from '../ui.js';
import { icon } from '../icons.js';
import { returnStatus } from '../calc.js';

export function entryTitle(e) {
  if (e.note) return e.note;
  const c = nm(findCat(e.cat));
  return e.type === 'Refund' ? `${c} ${t('Refund').toLowerCase()}` : c;
}

/** "Groceries · Me · UPI" (expense) / "Salary · Bank" (income) / "Shopping · Me · to Card" (refund) */
export function entrySub(e, withDate) {
  const parts = [];
  if (withDate) parts.push(dayMonth(e.date));
  parts.push(nm(findCat(e.cat)) || e.cat);
  if (e.type !== 'Income' && e.person) parts.push(nm(findPerson(e.person)) || e.person);
  const mode = nm(findMode(e.mode)) || e.mode;
  if (mode) parts.push(e.type === 'Refund' ? `${t('to')} ${mode}` : mode);
  return parts.join(' · ');
}

export function signedAmount(e) {
  if (e.type === 'Expense') return inr(e.amount, '-');
  return inr(e.amount, '+');
}
export const amountClass = (e) => (e.type === 'Income' ? 'amt-in' : e.type === 'Refund' ? 'amt-ref' : 'amt-out');

export function typeIcon(e) {
  const cls = e.type === 'Income' ? 'ti-in' : e.type === 'Refund' ? 'ti-ref' : 'ti-out';
  const ic = e.type === 'Income' ? 'in' : e.type === 'Refund' ? 'refund' : 'out';
  return `<span class="type-ico ${cls}">${icon(ic, 18)}</span>`;
}

export function returnedTag(e) {
  const st = returnStatus(e);
  if (!st) return '';
  return `<span class="tag-ret">${esc(st === 'full' ? t('returned') : t('partReturned'))}</span>`;
}

/** One compact row (used by Recent entries and the phone Entries list). */
export function entryRow(e, { withDate = false, compact = false } = {}) {
  const st = returnStatus(e);
  return `<a class="erow${compact ? ' compact' : ''}" href="#/edit/${encodeURIComponent(e.id)}">
    ${compact ? '' : typeIcon(e)}
    <span class="erow-main">
      <span class="erow-title">${esc(entryTitle(e))}${returnedTag(e)}</span>
      <span class="erow-sub">${esc(entrySub(e, withDate))}</span>
    </span>
    <span class="erow-amt ${amountClass(e)}${st === 'full' ? ' struck' : ''}">${signedAmount(e)}</span>
  </a>`;
}
