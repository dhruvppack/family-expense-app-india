// Dashboard (Phase 4) and Settings (full version in Phase 5) — interim screens.
import { state, setPref } from '../state.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, digits } from '../format.js';
import { CONFIG } from '../config.js';
import { langToggle } from '../ui.js';

export function renderDashboard(el) {
  el.innerHTML = `<div class="page">
    <header class="phead"><h1>${esc(t('navDashboard'))}</h1>${langToggle()}</header>
    <div class="card pad coming">${icon('chart', 32)}<h3>${esc(t('comingTitle'))}</h3><p class="muted">${esc(t('dashComing'))}</p></div>
  </div>`;
}

export function syncText() {
  if (!state.lastSync) return '';
  const mins = Math.floor((Date.now() - state.lastSync) / 60000);
  return mins < 1 ? t('syncedJustNow') : t('syncedAgo', { n: digits(mins) });
}

export function renderSettings(el, { onSignOut, onChange }) {
  const seg = (name, val, opts) => `<div class="seg" data-pref="${name}">${opts.map(([v, l]) =>
    `<button data-v="${v}" class="${val === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  el.innerHTML = `<div class="page page-settings">
    <header class="phead"><h1>${esc(t('navSettings'))}</h1></header>
    <div class="settings-grid">
      <div>
        <div class="sec-label only-phone">${esc(t('language'))}</div>
        <div class="card pad">
          <h3 class="only-desk">${esc(t('language'))}</h3>
          <div class="set-row"><span>${esc(t('appLanguage'))}</span>${seg('lang', state.lang, [['en', 'English'], ['gu', 'ગુજરાતી']])}</div>
          <div class="set-row"><span>${esc(t('numbersGu'))}</span>${seg('digits', state.digits, [['latin', '123'], ['gu', '૧૨૩']])}</div>
        </div>
        <div class="card pad coming small-coming">${icon('settings', 24)}<p class="muted">${esc(t('setComing'))}</p></div>
      </div>
      <div>
        <div class="sec-label only-phone">${esc(t('data'))}</div>
        <div class="card pad">
          <h3 class="only-desk">${esc(t('data'))}</h3>
          <div class="file-row">
            <span class="file-ico">${icon('sheet', 22)}</span>
            <span class="grow"><b>${esc(CONFIG.workbookName)}</b><br><span class="muted small" id="sync-text">${esc(state.demo ? t('demoBanner') : syncText())}</span></span>
            <span class="sync-dot"></span>
          </div>
          ${state.fileUrl && !state.demo ? `<a class="btn ghost block" href="${esc(state.fileUrl)}" target="_blank" rel="noopener">${esc(t('openExcel'))}</a>` : ''}
          ${state.account ? `<p class="muted small">${esc(t('signedInAs', { u: state.account.username }))}</p>` : ''}
          ${state.demo ? '' : `<button class="btn ghost block" data-signout>${icon('logout', 18)} ${esc(t('signOut'))}</button>`}
        </div>
      </div>
    </div>
  </div>`;
  el.querySelectorAll('[data-pref] button').forEach((b) => b.addEventListener('click', () => {
    const name = b.closest('[data-pref]').dataset.pref;
    state[name] = b.dataset.v; setPref(name, b.dataset.v);
    onChange();
  }));
  el.querySelector('[data-signout]')?.addEventListener('click', onSignOut);
}
