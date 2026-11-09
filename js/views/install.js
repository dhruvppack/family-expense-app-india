// "How to install" — put the app on the home screen (English + Gujarati).
import { state } from '../state.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc } from '../format.js';
import { langToggle, toast } from '../ui.js';

const STEPS = {
  iphone: {
    en: ['Open the app link in <b>Safari</b> (not Chrome or another browser).', 'Tap the <b>Share</b> button (the square with an arrow pointing up) at the bottom of the screen.', 'Scroll down and tap <b>Add to Home Screen</b>.', 'Keep the name <b>Family Expenses</b> and tap <b>Add</b>.', 'Open the app from the new icon on your home screen and sign in once.'],
    gu: ['એપની લિંક <b>Safari</b> માં ખોલો (Chrome કે બીજા બ્રાઉઝરમાં નહીં).', 'નીચે આપેલું <b>Share</b> બટન (ઉપર તીરવાળું ચોરસ) દબાવો.', 'નીચે સ્ક્રોલ કરીને <b>Add to Home Screen</b> દબાવો.', 'નામ <b>Family Expenses</b> રહેવા દો અને <b>Add</b> દબાવો.', 'હોમ સ્ક્રીન પરના નવા આઇકનથી એપ ખોલો અને એક વાર સાઇન ઇન કરો.'],
  },
  android: {
    en: ['Open the app link in <b>Chrome</b>.', 'Tap the <b>⋮</b> menu (three dots, top right).', 'Tap <b>Add to Home screen</b> or <b>Install app</b>.', 'Tap <b>Install</b> (or <b>Add</b>) to confirm.', 'Open the app from the new icon and sign in once.'],
    gu: ['એપની લિંક <b>Chrome</b> માં ખોલો.', 'ઉપર જમણે <b>⋮</b> મેનુ (ત્રણ ટપકાં) દબાવો.', '<b>Add to Home screen</b> અથવા <b>Install app</b> દબાવો.', 'ખાતરી માટે <b>Install</b> (અથવા <b>Add</b>) દબાવો.', 'નવા આઇકનથી એપ ખોલો અને એક વાર સાઇન ઇન કરો.'],
  },
  computer: {
    en: ['Open the app link in <b>Chrome</b> or <b>Microsoft Edge</b>.', 'Click the <b>Install</b> icon at the right end of the address bar (a small screen with a down arrow), or open the browser menu and choose <b>Install Family Expense App - India</b> / <b>Apps → Install this site as an app</b>.', 'Click <b>Install</b>. The app opens in its own window and appears in your Start menu / Dock.'],
    gu: ['એપની લિંક <b>Chrome</b> અથવા <b>Microsoft Edge</b> માં ખોલો.', 'એડ્રેસ બારના જમણા છેડે <b>Install</b> આઇકન (નીચે તીરવાળી નાની સ્ક્રીન) પર ક્લિક કરો, અથવા બ્રાઉઝર મેનુમાં <b>Install Family Expense App - India</b> / <b>Apps → Install this site as an app</b> પસંદ કરો.', '<b>Install</b> પર ક્લિક કરો. એપ પોતાની વિન્ડોમાં ખૂલશે અને Start મેનુ / Dock માં દેખાશે.'],
  },
};

function platform() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'iphone';
  if (/Android/.test(ua)) return 'android';
  return 'computer';
}

export function renderInstall(el) {
  const lang = state.lang === 'gu' ? 'gu' : 'en';
  const mine = platform();
  const order = [mine, ...['iphone', 'android', 'computer'].filter((p) => p !== mine)];
  const link = location.origin + location.pathname;
  const installed = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  el.innerHTML = `<div class="page page-install">
    <header class="phead"><div><a href="#/settings" class="back-link">${icon('chevLeft', 18)} ${esc(t('navSettings'))}</a><h1>${esc(t('howInstall'))}</h1></div>${langToggle()}</header>
    ${installed ? `<div class="card pad ok-box">${icon('check', 20)} ${esc(t('alreadyInstalled'))}</div>` : ''}
    <div class="card pad link-card">
      <span class="muted small">${esc(t('appLink'))}</span>
      <div class="link-row"><code>${esc(link)}</code><button class="btn small ghost" data-copy>${esc(t('copy'))}</button></div>
      <p class="muted small">${esc(t('shareTip'))}</p>
    </div>
    <div class="install-grid">
      ${order.map((p) => `<section class="card pad ${p === mine ? 'mine' : ''}">
        <h3>${esc(t('inst_' + p))}${p === mine ? ` <span class="tag-mine">${esc(t('thisDevice'))}</span>` : ''}</h3>
        <ol class="steps">${STEPS[p][lang].map((s) => `<li>${s}</li>`).join('')}</ol>
      </section>`).join('')}
    </div>
    <div class="card pad">
      <h3>${esc(t('firstTime'))}</h3>
      <ul class="tips">${t('firstTimeTips').split('|').map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    </div>
  </div>`;
  el.querySelector('[data-copy]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(link); toast(t('copied')); } catch { toast(link); }
  });
}
