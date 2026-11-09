// Small shared UI pieces: toast messages, confirm dialog, "add new" sheet, language toggle.
import { t } from './i18n.js';
import { esc } from './format.js';
import { state } from './state.js';
import { icon } from './icons.js';

export function toast(msg, kind = 'ok') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.innerHTML = (kind === 'ok' ? icon('check', 18) : '') + `<span>${esc(msg)}</span>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, kind === 'err' ? 5000 : 2200);
}

function modal(inner) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${inner}</div>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('show'));
  const close = () => { wrap.classList.remove('show'); setTimeout(() => wrap.remove(), 200); };
  wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
  return { wrap, close };
}

/** Resolves true/false. */
export function confirmDialog({ title, body, okText, danger }) {
  return new Promise((resolve) => {
    const { wrap, close } = modal(`
      <h3>${esc(title)}</h3>
      ${body.map((b) => `<p>${esc(b)}</p>`).join('')}
      <div class="modal-actions">
        <button class="btn ghost" data-a="no">${esc(t('cancel'))}</button>
        <button class="btn ${danger ? 'danger' : 'primary'}" data-a="yes">${esc(okText)}</button>
      </div>`);
    wrap.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (!a) return;
      close(); resolve(a === 'yes');
    });
  });
}

/** Asks for an English + optional Gujarati name. Resolves {NameEN, NameGU} or null. */
export function nameDialog({ title, existing }) {
  return new Promise((resolve) => {
    const { wrap, close } = modal(`
      <h3>${esc(title)}</h3>
      <label class="fld"><span>${esc(t('nameEn'))}</span><input id="nd-en" autocomplete="off" maxlength="40"></label>
      <label class="fld"><span>${esc(t('nameGu'))}</span><input id="nd-gu" autocomplete="off" maxlength="40" class="gu"></label>
      <p class="err" id="nd-err"></p>
      <div class="modal-actions">
        <button class="btn ghost" data-a="no">${esc(t('cancel'))}</button>
        <button class="btn primary" data-a="yes">${esc(t('add'))}</button>
      </div>`);
    const en = wrap.querySelector('#nd-en');
    setTimeout(() => en.focus(), 50);
    const submit = () => {
      const NameEN = en.value.trim();
      const NameGU = wrap.querySelector('#nd-gu').value.trim();
      const err = wrap.querySelector('#nd-err');
      if (!NameEN) { err.textContent = t('errName'); return; }
      if (existing.some((x) => x.NameEN.toLowerCase() === NameEN.toLowerCase())) { err.textContent = t('errExists'); return; }
      close(); resolve({ NameEN, NameGU });
    };
    wrap.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'no') { close(); resolve(null); }
      if (a === 'yes') submit();
    });
    wrap.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  });
}

export function langToggle() {
  return `<div class="seg lang" role="group" aria-label="Language">
    <button data-lang="en" class="${state.lang === 'en' ? 'on' : ''}">EN</button>
    <button data-lang="gu" class="${state.lang === 'gu' ? 'on' : ''}">ગુ</button>
  </div>`;
}

/** Name of a lookup row in the current language (falls back to English). */
export function nm(row) {
  if (!row) return '';
  return state.lang === 'gu' && row.NameGU ? row.NameGU : row.NameEN;
}
