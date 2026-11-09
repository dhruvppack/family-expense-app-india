// Settings: language, digits, persons, expense categories, income sources, payment modes,
// the connected Excel file and the "How to install" link.
// Nothing is ever deleted from Excel here: an item can be hidden (Active = FALSE) and shown again,
// because old entries keep pointing to its code.
import { state, setPref } from '../state.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, digits } from '../format.js';
import { CONFIG } from '../config.js';
import * as store from '../store.js';
import { toast, confirmDialog, nm } from '../ui.js';

let root = null, opts = null;
let showHidden = false;

const KINDS = {
  persons: { list: () => state.persons, title: 'persons', add: 'newPerson' },
  expense: { list: () => state.categories.filter((c) => c.Kind === 'Expense').sort((a, b) => a.SortOrder - b.SortOrder), title: 'expenseCats', add: 'newCategory', catKind: 'Expense', store: 'categories' },
  income: { list: () => state.categories.filter((c) => c.Kind === 'Income').sort((a, b) => a.SortOrder - b.SortOrder), title: 'incomeSources', add: 'newSource', catKind: 'Income', store: 'categories' },
  modes: { list: () => state.modes, title: 'paymentModes', add: 'newMode' },
};
const storeKind = (k) => KINDS[k].store || k;

export function syncText() {
  if (!state.lastSync) return '';
  const mins = Math.floor((Date.now() - state.lastSync) / 60000);
  return mins < 1 ? t('syncedJustNow') : t('syncedAgo', { n: digits(mins) });
}

export function renderSettings(el, o) {
  root = el; opts = o;
  draw();
}

const both = (x) => (x.NameGU && x.NameGU !== x.NameEN ? `${x.NameEN} · ${x.NameGU}` : x.NameEN);
const visible = (list) => list.filter((x) => x.Active || showHidden);
const hiddenCount = () => [...state.persons, ...state.categories, ...state.modes].filter((x) => !x.Active).length;

function chipList(kind, cls = '') {
  const items = visible(KINDS[kind].list());
  return `<div class="chips set-chips">
    ${items.map((x) => `<button class="chip soft ${cls} ${x.Active ? '' : 'hidden-item'}" data-edit="${kind}" data-code="${esc(x.Code)}">${esc(both(x))}${x.Active ? '' : ` <small>(${esc(t('hiddenTag'))})</small>`}</button>`).join('')}
    <button class="chip new" data-add="${kind}">+ ${esc(t('add'))}</button>
  </div>`;
}

function catTable() {
  const items = visible(KINDS.expense.list());
  return `<div class="cat-table">
    <div class="cat-th only-desk"><span></span><span>English</span><span>ગુજરાતી</span><span></span></div>
    ${items.map((c) => `<button class="cat-tr ${c.Active ? '' : 'hidden-item'}" data-edit="expense" data-code="${esc(c.Code)}">
      <i style="background:${esc(c.Colour)}"></i><span>${esc(c.NameEN)}${c.Active ? '' : ` <small>(${esc(t('hiddenTag'))})</small>`}</span><span class="gu-col">${esc(c.NameGU)}</span>
      <span class="btn small ghost only-desk">${esc(t('edit'))}</span></button>`).join('')}
    <form class="cat-add only-desk" data-quickadd>
      <i class="dashed"></i><input name="en" placeholder="${esc(t('newCategory'))}" maxlength="40"><input name="gu" placeholder="ગુજરાતી નામ" maxlength="40"><button class="btn primary" type="submit">${esc(t('add'))}</button>
    </form>
  </div>`;
}

function draw() {
  const seg = (name, val, list) => `<div class="seg" data-pref="${name}">${list.map(([v, l]) =>
    `<button data-v="${v}" class="${val === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const hid = hiddenCount();
  root.innerHTML = `<div class="page page-settings">
    <header class="phead"><h1>${esc(t('navSettings'))}</h1></header>
    <div class="settings-grid">
      <div class="set-main">
        <div class="sec-label only-phone">${esc(t('language'))}</div>
        <div class="card pad only-phone">${langCard(seg)}</div>

        <div class="sec-label only-phone">${esc(t('persons'))}</div>
        <div class="card pad only-phone">${chipList('persons')}</div>

        <div class="sec-label"><span>${esc(t('expenseCats'))}</span><button class="link-add only-phone" data-add="expense">+ ${esc(t('add'))}</button></div>
        <div class="card cat-card-set"><h3 class="only-desk cat-h">${esc(t('expenseCats'))}</h3>${catTable()}</div>

        <div class="sec-label only-phone"><span>${esc(t('incomeSources'))}</span></div>
        <div class="card pad only-phone">${chipList('income', 'inc')}</div>

        <div class="sec-label only-phone">${esc(t('paymentModes'))}</div>
        <div class="card pad only-phone">${chipList('modes')}</div>
        ${hid ? `<button class="link show-hidden" data-toggle-hidden>${esc(showHidden ? t('hideHidden') : t('showHidden', { n: digits(hid) }))}</button>` : ''}
      </div>

      <div class="set-side">
        <div class="card pad only-desk"><h3>${esc(t('language'))}</h3>${langCard(seg)}</div>
        <div class="card pad only-desk"><h3>${esc(t('persons'))}</h3>${chipList('persons')}</div>
        <div class="card pad only-desk"><h3>${esc(t('incomeSources'))}</h3>${chipList('income', 'inc')}</div>
        <div class="card pad only-desk"><h3>${esc(t('paymentModes'))}</h3>${chipList('modes')}</div>

        <div class="sec-label only-phone">${esc(t('data'))}</div>
        <div class="card pad">
          <h3 class="only-desk">${esc(t('data'))}</h3>
          <div class="file-row">
            <span class="file-ico">${icon('sheet', 22)}</span>
            <span class="grow"><b>${esc(CONFIG.workbookName)}</b><br><span class="muted small">${esc(state.demo ? t('demoBanner') : syncText())}</span></span>
            <span class="sync-dot" title="${esc(syncText())}"></span>
          </div>
          ${state.fileUrl && !state.demo ? `<a class="btn ghost block" href="${esc(state.fileUrl)}" target="_blank" rel="noopener">${esc(t('openExcel'))}</a>` : ''}
          <button class="btn ghost block" data-refresh>${icon('refresh', 18)} ${esc(t('refresh'))}</button>
        </div>
        <a class="card pad install-link" href="#/install"><span>${esc(t('howInstall'))}</span>${icon('chevRight', 20)}</a>
        ${state.demo ? '' : `<div class="card pad">
          ${state.account ? `<p class="muted small" style="margin-top:0">${esc(t('signedInAs', { u: state.account.username }))}</p>` : ''}
          <button class="btn ghost block" data-signout>${icon('logout', 18)} ${esc(t('signOut'))}</button></div>`}
        <p class="muted small app-ver">${esc(t('appName'))} · ${esc(CONFIG.version || '')}</p>
      </div>
    </div>
  </div>`;
  bind();
}

function langCard(seg) {
  return `<div class="set-row"><span>${esc(t('appLanguage'))}</span>${seg('lang', state.lang, [['en', 'English'], ['gu', 'ગુજરાતી']])}</div>
    <div class="set-row"><span>${esc(t('numbersGu'))}</span>${seg('digits', state.digits, [['latin', '123'], ['gu', '૧૨૩']])}</div>`;
}

function bind() {
  const page = root.querySelector('.page-settings');
  page.querySelectorAll('[data-pref] button').forEach((b) => b.addEventListener('click', () => {
    const name = b.closest('[data-pref]').dataset.pref;
    state[name] = b.dataset.v; setPref(name, b.dataset.v);
    opts.onChange();
  }));
  page.querySelector('[data-signout]')?.addEventListener('click', async () => {
    const ok = await confirmDialog({ title: t('signOut'), body: [t('signOutBody')], okText: t('signOut') });
    if (ok) opts.onSignOut();
  });
  page.addEventListener('click', (e) => {
    const b = e.target.closest('[data-edit],[data-add],[data-toggle-hidden]');
    if (!b) return;
    if (b.dataset.edit) editItem(b.dataset.edit, b.dataset.code);
    else if (b.dataset.add) addItem(b.dataset.add);
    else { showHidden = !showHidden; draw(); }
  });
  page.querySelector('[data-quickadd]')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const NameEN = f.en.value.trim(), NameGU = f.gu.value.trim();
    if (!NameEN) { f.en.focus(); return; }
    if (KINDS.expense.list().some((x) => x.NameEN.toLowerCase() === NameEN.toLowerCase())) { toast(t('errExists'), 'err'); return; }
    await save(() => store.addLookup('categories', { NameEN, NameGU, catKind: 'Expense' }), t('toastAdded'));
  });
}

async function save(fn, okMsg) {
  try { await fn(); toast(okMsg); draw(); } catch (err) { toast(err.message, 'err'); }
}

async function addItem(kind) {
  const res = await itemDialog({ title: t(KINDS[kind].add), kind });
  if (!res) return;
  await save(() => store.addLookup(storeKind(kind), { NameEN: res.NameEN, NameGU: res.NameGU, catKind: KINDS[kind].catKind }), t('toastAdded'));
}

async function editItem(kind, code) {
  const item = KINDS[kind].list().find((x) => x.Code === code);
  if (!item) return;
  const res = await itemDialog({ title: t('editItem', { n: nm(item) }), kind, item });
  if (!res) return;
  if (res.action === 'hide' || res.action === 'show') {
    if (res.action === 'hide') {
      const ok = await confirmDialog({ title: t('hideTitle', { n: item.NameEN }), body: [t('hideBody')], okText: t('hide') });
      if (!ok) return;
    }
    return save(() => store.updateLookup(storeKind(kind), code, { Active: res.action === 'show' }), t('toastSaved'));
  }
  const fields = { NameEN: res.NameEN, NameGU: res.NameGU };
  if (res.Colour) fields.Colour = res.Colour;
  await save(() => store.updateLookup(storeKind(kind), code, fields), t('toastSaved'));
}

/** Add / edit dialog. Resolves {NameEN, NameGU, Colour} | {action:'hide'|'show'} | null */
function itemDialog({ title, kind, item }) {
  const withColour = kind === 'expense' || kind === 'income';
  const existing = KINDS[kind].list().filter((x) => x !== item);
  let colour = item?.Colour || '';
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
      <h3>${esc(title)}</h3>
      <label class="fld"><span>${esc(t('nameEn'))}</span><input id="it-en" maxlength="40" value="${esc(item?.NameEN || '')}" autocomplete="off"></label>
      <label class="fld"><span>${esc(t('nameGu'))}</span><input id="it-gu" class="gu" maxlength="40" value="${esc(item?.NameGU || '')}" autocomplete="off"></label>
      ${withColour && item ? `<div class="fld"><span>${esc(t('colour'))}</span><div class="swatches">${store.PALETTE_CHOICES.map((c) => `<button type="button" class="sw ${c === colour ? 'on' : ''}" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div></div>` : ''}
      ${item ? `<p class="muted small">${esc(t('codeNote', { c: item.Code }))}</p>` : ''}
      <p class="err" id="it-err"></p>
      <div class="modal-actions">
        ${item ? `<button class="btn ghost" data-a="${item.Active ? 'hide' : 'show'}">${esc(item.Active ? t('hide') : t('showAgain'))}</button>` : `<button class="btn ghost" data-a="no">${esc(t('cancel'))}</button>`}
        <button class="btn primary" data-a="yes">${esc(item ? t('save') : t('add'))}</button>
      </div></div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    setTimeout(() => wrap.querySelector('#it-en').focus(), 60);
    const close = (v) => { wrap.classList.remove('show'); setTimeout(() => wrap.remove(), 200); resolve(v); };
    const submit = () => {
      const NameEN = wrap.querySelector('#it-en').value.trim(), NameGU = wrap.querySelector('#it-gu').value.trim();
      const err = wrap.querySelector('#it-err');
      if (!NameEN) { err.textContent = t('errName'); return; }
      if (existing.some((x) => x.NameEN.toLowerCase() === NameEN.toLowerCase())) { err.textContent = t('errExists'); return; }
      close({ NameEN, NameGU, Colour: colour || undefined });
    };
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) return close(null);
      const sw = e.target.closest('[data-c]');
      if (sw) { colour = sw.dataset.c; wrap.querySelectorAll('.sw').forEach((x) => x.classList.toggle('on', x === sw)); return; }
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'yes') submit();
      else if (a === 'no') close(null);
      else if (a === 'hide' || a === 'show') close({ action: a });
    });
    wrap.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') close(null); });
  });
}
