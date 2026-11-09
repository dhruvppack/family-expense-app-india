// Family Expense App - India — start-up, layout and screen switching.
import { state, setPref } from './state.js';
import { t } from './i18n.js';
import { icon } from './icons.js';
import { esc } from './format.js';
import * as auth from './auth.js';
import * as store from './store.js';
import { toast } from './ui.js';
import { renderAdd } from './views/add.js';
import { renderEntries } from './views/entries.js';
import { renderSettings } from './views/settings.js';
import { renderInstall } from './views/install.js';
import { renderDashboard } from './views/dashboard.js';

const app = document.getElementById('app');

const NAV = [
  ['add', 'add', 'navAdd', 'navAddEntry'],
  ['entries', 'list', 'navEntries', 'navEntries'],
  ['dashboard', 'chart', 'navDashboard', 'navDashboard'],
  ['settings', 'settings', 'navSettings', 'navSettings'],
];

function currentRoute() {
  const h = location.hash.replace(/^#\/?/, '');
  const [name, arg] = h.split('/');
  return { name: name || 'add', arg: arg ? decodeURIComponent(arg) : '' };
}

function shell() {
  const rn = currentRoute().name;
  const r = rn === 'edit' ? 'entries' : rn === 'install' ? 'settings' : rn;
  document.documentElement.lang = state.lang === 'gu' ? 'gu' : 'en';
  document.body.classList.toggle('lang-gu', state.lang === 'gu');
  app.innerHTML = `
    ${state.demo ? `<div class="demo-banner">${esc(t('demoBanner'))}</div>` : ''}
    <div class="layout">
      <nav class="sidebar">
        <div class="brand"><b>${esc(t('appName'))}</b><span>${esc(t('appSub'))}</span></div>
        ${NAV.map(([k, ic, , longKey]) => `<a href="#/${k}" class="${r === k ? 'on' : ''}">${icon(ic, 20)}<span>${esc(t(longKey))}</span></a>`).join('')}
        <button class="side-refresh" data-refresh>${icon('refresh', 18)}<span>${esc(t('refresh'))}</span></button>
      </nav>
      <main id="view"></main>
    </div>
    <nav class="tabbar">
      ${NAV.map(([k, ic, shortKey]) => `<a href="#/${k}" class="${r === k ? 'on' : ''}">${icon(ic, 24)}<span>${esc(t(shortKey))}</span></a>`).join('')}
    </nav>`;
}

function route(opts = {}) {
  shell();
  const view = document.getElementById('view');
  const { name, arg } = currentRoute();
  window.scrollTo(0, 0);
  switch (name) {
    case 'entries': return renderEntries(view);
    case 'edit': return renderAdd(view, { editId: arg });
    // The dashboard always reads fresh data from Excel when it is opened.
    case 'dashboard': return renderDashboard(view, { reload: !opts.fresh && Date.now() - (state.lastSync || 0) > 5000 });
    case 'install': return renderInstall(view);
    case 'settings': return renderSettings(view, { onSignOut: () => auth.signOut(), onChange: route });
    default: return renderAdd(view, {});
  }
}

async function refresh(quiet) {
  try {
    await store.loadAll();
    if (!quiet) toast(t('syncedJustNow').split('·').pop().trim());
    route({ fresh: true });
  } catch (e) {
    toast(e.message, 'err');
  }
}

// Language buttons and refresh buttons can appear on any screen.
document.addEventListener('click', (e) => {
  const lb = e.target.closest('[data-lang]');
  if (lb) {
    state.lang = lb.dataset.lang; setPref('lang', state.lang);
    if (lb.closest('.signin')) boot(); else route();
    return;
  }
  if (e.target.closest('[data-refresh]')) refresh(false);
});

window.addEventListener('hashchange', () => {
  // Fresh data from Excel when opening Entries, if it's been more than a minute.
  if (currentRoute().name === 'entries' && !state.demo && Date.now() - (state.lastSync || 0) > 60000) {
    refresh(true);
    return;
  }
  route();
});

// Re-read Excel when the app comes back to the foreground after a while.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.lastSync && !state.demo && Date.now() - state.lastSync > 5 * 60000) refresh(true);
});

function screen(html) {
  app.innerHTML = `<div class="center-screen">${html}</div>`;
}

async function boot() {
  document.body.classList.toggle('lang-gu', state.lang === 'gu');
  screen(`<div class="spinner"></div><p class="muted">${esc(t('loading'))}</p>`);
  try {
    if (!state.demo) {
      const account = await auth.initAuth();
      if (!account) {
        screen(`<div class="card pad signin">
          <div class="app-icon"><img src="icons/icon-192.png" alt="" width="72" height="72"></div>
          <h1>${esc(t('appName'))}</h1>
          <p class="muted">${esc(t('signInBody'))}</p>
          <button class="btn big btn-exp" id="signin">${esc(t('signIn'))}</button>
          <div class="signin-lang"><button data-lang="en" class="link">English</button> · <button data-lang="gu" class="link">ગુજરાતી</button></div>
        </div>`);
        document.getElementById('signin').onclick = () => auth.signIn();
        return;
      }
    }
    if (new URLSearchParams(location.search).has('diag')) {
      const { runDiag } = await import('./diag.js');
      app.innerHTML = '<main id="view" style="max-width:720px;margin:0 auto;padding:18px"></main>';
      return runDiag(document.getElementById('view'));
    }
    await store.loadAll();
    route();
  } catch (e) {
    console.error(e);
    const who = state.account?.username || '';
    screen(`<div class="card pad signin">
      <h2>${esc(t('loadFailed'))}</h2>
      ${who ? `<p>${esc(t('signedInAs', { u: who }))}</p>` : ''}
      <p class="muted">${esc(t(e.noAccess ? 'noAccessHelp' : 'loadFailedHelp'))}</p>
      <p class="muted small">${esc(e.message)}${e.detail ? '<br>' + esc(e.detail) : ''}</p>
      <button class="btn big btn-exp" onclick="location.reload()">${esc(t('tryAgain'))}</button>
      ${state.demo ? '' : `<button class="btn big ghost" id="switch-acc">${esc(t('switchAccount'))}</button>`}
    </div>`);
    document.getElementById('switch-acc')?.addEventListener('click', () => auth.signOut());
  }
}

// Offline shell + "install to home screen" support.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

boot();
