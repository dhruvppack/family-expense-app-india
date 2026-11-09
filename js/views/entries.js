// Entries: month list with filters (phone = grouped by day, computer = table).
import { state } from '../state.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { inr, inrNet, esc, todaySerial, serialToParts, monthYear, monthName, dayHeader, dayMonth, digits } from '../format.js';
import * as store from '../store.js';
import { langToggle, nm } from '../ui.js';
import { monthTotals, inMonth, returnStatus } from '../calc.js';
import { entryRow, entryTitle, signedAmount, amountClass, returnedTag } from './common.js';

const now = serialToParts(todaySerial());
const F = { y: now.y, m: now.m, type: 'all', person: '', cat: '', q: '', limit: 50 };
let root = null;

export function renderEntries(el) {
  root = el;
  draw();
}

function monthOptions() {
  const set = new Set([`${now.y}-${now.m}`]);
  for (const e of store.live()) { const p = serialToParts(e.date); set.add(`${p.y}-${p.m}`); }
  return [...set].map((k) => k.split('-').map(Number)).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
}

function filtered() {
  const q = F.q.trim().toLowerCase().replace(/[₹,]/g, '');
  return store.live()
    .filter((e) => inMonth(e, F.y, F.m))
    .filter((e) => F.type === 'all' || e.type === F.type)
    .filter((e) => !F.person || e.person === F.person)
    .filter((e) => !F.cat || e.cat === F.cat)
    .filter((e) => {
      if (!q) return true;
      const c = store.findCat(e.cat), p = store.findPerson(e.person), md = store.findMode(e.mode);
      return [e.note, c?.NameEN, c?.NameGU, p?.NameEN, p?.NameGU, md?.NameEN, md?.NameGU, String(e.amount)]
        .join(' ').toLowerCase().includes(q);
    })
    .sort((a, b) => b.date - a.date || b.created - a.created);
}

function draw() {
  const months = monthOptions();
  const tot = monthTotals(F.y, F.m);
  const persons = state.persons;
  const cats = state.categories.slice().sort((a, b) => (a.Kind === b.Kind ? a.SortOrder - b.SortOrder : a.Kind === 'Expense' ? -1 : 1));
  const monthSelect = (cls) => `<label class="select-pill ${cls}">
      <span>${esc(monthYear(F.y, F.m, cls === 'desk'))}</span><span class="caret">▾</span>
      <select data-f="month" aria-label="Month">${months.map(([y, m]) => `<option value="${y}-${m}" ${y === F.y && m === F.m ? 'selected' : ''}>${esc(monthYear(y, m, true))}</option>`).join('')}</select>
    </label>`;
  const typeChips = [['all', t('all')], ['Expense', t('fExpenses')], ['Income', t('fIncome')], ['Refund', t('fRefunds')]];

  root.innerHTML = `
  <div class="page page-entries">
    <header class="phead">
      <h1>${esc(t('navEntries'))}</h1>
      <div class="phead-actions">
        <a class="btn primary only-desk" href="#/add">+ ${esc(t('navAddEntry'))}</a>
        ${state.fileUrl && !state.demo ? `<a class="btn ghost only-desk" href="${esc(state.fileUrl)}" target="_blank" rel="noopener">${esc(t('openExcel'))}</a>` : ''}
        <span class="only-phone">${langToggle()}</span>
      </div>
    </header>

    <!-- phone filters -->
    <div class="only-phone">
      <div class="row gap">
        <label class="search grow">${icon('search', 20)}<input data-q placeholder="${esc(t('search'))}" value="${esc(F.q)}" autocomplete="off"></label>
        ${monthSelect('phone')}
      </div>
      <div class="chips filter-chips">
        ${typeChips.map(([v, l]) => `<button class="chip ${F.type === v ? 'on' : ''}" data-type="${v}">${esc(l)}</button>`).join('')}
        <label class="chip select-chip ${F.person ? 'on' : ''}"><span>${esc(F.person ? nm(store.findPerson(F.person)) : t('person'))}</span><span class="caret">▾</span>
          <select data-f="person" aria-label="${esc(t('person'))}"><option value="">${esc(t('allPersons'))}</option>${persons.map((p) => `<option value="${esc(p.Code)}" ${F.person === p.Code ? 'selected' : ''}>${esc(nm(p))}</option>`).join('')}</select>
        </label>
      </div>
      <div class="sumstrip">
        <span>${esc(t('inShort'))} <b class="amt-in">${inr(tot.inc)}</b></span>
        <span>${esc(t('outShort'))} <b>${inr(tot.out)}</b></span>
        <span>${esc(t('savedShort'))} <b class="amt-saved">${inrNet(tot.saved)}</b></span>
      </div>
      <div id="elist-phone"></div>
    </div>

    <!-- computer / iPad -->
    <div class="only-desk">
      <div class="row gap filters-desk">
        <label class="search grow">${icon('search', 18)}<input data-q placeholder="${esc(t('searchDesk'))}" value="${esc(F.q)}" autocomplete="off"></label>
        ${monthSelect('desk')}
        <label class="select-pill"><span>${esc(F.type === 'all' ? t('allTypes') : t(F.type))}</span><span class="caret">▾</span>
          <select data-f="type">${[['all', t('allTypes')], ['Expense', t('Expense')], ['Income', t('Income')], ['Refund', t('Refund')]].map(([v, l]) => `<option value="${v}" ${F.type === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
        <label class="select-pill"><span>${esc(F.person ? nm(store.findPerson(F.person)) : t('allPersons'))}</span><span class="caret">▾</span>
          <select data-f="person"><option value="">${esc(t('allPersons'))}</option>${persons.map((p) => `<option value="${esc(p.Code)}" ${F.person === p.Code ? 'selected' : ''}>${esc(nm(p))}</option>`).join('')}</select></label>
        <label class="select-pill"><span>${esc(F.cat ? nm(store.findCat(F.cat)) : t('allCategories'))}</span><span class="caret">▾</span>
          <select data-f="cat"><option value="">${esc(t('allCategories'))}</option>${cats.map((c) => `<option value="${esc(c.Code)}" ${F.cat === c.Code ? 'selected' : ''}>${esc(nm(c))}</option>`).join('')}</select></label>
      </div>
      <div class="sumcards">
        <div class="card sc"><span>${esc(t('moneyIn'))}</span><b class="amt-in">${inr(tot.inc)}</b></div>
        <div class="card sc"><span>${esc(t('moneyOut'))}</span><b>${inr(tot.out)}</b></div>
        <div class="card sc"><span>${esc(t('refundsTitle'))}</span><b class="amt-ref">${inr(tot.ref)}</b></div>
        <div class="card sc"><span>${esc(t('savedShort'))}</span><b class="amt-saved">${inrNet(tot.saved)}</b></div>
      </div>
      <div class="card table-card" id="elist-desk"></div>
    </div>
  </div>`;
  drawLists();
  bind();
}

function emptyMsg() {
  const anyFilter = F.q || F.type !== 'all' || F.person || F.cat;
  return `<div class="empty-box"><p>${esc(anyFilter ? t('noMatch') : t('noEntries'))}</p>${anyFilter ? '' : `<a class="btn primary" href="#/add">${esc(t('addFirst'))}</a>`}</div>`;
}

function drawLists() {
  const list = filtered();
  const phone = root.querySelector('#elist-phone');
  const desk = root.querySelector('#elist-desk');

  // phone: grouped by day
  if (!list.length) phone.innerHTML = emptyMsg();
  else {
    const days = new Map();
    for (const e of list) { if (!days.has(e.date)) days.set(e.date, []); days.get(e.date).push(e); }
    phone.innerHTML = [...days].map(([d, es]) => {
      const out = es.filter((e) => e.type === 'Expense').reduce((s, e) => s + e.amount, 0);
      const inn = es.filter((e) => e.type !== 'Expense').reduce((s, e) => s + e.amount, 0);
      const tot = [out ? inr(out, '-') : '', inn ? inr(inn, '+') : ''].filter(Boolean).join(' · ');
      return `<div class="dayhead"><span>${esc(dayHeader(d))}</span><span>${tot}</span></div>
        <div class="card list-card">${es.map((e) => entryRow(e)).join('')}</div>`;
    }).join('');
  }

  // computer: table
  if (!list.length) { desk.innerHTML = emptyMsg(); return; }
  const shown = list.slice(0, F.limit);
  const typeBadge = (e) => `<span class="badge b-${e.type.toLowerCase()}">${esc(t(e.type))}</span>`;
  desk.innerHTML = `<table class="etable">
    <thead><tr><th>${esc(t('colDate'))}</th><th>${esc(t('colType'))}</th><th>${esc(t('colNote'))}</th><th>${esc(t('colCategory'))}</th><th>${esc(t('colPerson'))}</th><th>${esc(t('colVia'))}</th><th class="r">${esc(t('colAmount'))}</th><th></th></tr></thead>
    <tbody>${shown.map((e) => `<tr>
      <td class="muted nowrap">${esc(dayMonth(e.date))}</td>
      <td>${typeBadge(e)}</td>
      <td>${esc(entryTitle(e))}${returnedTag(e)}</td>
      <td>${esc(nm(store.findCat(e.cat)) || e.cat)}</td>
      <td>${esc(e.type === 'Income' ? t('family') : nm(store.findPerson(e.person)) || e.person)}</td>
      <td>${esc(nm(store.findMode(e.mode)) || e.mode)}</td>
      <td class="r nowrap ${amountClass(e)}${returnStatus(e) === 'full' ? ' struck' : ''}"><b>${signedAmount(e)}</b></td>
      <td class="r"><a class="btn small ghost" href="#/edit/${encodeURIComponent(e.id)}">${esc(t('edit'))}</a></td>
    </tr>`).join('')}</tbody>
  </table>
  <div class="table-foot">
    <span class="muted">${esc(t('showingOf', { a: digits(shown.length), b: digits(list.length), m: monthName(F.m) }))}</span>
    ${list.length > F.limit ? `<button class="btn small ghost" data-more>${esc(t('loadMore'))}</button>` : ''}
  </div>`;
}

function bind() {
  root.querySelectorAll('[data-q]').forEach((inp) => inp.addEventListener('input', () => {
    F.q = inp.value; F.limit = 50;
    root.querySelectorAll('[data-q]').forEach((o) => { if (o !== inp) o.value = inp.value; });
    drawLists();
  }));
  root.querySelectorAll('select[data-f]').forEach((s) => s.addEventListener('change', () => {
    const f = s.dataset.f;
    if (f === 'month') { const [y, m] = s.value.split('-').map(Number); F.y = y; F.m = m; }
    else F[f] = s.value;
    F.limit = 50;
    draw();
  }));
  root.querySelector('.page-entries').addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.type) { F.type = b.dataset.type; draw(); }
    if ('more' in b.dataset) { F.limit += 50; drawLists(); }
  });
}

