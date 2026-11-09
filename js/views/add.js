// Add / edit an entry: Expense, Income or Refund.
import { state, pref, setPref } from '../state.js';
import { t } from '../i18n.js';
import { icon, hasIcon } from '../icons.js';
import { inr, inrNet, group, esc, todaySerial, dateCardLabel, serialToISO, isoToSerial, serialToParts, monthName } from '../format.js';
import * as store from '../store.js';
import { toast, confirmDialog, nameDialog, langToggle, nm } from '../ui.js';
import { entryTitle, entrySub, entryRow } from './common.js';
import { monthTotals } from '../calc.js';

let F = null;          // the form being edited
let root = null;

const DEFAULT_MODE = { Expense: 'UPI', Income: 'BANK' };

function freshForm(type = pref('lastType', 'Expense')) {
  const modes = store.activeModes();
  const lastMode = pref('lastMode.' + type, DEFAULT_MODE[type]);
  return {
    type,
    editId: null,
    person: pref('lastPerson', store.activePersons()[0]?.Code || ''),
    amount: 0,
    cat: '',
    mode: modes.some((m) => m.Code === lastMode) ? lastMode : (modes[0]?.Code || ''),
    date: todaySerial(),
    note: '',
    // refund
    linked: '',
    full: true,
    search: '',
    showAll: false,
    err: '',
    busy: false,
  };
}

function formFromEntry(e) {
  return { ...freshForm(e.type), type: e.type, editId: e.id, person: e.person, amount: e.amount, cat: e.cat,
    mode: e.mode, date: e.date, note: e.note, linked: e.linked, full: false };
}

export function renderAdd(el, params = {}) {
  root = el;
  if (params.editId) {
    const e = state.entries.find((x) => x.id === params.editId);
    if (!e) { location.hash = '#/entries'; return; }
    F = formFromEntry(e);
    if (e.type === 'Refund') {
      const orig = state.entries.find((x) => x.id === e.linked);
      F.full = orig ? Math.abs(e.amount - (orig.amount - store.refundedFor(orig.id, e.id))) < 0.001 : false;
    }
  } else if (!F || F.editId) {
    F = freshForm();
  }
  draw();
}

// ---------------------------------------------------------------- drawing
function draw() {
  const type = F.type;
  const editing = !!F.editId;
  const phoneTitle = editing ? t('editEntry') : t(type === 'Income' ? 'addIncome' : type === 'Refund' ? 'addRefund' : 'addExpense');
  root.innerHTML = `
  <div class="page page-add">
    <header class="phead">
      <div>
        <div class="kicker only-phone">${esc(t('appName'))}</div>
        <h1><span class="only-phone">${esc(phoneTitle)}</span><span class="only-desk">${esc(editing ? t('editEntry') : t('addEntry'))}</span></h1>
      </div>
      ${langToggle()}
    </header>
    <div class="add-grid">
      <section class="card form-card t-${type.toLowerCase()}">
        ${tabs()}
        <div class="form-body">
          ${type === 'Expense' ? expenseFields() : type === 'Income' ? incomeFields() : refundFields()}
        </div>
      </section>
      ${editing ? '' : sidePanel()}
    </div>
  </div>`;
  bind();
}

function tabs() {
  const types = ['Expense', 'Income', 'Refund'];
  return `<div class="seg tabs" role="tablist">
    ${types.map((ty) => `<button role="tab" data-type="${ty}" class="${F.type === ty ? 'on' : ''} tab-${ty.toLowerCase()}" ${F.editId && F.type !== ty ? 'disabled' : ''}>${esc(t(ty))}</button>`).join('')}
  </div>`;
}

function amountBox(label, cls, prefix) {
  const val = F.amount ? group(F.amount) : '';
  return `<div class="field amount-box ${cls}">
    <label for="amt">${esc(label)}</label>
    <div class="amount-line">${prefix}<input id="amt" inputmode="decimal" autocomplete="off" placeholder="0" value="${val}" aria-label="${esc(label)}"></div>
    ${cls === 'inc' ? `<div class="hint">${esc(t('wholeFamily'))}</div>` : ''}
  </div>`;
}

function personChips() {
  const ps = store.activePersons();
  return `<div class="field f-who"><div class="flabel">${esc(t('whoSpent'))}</div>
    <div class="chips">${ps.map((p) => `<button class="chip person ${F.person === p.Code ? 'on' : ''}" data-person="${esc(p.Code)}">${esc(nm(p))}</button>`).join('')}</div></div>`;
}

function catTiles(kind) {
  const cats = store.activeCats(kind);
  const label = kind === 'Income' ? t('source') : t('category');
  return `<div class="field f-cat"><div class="flabel">${esc(label)}</div>
    <div class="tiles ${kind === 'Income' ? 'tiles-3' : 'tiles-4'}">
      ${cats.map((c) => `<button class="tile ${F.cat === c.Code ? 'on' : ''}" data-cat="${esc(c.Code)}">
          <span class="tile-ico">${icon(hasIcon(c.Code) ? c.Code : 'TAG', 22)}</span>
          <span class="dot" style="background:${esc(c.Colour || '#A8A29E')}"></span>
          <span class="tile-name">${esc(nm(c))}</span></button>`).join('')}
      <button class="tile new" data-new="${kind === 'Income' ? 'source' : 'category'}"><span class="tile-ico">${icon('plus', 22)}</span><span class="tile-name"><span class="plus-txt">+ </span>${esc(t('newItem'))}</span></button>
    </div></div>`;
}

function modeChips(label) {
  const ms = store.activeModes();
  return `<div class="field f-mode"><div class="flabel">${esc(label)}</div>
    <div class="chips">${ms.map((m) => `<button class="chip mode ${F.mode === m.Code ? 'on' : ''}" data-mode="${esc(m.Code)}">${esc(nm(m))}</button>`).join('')}
    <button class="chip new" data-new="mode">+ ${esc(t('newItem'))}</button></div></div>`;
}

function dateNote(ph) {
  return `<div class="pair f-dn">
    <label class="field box date-box">
      <span class="flabel-sm">${esc(t('date'))}</span>
      <span class="box-val" id="date-label">${esc(dateCardLabel(F.date))}</span>
      <input type="date" id="date" value="${serialToISO(F.date)}" aria-label="${esc(t('date'))}">
    </label>
    <label class="field box">
      <span class="flabel-sm">${esc(t('note'))}</span>
      <input id="note" class="box-input" maxlength="80" placeholder="${esc(ph)}" value="${esc(F.note)}">
    </label>
  </div>`;
}

function saveButtons(label, cls) {
  const editing = !!F.editId;
  return `<p class="err" id="form-err">${esc(F.err)}</p>
  <div class="actions f-save">
    <button class="btn big ${cls}" data-save="stay" ${F.busy ? 'disabled' : ''}>${esc(F.busy ? t('saving') : editing ? t('saveChanges') : label)}</button>
    ${editing
    ? `<button class="btn big outline-danger" data-delete>${esc(t('delete'))}</button>`
    : `<button class="btn big ghost only-desk" data-save="again" ${F.busy ? 'disabled' : ''}>${esc(t('saveAnother'))}</button>`}
  </div>`;
}

function expenseFields() {
  return `<div class="stack exp-stack">
    ${personChips()}
    <div class="f-amount">${amountBox(t('amount'), 'exp', '<span class="rupee">₹</span>')}</div>
    ${catTiles('Expense')}
    ${modeChips(t('spentVia'))}
    ${dateNote(t('notePhExpense'))}
    ${saveButtons(t('saveExpense'), 'btn-exp')}
  </div>`;
}

function incomeFields() {
  return `<div class="stack">
    ${amountBox(t('amountReceived'), 'inc', '<span class="plus-rupee"><span>+</span><span>₹</span></span>')}
    ${catTiles('Income')}
    ${modeChips(t('receivedIn'))}
    ${dateNote(t('notePhIncome'))}
    ${saveButtons(t('saveIncome'), 'btn-inc')}
  </div>`;
}

// ------------------------------------------------------------ refund
function candidates() {
  const q = F.search.trim().toLowerCase();
  const list = store.live()
    .filter((e) => e.type === 'Expense')
    .map((e) => ({ e, left: e.amount - store.refundedFor(e.id, F.editId) }))
    .filter((x) => x.left > 0.001 || x.e.id === F.linked)
    .sort((a, b) => b.e.date - a.e.date || b.e.created - a.e.created);
  if (!q) return list;
  return list.filter(({ e }) => {
    const c = store.findCat(e.cat), p = store.findPerson(e.person);
    const hay = [e.note, c?.NameEN, c?.NameGU, p?.NameEN, p?.NameGU, String(e.amount), group(e.amount)].join(' ').toLowerCase();
    return hay.includes(q.replace(/[₹,]/g, '')) || hay.includes(q);
  });
}

function purchaseList() {
  if (F.editId) {
    const orig = state.entries.find((x) => x.id === F.linked);
    if (!orig) return '';
    return `<div class="plist"><div class="pitem on static">${pitemInner(orig, orig.amount - store.refundedFor(orig.id, F.editId))}</div></div>`;
  }
  const all = candidates();
  const shown = F.search || F.showAll ? all : all.slice(0, 3);
  // keep the selected one visible
  if (F.linked && !shown.some((x) => x.e.id === F.linked)) {
    const sel = all.find((x) => x.e.id === F.linked);
    if (sel) shown.unshift(sel);
  }
  if (!all.length) return `<div class="plist empty">${esc(t('noPurchases'))}</div>`;
  return `<div class="plist" role="radiogroup">
    ${shown.map(({ e, left }) => `<button class="pitem ${F.linked === e.id ? 'on' : ''}" data-pick="${esc(e.id)}" role="radio" aria-checked="${F.linked === e.id}">${pitemInner(e, left)}</button>`).join('')}
    ${!F.search && !F.showAll && all.length > 3 ? `<button class="plist-more" data-older>${esc(t('showOlder'))}</button>` : ''}
  </div>`;
}

function pitemInner(e, left) {
  const partly = left < e.amount - 0.001;
  return `<span class="radio"></span>
    <span class="pitem-main"><span class="pitem-title">${esc(entryTitle(e))}</span><span class="pitem-sub">${esc(entrySub(e, true))}</span></span>
    <span class="pitem-amt">${inr(e.amount)}${partly ? `<small>${inr(left)} ${esc(t('leftToRefund'))}</small>` : ''}</span>`;
}

function refundFields() {
  const orig = state.entries.find((x) => x.id === F.linked);
  const left = orig ? orig.amount - store.refundedFor(orig.id, F.editId) : 0;
  if (orig && F.full) F.amount = left;
  const modes = store.activeModes();
  let info = '';
  if (orig && F.amount > 0) {
    const p = serialToParts(F.date);
    const cat = nm(store.findCat(orig.cat));
    const tag = F.amount >= left - 0.001 ? t('returned') : t('partReturned');
    info = state.lang === 'gu'
      ? `${esc(monthName(p.m))}ના <b>${esc(cat)}</b> ખર્ચમાં ${inr(F.amount)} ઘટશે, અને એન્ટ્રીમાં “${esc(entryTitle(orig))}” પર <b>${esc(tag)}</b> ટૅગ દેખાશે.`
      : `${esc(cat)} for ${esc(monthName(p.m))} goes down by ${inr(F.amount)}, and “${esc(entryTitle(orig))}” will show a <b>${esc(tag)}</b> tag in Entries.`;
  }
  return `<div class="stack">
    <div class="field"><div class="flabel">${esc(F.editId ? t('returnedPurchase') : t('whichPurchase'))}</div>
      ${F.editId ? '' : `<label class="search">${icon('search', 20)}<input id="psearch" placeholder="${esc(t('searchPurchase'))}" value="${esc(F.search)}" autocomplete="off"></label>`}
      <div id="plist-wrap">${purchaseList()}</div>
    </div>
    <div class="field"><div class="flabel">${esc(t('howMuchBack'))}</div>
      <div class="amount-box ref">
        <div class="amount-line"><span class="ret-rupee">${icon('refund', 26)}<span>₹</span></span><input id="amt" inputmode="decimal" autocomplete="off" placeholder="0" value="${F.amount ? group(F.amount) : ''}" aria-label="${esc(t('amount'))}"></div>
        <div class="chips">
          <button class="chip ${F.full ? 'on' : ''}" data-full="1">${esc(t('fullRefund'))}</button>
          <button class="chip ${!F.full ? 'on' : ''}" data-full="0">${esc(t('partRefund'))}</button>
        </div>
      </div>
    </div>
    <div class="pair">
      <label class="field box select-box">
        <span class="flabel-sm">${esc(t('refundedTo'))}</span>
        <span class="box-val">${esc(nm(store.findMode(F.mode)) || '—')} <span class="caret">▾</span></span>
        <select id="rmode" aria-label="${esc(t('refundedTo'))}">${modes.map((m) => `<option value="${esc(m.Code)}" ${m.Code === F.mode ? 'selected' : ''}>${esc(nm(m))}</option>`).join('')}</select>
      </label>
      <label class="field box date-box">
        <span class="flabel-sm">${esc(t('date'))}</span>
        <span class="box-val" id="date-label">${esc(dateCardLabel(F.date))}</span>
        <input type="date" id="date" value="${serialToISO(F.date)}" aria-label="${esc(t('date'))}">
      </label>
    </div>
    ${info ? `<div class="info ref-info">${info}</div>` : ''}
    ${saveButtons(t('saveRefund'), 'btn-ref')}
  </div>`;
}

// ------------------------------------------------------------ side panel (computer / iPad)
function sidePanel() {
  const now = serialToParts(todaySerial());
  const tot = monthTotals(now.y, now.m);
  const recent = store.live().slice().sort((a, b) => b.created - a.created || b.date - a.date).slice(0, 6);
  return `<aside class="side only-desk">
    <div class="card dark sofar">
      <div class="sofar-title">${esc(t('monthSoFar', { m: monthName(now.m) }))}</div>
      <div class="sofar-row">
        <div><span>${esc(t('inShort'))}</span><b>${inr(tot.inc)}</b></div>
        <div><span>${esc(t('outShort'))}</span><b>${inr(tot.out)}</b></div>
        <div><span>${esc(t('savedShort'))}</span><b>${inrNet(tot.saved)}</b></div>
      </div>
    </div>
    <div class="card recent">
      <div class="card-head"><h3>${esc(t('recent'))}</h3><a href="#/entries" class="link">${esc(t('viewAll'))}</a></div>
      ${recent.length ? recent.map((e) => entryRow(e, { withDate: true, compact: true })).join('') : `<p class="muted">${esc(t('noEntries'))}</p>`}
    </div>
  </aside>`;
}

// ---------------------------------------------------------------- events
function bind() {
  root.querySelector('.page-add').addEventListener('click', onClick);

  const amt = root.querySelector('#amt');
  amt?.addEventListener('input', () => {
    const raw = amt.value.replace(/[^0-9.]/g, '');
    const parts = raw.split('.');
    const clean = parts[0].slice(0, 10) + (parts.length > 1 ? '.' + parts[1].slice(0, 2) : '');
    F.amount = Number(clean) || 0;
    const intPart = parts[0] ? group(Number(parts[0])) : '';
    amt.value = intPart + (parts.length > 1 ? '.' + parts[1].slice(0, 2) : '');
    if (F.type === 'Refund' && F.full) {
      F.full = false;
      root.querySelectorAll('[data-full]').forEach((b) => b.classList.toggle('on', b.dataset.full === '0'));
    }
    if (F.type === 'Refund') updateRefundInfo();
  });

  const date = root.querySelector('#date');
  date?.addEventListener('change', () => {
    if (!date.value) return;
    F.date = isoToSerial(date.value);
    root.querySelector('#date-label').textContent = dateCardLabel(F.date);
    if (F.type === 'Refund') updateRefundInfo();
  });

  root.querySelector('#note')?.addEventListener('input', (e) => { F.note = e.target.value; });

  const ps = root.querySelector('#psearch');
  ps?.addEventListener('input', () => {
    F.search = ps.value;
    root.querySelector('#plist-wrap').innerHTML = purchaseList();
  });

  root.querySelector('#rmode')?.addEventListener('change', (e) => { F.mode = e.target.value; draw(); });
}

function updateRefundInfo() {
  // Redraw only the info box to keep keyboard focus in the amount field.
  const tmp = document.createElement('div');
  tmp.innerHTML = refundFields();
  const fresh = tmp.querySelector('.ref-info');
  const cur = root.querySelector('.ref-info');
  if (cur && fresh) cur.replaceWith(fresh);
  else if (cur) cur.remove();
  else if (fresh) root.querySelector('#form-err').before(fresh);
}

async function onClick(ev) {
  const b = ev.target.closest('button, [data-older]');
  if (!b || b.disabled) return;
  const d = b.dataset;

  if (d.type && d.type !== F.type) {
    const keep = { amount: F.amount, date: F.date, note: F.note };
    F = { ...freshForm(d.type), ...keep, amount: d.type === 'Refund' ? 0 : keep.amount };
    setPref('lastType', d.type === 'Refund' ? 'Expense' : d.type);
    return draw();
  }
  if (d.person) { F.person = d.person; setPref('lastPerson', d.person); return draw(); }
  if (d.cat) { F.cat = d.cat; F.err = ''; return draw(); }
  if (d.mode) { F.mode = d.mode; return draw(); }
  if (d.pick) {
    F.linked = d.pick;
    const orig = state.entries.find((x) => x.id === d.pick);
    if (orig) { F.mode = orig.mode; F.cat = orig.cat; F.person = orig.person; }
    F.full = true; F.err = '';
    return draw();
  }
  if ('older' in d) { F.showAll = true; return draw(); }
  if (d.full !== undefined) {
    F.full = d.full === '1';
    if (!F.full) { draw(); root.querySelector('#amt')?.select(); return; }
    return draw();
  }
  if (d.new) return addNew(d.new);
  if (d.save) return save(d.save);
  if ('delete' in d) return remove();
}

async function addNew(kind) {
  const map = {
    category: { list: 'categories', title: t('newCategory'), catKind: 'Expense' },
    source: { list: 'categories', title: t('newSource'), catKind: 'Income' },
    mode: { list: 'modes', title: t('newMode') },
  }[kind];
  const existing = map.list === 'categories' ? state.categories.filter((c) => c.Kind === map.catKind) : state[map.list];
  const res = await nameDialog({ title: map.title, existing });
  if (!res) return;
  try {
    const code = await store.addLookup(map.list, { ...res, catKind: map.catKind });
    if (map.list === 'categories') F.cat = code; else F.mode = code;
    toast(t('toastAdded'));
    draw();
  } catch (e) {
    toast(e.message, 'err');
  }
}

function validate() {
  if (F.type === 'Refund') {
    if (!F.linked) return t('errPurchase');
    const orig = state.entries.find((x) => x.id === F.linked);
    const left = orig.amount - store.refundedFor(orig.id, F.editId);
    if (!(F.amount > 0)) return t('errAmount');
    if (F.amount > left + 0.001) return t('errTooBig', { a: inr(left) });
    if (!F.mode) return t('errMode');
    return '';
  }
  if (F.type === 'Expense' && !F.person) return t('errPerson');
  if (!(F.amount > 0)) return t('errAmount');
  if (!F.cat) return F.type === 'Income' ? t('errSource') : t('errCategory');
  if (!F.mode) return t('errMode');
  return '';
}

async function save(how) {
  const err = validate();
  if (err) { F.err = err; root.querySelector('#form-err').textContent = err; return; }
  F.busy = true; F.err = ''; draw();

  let note = F.note.trim();
  if (F.type === 'Refund' && !F.editId) {
    const orig = state.entries.find((x) => x.id === F.linked);
    note = orig ? `${entryTitle(orig)} ${t('Refund').toLowerCase()}` : note;
  }
  const entry = {
    type: F.type, date: F.date, amount: Math.round(F.amount * 100) / 100, cat: F.cat,
    person: F.type === 'Income' ? '' : F.person, mode: F.mode, note, linked: F.type === 'Refund' ? F.linked : '',
  };
  try {
    if (F.editId) {
      const old = state.entries.find((x) => x.id === F.editId);
      await store.updateEntry({ ...old, ...entry, note: F.type === 'Refund' ? old.note : note });
      toast(t('toastSaved'));
      F = null;
      location.hash = '#/entries';
      return;
    }
    await store.addEntry(entry);
    toast(t('toastSaved'));
    setPref('lastMode.' + F.type, F.mode);
    const keep = { type: F.type, person: F.person, mode: F.mode, date: F.date };
    F = { ...freshForm(keep.type), ...keep };
    // "Save" on a computer goes to Entries; on a phone (and "Save & add another") the form stays ready for the next one.
    if (how === 'stay' && window.matchMedia('(min-width: 760px)').matches) { location.hash = '#/entries'; return; }
    draw();
    root.querySelector('#amt')?.focus();
  } catch (e) {
    F.busy = false; F.err = e.message; draw();
    toast(e.message, 'err');
  }
}

async function remove() {
  const e = state.entries.find((x) => x.id === F.editId);
  const hasRefunds = store.live().some((x) => x.linked === e.id);
  const ok = await confirmDialog({
    title: t('confirmDeleteTitle'),
    body: [t('confirmDeleteBody'), ...(hasRefunds ? [t('confirmDeleteRefunds')] : [])],
    okText: t('delete'), danger: true,
  });
  if (!ok) return;
  try {
    F.busy = true; draw();
    await store.softDelete(e.id);
    toast(t('toastDeleted'));
    F = null;
    location.hash = '#/entries';
  } catch (err) {
    F.busy = false; draw(); toast(err.message, 'err');
  }
}

export function resetAddForm() { F = null; }
