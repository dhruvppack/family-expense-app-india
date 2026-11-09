// Dashboard — Month and Year tabs.
// COMPARISON RULE: every "vs" figure compares with the same period LAST YEAR by default
// (Month: same month last year; Year: previous year, same months if the year is still running).
// "Compare with" lets the user pick another month+year (Month tab) or year (Year tab).
// This choice is NOT saved: it resets to last year every time the app is opened.
import { state } from '../state.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { inr, inrNet, inrShort, esc, digits, todaySerial, serialToParts, monthShort, monthName, dayMonth } from '../format.js';
import * as store from '../store.js';
import { langToggle, nm } from '../ui.js';
import { monthAgg, rangeAgg, yearMonths, runningTotal, dataYears, change, daysIn } from '../dashcalc.js';
import { lineChart, barChart, donut, showTip, hideTip, COLORS } from '../charts.js';
import { entryTitle } from './common.js';

const NOW = serialToParts(todaySerial());
const D = { tab: 'month', y: NOW.y, m: NOW.m, yy: NOW.y, cmp: null, cmpYear: null };
const MODE_COLORS = ['#3B82C4', '#7C5CC4', '#6B675F', '#0F766E', '#D97706', '#C2557A', '#5FA39B', '#8B7B4B'];

let root = null;
let charts = [];   // [{ id, build(width) }]

// ------------------------------------------------------------------ helpers
const cmpMonth = () => D.cmp || { y: D.y - 1, m: D.m };
const cmpYear = () => (D.cmpYear !== null ? D.cmpYear : D.yy - 1);
const isDefaultCmp = () => (D.tab === 'month' ? !D.cmp : D.cmpYear === null);
const mLabel = (y, m) => `${monthShort(m)} ${digits(y)}`;
const uptoFor = (y) => (y === NOW.y ? NOW.m : 11);
/** "2025" for a full year, "Jan–Nov 2025" when only part of the year is compared */
const yLabel = (y, upto) => (upto === 11 ? digits(y) : `${monthShort(0)}–${monthShort(upto)} ${digits(y)}`);
const pct = (x) => digits(Math.abs(x).toFixed(1));

function catColor(code) { return store.findCat(code)?.Colour || '#A8A29E'; }
function catName(code) { return nm(store.findCat(code)) || code; }

/** "▲ ₹5,000 · 7.2% vs Nov 2025", or "No data for Nov 2025" */
function changeLine(now, before, upIsGood, cmpHas, cmpText, { amount = true, percent = true, suffix } = {}) {
  if (!cmpHas) return `<span class="chg none">${esc(t('noDataFor', { p: cmpText }))}</span>`;
  const c = change(now, before, upIsGood);
  if (c.dir === 'flat') return `<span class="chg flat">= ${esc(suffix || t('vs', { p: cmpText }))}</span>`;
  const parts = [];
  if (amount) parts.push(inr(Math.abs(c.diff)));
  if (percent && c.pct !== null) parts.push(pct(c.pct) + '%');
  return `<span class="chg ${c.good ? 'good' : 'bad'}">${c.dir === 'up' ? '▲' : '▼'} ${parts.join(' · ')} <span class="chg-vs">${esc(suffix || t('vs', { p: cmpText }))}</span></span>`;
}
/** Short "▲ 10.9%" used in lists */
function pctChip(now, before, upIsGood, cmpHas) {
  if (!cmpHas) return '<span class="chg none">—</span>';
  if (before <= 0 && now > 0) return `<span class="chg new">${esc(t('newCat'))}</span>`;
  const c = change(now, before, upIsGood);
  if (c.dir === 'flat' || c.pct === null) return '<span class="chg flat">=</span>';
  return `<span class="chg ${c.good ? 'good' : 'bad'}">${c.dir === 'up' ? '▲' : '▼'} ${pct(c.pct)}%</span>`;
}
const legendSq = (color, text, dashed) => `<span class="lg"><i style="${dashed ? `border-top:2px dashed ${color};background:none;height:0;width:14px` : `background:${color}`}"></i>${esc(text)}</span>`;
const legendLine = (color, text, dashed) => `<span class="lg"><i class="ln" style="border-top:${dashed ? '2px dashed' : '2.5px solid'} ${color}"></i>${esc(text)}</span>`;
const sortedCats = (map) => [...map].filter(([, v]) => v > 0.001).sort((a, b) => (a[0] === 'OTHER') - (b[0] === 'OTHER') || b[1] - a[1]);

// ------------------------------------------------------------------ entry point
export async function renderDashboard(el, { reload } = {}) {
  root = el;
  if (reload && !state.demo) {
    el.innerHTML = `<div class="page">${header()}<div class="card pad center-load"><div class="spinner"></div><p class="muted">${esc(t('loading'))}</p></div></div>`;
    try { await store.loadAll(); } catch (e) { el.querySelector('.center-load').innerHTML = `<p class="err">${esc(e.message)}</p>`; return; }
  }
  draw();
}

function draw() {
  charts = [];
  hideTip();
  root.innerHTML = `<div class="page page-dash">${header()}${D.tab === 'month' ? monthView() : yearView()}</div>`;
  bind();
  drawCharts();
}

function drawCharts() {
  for (const c of charts) {
    const box = root.querySelector('#' + c.id);
    if (!box) continue;
    const w = Math.floor(box.clientWidth);
    if (w < 40 && !c.fixed) continue;
    const ch = c.build(w);
    box.innerHTML = ch.svg;
    ch.bind(box);
  }
}
let rz;
window.addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => { if (root && root.isConnected && root.querySelector('.page-dash')) drawCharts(); }, 150);
});

// ------------------------------------------------------------------ header
function header() {
  const month = D.tab === 'month';
  const label = month ? (window.innerWidth >= 760 ? `${monthName(D.m)} ${digits(D.y)}` : mLabel(D.y, D.m)) : digits(D.yy);
  const atEnd = month ? D.y === NOW.y && D.m === NOW.m : D.yy === NOW.y;
  const cmpText = month ? mLabel(cmpMonth().y, cmpMonth().m) : yLabel(cmpYear(), uptoFor(D.yy));
  return `<header class="phead dash-head">
    <h1>${esc(t('navDashboard'))}</h1>
    <div class="dash-tools">
      ${langToggle()}
      <button class="icon-btn" data-refresh title="${esc(t('refresh'))}" aria-label="${esc(t('refresh'))}">${icon('refresh', 20)}<span class="only-desk">${esc(t('refresh'))}</span></button>
    </div>
  </header>
  <div class="dash-controls">
    <div class="seg" role="tablist">
      <button data-tab="month" class="${month ? 'on' : ''}">${esc(t('month'))}</button>
      <button data-tab="year" class="${!month ? 'on' : ''}">${esc(t('year'))}</button>
    </div>
    <div class="stepper">
      <button data-step="-1" aria-label="Previous">${icon('chevLeft', 20)}</button>
      <span>${esc(label)}</span>
      <button data-step="1" ${atEnd ? 'disabled' : ''} aria-label="Next">${icon('chevRight', 20)}</button>
    </div>
    <button class="cmp-pill ${isDefaultCmp() ? '' : 'custom'}" data-cmp>
      <span class="cmp-k">${esc(t('compareWith'))}</span><b>${esc(cmpText)}</b><span class="caret">▾</span>
    </button>
  </div>`;
}

// ------------------------------------------------------------------ MONTH
function monthView() {
  const cm = cmpMonth();
  const cur = monthAgg(D.y, D.m), prev = monthAgg(cm.y, cm.m);
  const curText = mLabel(D.y, D.m), cmpText = mLabel(cm.y, cm.m);
  const has = prev.hasData;
  const pctInc = cur.inc > 0 ? Math.round((cur.saved / cur.inc) * 100) : null;
  const savedLabel = pctInc === null ? t('savedShort') : t('savedPctIncome', { p: digits(pctInc) });

  // --- KPI (computer)
  const kpiDesk = `<div class="kpis only-desk">
    <div class="card kpi"><span class="k">${esc(t('moneyIn'))}</span><b class="v amt-in">${inr(cur.inc)}</b>${changeLine(cur.inc, prev.inc, true, has, cmpText, { percent: false })}</div>
    <div class="card kpi"><span class="k">${esc(t('moneyOut'))}</span><b class="v">${inr(cur.out)}</b>${changeLine(cur.out, prev.out, false, has, cmpText)}</div>
    <div class="card kpi dark"><span class="k">${esc(savedLabel)}</span><b class="v">${inrNet(cur.saved)}</b>${changeLine(cur.saved, prev.saved, true, has, cmpText, { percent: false })}</div>
    <div class="card kpi"><span class="k">${esc(t('spentIn', { p: cmpText }))}</span><b class="v">${has ? inr(prev.out) : '—'}</b>${has ? changeLine(cur.out, prev.out, false, true, cmpText, { amount: false, suffix: t('inPeriod', { p: curText }) }) : `<span class="chg none">${esc(t('noDataFor', { p: cmpText }))}</span>`}</div>
  </div>`;

  // --- KPI (phone)
  const outShare = cur.inc > 0 ? Math.min(100, (cur.out / cur.inc) * 100) : (cur.out > 0 ? 100 : 0);
  const kpiPhone = `<div class="card pad only-phone kpi-phone">
    <div class="kp-row">
      <div><span class="k">${esc(t('moneyIn'))}</span><b class="v amt-in">${inr(cur.inc)}</b>${changeLine(cur.inc, prev.inc, true, has, cmpText, { percent: false })}</div>
      <div><span class="k">${esc(t('moneyOut'))}</span><b class="v">${inr(cur.out)}</b>${changeLine(cur.out, prev.out, false, has, cmpText, { amount: false })}</div>
    </div>
    <div class="inout-bar"><span style="width:${outShare}%;background:${COLORS.INK}"></span><span style="flex:1;background:${COLORS.TEAL}"></span></div>
    <div class="saved-box"><div><span class="k">${esc(savedLabel)}</span><b class="v">${inrNet(cur.saved)}</b></div>${has ? `<span class="saved-pill">${changeLine(cur.saved, prev.saved, true, true, cmpText, { percent: false })}</span>` : `<span class="saved-pill">${changeLine(0, 0, true, false, cmpText)}</span>`}</div>
  </div>`;

  // --- donut
  const cats = sortedCats(cur.byCat);
  const spent = cats.reduce((s, [, v]) => s + v, 0);
  let donutCard;
  if (!cats.length) donutCard = `<div class="card pad"><h3>${esc(t('whereMoney'))}</h3><p class="muted empty-note">${esc(t('noSpending'))}</p></div>`;
  else {
    const segs = cats.map(([c, v]) => ({ value: v, color: catColor(c), tip: `<b>${esc(catName(c))}</b><br>${inr(v)} · ${digits(Math.round((v / spent) * 100))}%` }));
    charts.push({ id: 'donut', fixed: true, build: () => donut({ size: window.innerWidth >= 760 ? 170 : 150, segs, center: `<span>${esc(t('spent'))}</span><b>${inr(spent)}</b>` }) });
    donutCard = `<div class="card pad"><h3>${esc(t('whereMoney'))}</h3>
      <div class="donut-wrap"><div id="donut" class="donut-box"></div>
        <ul class="legend-list">${cats.map(([c, v]) => `<li><i style="background:${catColor(c)}"></i><span>${esc(catName(c))}</span><b>${digits(Math.round((v / spent) * 100))}%</b></li>`).join('')}</ul>
      </div></div>`;
  }

  // --- each category vs comparison
  const codes = new Set([...cur.byCat.keys(), ...prev.byCat.keys()].filter((c) => (cur.byCat.get(c) || 0) > 0.001 || (prev.byCat.get(c) || 0) > 0.001));
  const rows = [...codes].map((c) => [c, Math.max(0, cur.byCat.get(c) || 0), Math.max(0, prev.byCat.get(c) || 0)])
    .sort((a, b) => (a[0] === 'OTHER') - (b[0] === 'OTHER') || b[1] - a[1]);
  const mx = Math.max(1, ...rows.flatMap((r) => [r[1], has ? r[2] : 0]));
  const catCard = `<div class="card pad cat-card">
    <div class="card-head"><h3>${esc(t('byCatVs', { p: cmpText }))}</h3>
      <div class="legend">${has ? legendSq('#C9C5BD', cmpText) : ''}${legendSq(COLORS.INK, curText)}</div></div>
    ${has ? '' : `<p class="muted small no-data">${esc(t('noDataFor', { p: cmpText }))}</p>`}
    ${rows.length ? rows.map(([c, a, b]) => `<div class="crow" data-tip="${esc(`<b>${esc(catName(c))}</b><br>${esc(curText)}: ${inr(a)}${has ? `<br>${esc(cmpText)}: ${inr(b)}` : ''}`)}">
      <span class="crow-name">${esc(catName(c))}</span>
      <span class="crow-bars">${has ? `<i class="cb cmp" style="width:${(b / mx) * 100}%"></i>` : ''}<i class="cb cur" style="width:${(a / mx) * 100}%"></i></span>
      <b class="crow-val">${inr(a)}</b>
      <span class="crow-chg">${pctChip(a, b, false, has)}</span>
    </div>`).join('') : `<p class="muted empty-note">${esc(t('noSpending'))}</p>`}
  </div>`;

  // --- spending pace
  const nDays = Math.max(daysIn(D.y, D.m), daysIn(cm.y, cm.m));
  const curRun = runningTotal(cur, D.y, D.m);
  const cmpRun = has ? runningTotal(prev, cm.y, cm.m) : [];
  const pad = (arr) => Array.from({ length: nDays }, (_, i) => (arr[i] === undefined ? null : arr[i]));
  const lastIdx = curRun.reduce((k, v, i) => (v !== null ? i : k), -1);
  const day = lastIdx + 1;
  const pv = curRun[lastIdx] || 0, pc = has ? (cmpRun[Math.min(lastIdx, cmpRun.length - 1)] || 0) : 0;
  charts.push({
    id: 'pace',
    build: (w) => lineChart({
      w, h: window.innerWidth >= 760 ? 200 : 180, n: nDays,
      series: [{ values: pad(cmpRun), color: COLORS.CMP, dashed: true }, { values: pad(curRun), color: COLORS.TEAL }],
      xLabels: [{ i: 0, text: digits(1) }, { i: 14, text: digits(15) }, { i: nDays - 1, text: digits(nDays) }],
      yFmt: inrShort,
      tip: (i) => `<b>${esc(t('dayN', { d: digits(i + 1) }))}</b>${curRun[i] !== null && curRun[i] !== undefined ? `<br>${esc(curText)}: ${inr(curRun[i])}` : ''}${has && cmpRun[i] !== null && cmpRun[i] !== undefined ? `<br>${esc(cmpText)}: ${inr(cmpRun[i])}` : ''}`,
    }),
  });
  const paceCard = `<div class="card pad">
    <div class="card-head"><h3><span class="only-desk">${esc(t('pace'))}</span><span class="only-phone">${esc(t('paceShort'))}</span></h3>
      <div class="legend">${legendLine(COLORS.TEAL, curText)}${has ? legendLine(COLORS.CMP, cmpText, true) : ''}</div></div>
    <div id="pace" class="chart-box"></div>
    <p class="caption">${day > 0 ? (has
    ? t('byDay', { d: dayLabel(day), a: `<b>${inr(pv)}</b>`, p1: esc(curText), b: `<b>${inr(pc)}</b>`, p2: esc(cmpText) })
    : `${t('byDayOnly', { d: dayLabel(day), a: `<b>${inr(pv)}</b>`, p1: esc(curText) })} · ${esc(t('noDataFor', { p: cmpText }))}`) : ''}</p>
  </div>`;

  // --- who spent
  const people = [...new Set([...store.activePersons().map((p) => p.Code), ...cur.byPerson.keys()])]
    .map((p) => [p, Math.max(0, cur.byPerson.get(p) || 0), Math.max(0, prev.byPerson.get(p) || 0)])
    .filter(([, a, b]) => a > 0 || b > 0).sort((a, b) => b[1] - a[1]);
  const pmax = Math.max(1, ...people.map((p) => p[1]));
  const whoCard = `<div class="card pad"><h3>${esc(t('whoSpentT'))}</h3>
    ${people.length ? people.map(([p, a, b]) => `<div class="prow">
      <div class="prow-top"><span>${esc(nm(store.findPerson(p)) || p)}</span><span><b>${inr(a)}</b> ${pctChip(a, b, false, has)}</span></div>
      <div class="pbar"><i style="width:${(a / pmax) * 100}%"></i></div></div>`).join('') : `<p class="muted empty-note">${esc(t('noSpending'))}</p>`}
  </div>`;

  // --- spent via
  const modes = [...cur.byMode].filter(([, v]) => v > 0.001).sort((a, b) => b[1] - a[1]);
  const mtot = modes.reduce((s, [, v]) => s + v, 0);
  const KNOWN = { UPI: '#3B82C4', CARD: '#7C5CC4', CASH: '#6B675F', BANK: '#0F766E' };
  const modeColor = (code) => KNOWN[code] || MODE_COLORS[(4 + Math.max(0, state.modes.findIndex((m) => m.Code === code))) % MODE_COLORS.length];
  const viaCard = `<div class="card pad"><h3>${esc(t('spentViaT'))}</h3>
    ${modes.length ? `<div class="hbar">${modes.map(([c, v]) => { const sh = (v / mtot) * 100; return `<span style="width:${sh}%;background:${modeColor(c)}" data-tip="${esc(`<b>${esc(nm(store.findMode(c)) || c)}</b><br>${inr(v)} · ${digits(Math.round(sh))}%`)}">${sh >= 14 ? esc(`${nm(store.findMode(c)) || c} ${digits(Math.round(sh))}%`) : ''}</span>`; }).join('')}</div>
    <div class="hbar-legend">${modes.map(([c, v]) => `<span><i style="background:${modeColor(c)}"></i>${esc(nm(store.findMode(c)) || c)} <b>${inr(v)}</b></span>`).join('')}</div>` : `<p class="muted empty-note">${esc(t('noSpending'))}</p>`}
  </div>`;

  // --- refunds
  const refCard = `<div class="card pad">
    <div class="card-head"><h3>${esc(t('refundsTitle'))}</h3><b class="amt-ref">${inr(cur.ref)}</b></div>
    ${cur.refunds.length ? cur.refunds.sort((a, b) => b.date - a.date).map((r) => {
    const o = state.entries.find((x) => x.id === r.linked);
    return `<div class="ref-item"><div><b>${esc(o ? entryTitle(o) : entryTitle(r))}</b> · ${esc(catName(r.cat))}<span class="muted small"> · ${esc(t('boughtReturned', { a: o ? dayMonth(o.date) : '—', b: dayMonth(r.date) }))}</span></div><b>${inr(r.amount)}</b></div>`;
  }).join('') + `<p class="muted small">${esc(t('refundCalc', { a: inr(cur.buy), b: inr(cur.ref), c: inr(cur.out) }))}</p>` : `<p class="muted empty-note">${esc(t('noRefunds'))}</p>`}
  </div>`;

  // --- income by source
  const srcs = [...cur.incBySrc].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const itot = srcs.reduce((s, [, v]) => s + v, 0);
  const incCard = `<div class="card pad"><h3>${esc(t('incomeBySource'))}</h3>
    ${srcs.length ? `<div class="hbar">${srcs.map(([c, v]) => { const sh = (v / itot) * 100; return `<span style="width:${sh}%;background:${catColor(c)}" data-tip="${esc(`<b>${esc(catName(c))}</b><br>${inr(v)} · ${digits(Math.round(sh))}%`)}">${sh >= 18 ? esc(`${catName(c)} ${digits(Math.round(sh))}%`) : ''}</span>`; }).join('')}</div>
    <div class="hbar-legend">${srcs.map(([c, v]) => `<span><i style="background:${catColor(c)}"></i>${esc(catName(c))} <b>${inr(v)}</b></span>`).join('')}</div>` : `<p class="muted empty-note">${esc(t('noIncome'))}</p>`}
  </div>`;

  return `${kpiPhone}${kpiDesk}
    <div class="dash-grid month-grid">
      <div class="g-donut">${donutCard}</div>
      <div class="g-pace">${paceCard}</div>
      <div class="g-cat">${catCard}</div>
      <div class="g-side">${whoCard}${viaCard}</div>
      <div class="g-inc">${incCard}</div>
      <div class="g-ref">${refCard}</div>
    </div>`;
}

function dayLabel(d) {
  if (state.lang === 'gu') return digits(d);
  const s = d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th';
  return d + s;
}

// ------------------------------------------------------------------ YEAR
function yearView() {
  const y = D.yy, cy = cmpYear();
  const upto = uptoFor(y);
  const cur = rangeAgg(y, upto), prev = rangeAgg(cy, upto);
  const has = prev.hasData;
  const curText = yLabel(y, upto), cmpText = yLabel(cy, upto);
  const months = yearMonths(y), cmpMonths = yearMonths(cy);
  const cmpFullHas = cmpMonths.some((x) => x.hasData);
  const withData = months.slice(0, upto + 1).filter((x) => x.hasData);
  const avg = withData.length ? cur.out / withData.length : 0;
  const pctInc = cur.inc > 0 ? Math.round((cur.saved / cur.inc) * 100) : null;
  const periodTag = upto === 11 ? '' : ` · ${monthShort(0)}–${monthShort(upto)}`;

  const kpis = `<div class="kpis year-kpis">
    <div class="card kpi"><span class="k">${esc(t('moneyIn') + periodTag)}</span><b class="v amt-in">${inr(cur.inc)}</b>${changeLine(cur.inc, prev.inc, true, has, cmpText, { percent: false })}</div>
    <div class="card kpi"><span class="k">${esc(t('moneyOut') + periodTag)}</span><b class="v">${inr(cur.out)}</b>${withData.length ? `<span class="chg flat only-desk">${esc(t('avgMonth', { a: inr(Math.round(avg)) }))}</span>` : ''}${changeLine(cur.out, prev.out, false, has, cmpText)}</div>
    <div class="card kpi dark"><span class="k">${esc(pctInc === null ? t('savedShort') : t('savedPctIncome', { p: digits(pctInc) }))}</span><b class="v">${inrNet(cur.saved)}</b>${changeLine(cur.saved, prev.saved, true, has, cmpText, { percent: false })}</div>
    <div class="card kpi"><span class="k">${esc(upto === 11 ? t('spentIn', { p: digits(cy) }) : t('spentSame', { y: digits(cy) }))}</span><b class="v">${has ? inr(prev.out) : '—'}</b>${has ? changeLine(cur.out, prev.out, false, true, cmpText, { amount: false, suffix: t('inPeriod', { p: digits(y) }) }) : `<span class="chg none">${esc(t('noDataFor', { p: cmpText }))}</span>`}</div>
  </div>`;

  const mlabels = (w, n) => {
    const slot = w / n;
    if (slot >= 38) return Array.from({ length: n }, (_, i) => ({ i, text: monthShort(i) }));
    if (state.lang === 'gu') return [0, 3, 6, 9].map((i) => ({ i, text: monthShort(i) }));
    return Array.from({ length: n }, (_, i) => ({ i, text: monthShort(i)[0] }));
  };
  const mtip = (i, lines) => `<b>${esc(monthName(i))}</b>${lines.map(([k, v]) => `<br>${esc(k)}: ${v}`).join('')}`;

  // in vs out per month
  const inV = months.map((x, i) => (i <= upto && x.hasData ? x.inc : null));
  const outV = months.map((x, i) => (i <= upto && x.hasData ? Math.max(0, x.out) : null));
  charts.push({ id: 'inout', build: (w) => barChart({ w, h: 200, n: 12, groups: [{ color: COLORS.IN, values: inV }, { color: COLORS.OUT, values: outV }], xLabels: mlabels(w, 12), yFmt: inrShort,
    tip: (i) => (inV[i] === null ? `<b>${esc(monthName(i))}</b><br>—` : mtip(i, [[t('inShort'), inr(inV[i])], [t('outShort'), inr(outV[i])], [t('savedShort'), inrNet(inV[i] - outV[i])]])) }) });

  // spending line
  const curLine = months.map((x, i) => (i <= upto && x.hasData ? Math.max(0, x.out) : null));
  const cmpLine = cmpMonths.map((x) => (x.hasData ? Math.max(0, x.out) : null));
  charts.push({ id: 'yline', build: (w) => lineChart({ w, h: 200, n: 12,
    series: [{ values: cmpLine, color: COLORS.CMP, dashed: true }, { values: curLine, color: COLORS.TEAL }],
    xLabels: [{ i: 0, text: monthShort(0) }, { i: 5, text: monthShort(5) }, { i: 11, text: monthShort(11) }], yFmt: inrShort,
    tip: (i) => mtip(i, [[digits(y), curLine[i] === null ? '—' : inr(curLine[i])], [digits(cy), cmpLine[i] === null ? '—' : inr(cmpLine[i])]]) }) });

  // stacked by category
  const allCats = new Map();
  months.forEach((x) => x.byCat.forEach((v, c) => { if (v > 0) allCats.set(c, (allCats.get(c) || 0) + v); }));
  const stackCats = [...allCats.keys()].sort((a, b) => {
    const sa = store.findCat(a)?.SortOrder ?? 99, sb = store.findCat(b)?.SortOrder ?? 99;
    return (a === 'OTHER') - (b === 'OTHER') || sa - sb;
  });
  charts.push({ id: 'stack', build: (w) => barChart({ w, h: 210, n: 12, stacked: true,
    groups: stackCats.map((c) => ({ color: catColor(c), values: months.map((x) => Math.max(0, x.byCat.get(c) || 0)) })),
    xLabels: mlabels(w, 12), yFmt: inrShort,
    tip: (i) => mtip(i, stackCats.filter((c) => (months[i].byCat.get(c) || 0) > 0).map((c) => [catName(c), inr(months[i].byCat.get(c))])) || '' }) });

  // year totals
  const totals = sortedCats(cur.byCat);
  // Highest / lowest: leave out the month that is still running (it would always look "lowest").
  const complete = withData.filter((x) => !(y === NOW.y && months.indexOf(x) === NOW.m));
  const pool = complete.length ? complete : withData;
  const hi = pool.length ? pool.reduce((a, b) => (b.out > a.out ? b : a)) : null;
  const lo = pool.length ? pool.reduce((a, b) => (b.out < a.out ? b : a)) : null;
  const mIndex = (agg) => months.indexOf(agg);

  return `${kpis}
    <div class="dash-grid year-grid">
      <div class="g-a card pad"><div class="card-head"><h3><span class="only-desk">${esc(t('inVsOut'))}</span><span class="only-phone">${esc(t('inVsOutShort'))}</span></h3>
        <div class="legend">${legendSq(COLORS.IN, t('inShort'))}${legendSq(COLORS.OUT, t('outShort'))}</div></div><div id="inout" class="chart-box"></div></div>
      <div class="g-b card pad"><div class="card-head"><h3>${esc(t('spendingVs', { a: digits(y), b: digits(cy) }))}</h3>
        <div class="legend">${legendLine(COLORS.TEAL, digits(y))}${cmpFullHas ? legendLine(COLORS.CMP, digits(cy), true) : ''}</div></div>
        ${cmpFullHas ? '' : `<p class="muted small no-data">${esc(t('noDataFor', { p: digits(cy) }))}</p>`}
        <div id="yline" class="chart-box"></div></div>
      <div class="g-c card pad"><h3>${esc(t('eachMonthByCat'))}</h3><div id="stack" class="chart-box"></div>
        <div class="hbar-legend">${stackCats.map((c) => `<span><i style="background:${catColor(c)}"></i>${esc(catName(c))}</span>`).join('')}</div></div>
      <div class="g-d card pad"><div class="card-head"><h3>${esc(t('yearTotals'))}</h3><span class="muted small">${esc(t('vs', { p: cmpText }))}</span></div>
        ${has ? '' : `<p class="muted small no-data">${esc(t('noDataFor', { p: cmpText }))}</p>`}
        ${totals.length ? `<ul class="totals">${totals.map(([c, v]) => `<li><i style="background:${catColor(c)}"></i><span>${esc(catName(c))}</span>${pctChip(v, Math.max(0, prev.byCat.get(c) || 0), false, has)}<b>${inr(v)}</b></li>`).join('')}</ul>` : `<p class="muted empty-note">${esc(t('noSpending'))}</p>`}
        ${hi ? `<div class="hilo"><div><span>${esc(t('highest'))}</span><b>${esc(monthShort(mIndex(hi)))} · ${inr(hi.out)}</b></div><div><span>${esc(t('lowest'))}</span><b>${esc(monthShort(mIndex(lo)))} · ${inr(lo.out)}</b></div></div>` : ''}
      </div>
    </div>`;
}

// ------------------------------------------------------------------ events
function bind() {
  const page = root.querySelector('.page-dash');
  page.addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.tab) { D.tab = b.dataset.tab; return draw(); }
    if (b.dataset.step) {
      const s = Number(b.dataset.step);
      if (D.tab === 'month') {
        const d = new Date(Date.UTC(D.y, D.m + s, 1));
        D.y = d.getUTCFullYear(); D.m = d.getUTCMonth(); D.cmp = null;
      } else { D.yy += s; D.cmpYear = null; }
      return draw();
    }
    if ('cmp' in b.dataset) return openCompare();
  });
  // hover / tap tooltips on HTML rows and bars
  page.querySelectorAll('[data-tip]').forEach((el) => {
    const show = (ev) => showTip(el.dataset.tip, ev.clientX, ev.clientY - 6);
    el.addEventListener('pointermove', show); el.addEventListener('pointerdown', show);
    el.addEventListener('pointerleave', hideTip);
  });
}

function openCompare() {
  const month = D.tab === 'month';
  const years = dataYears();
  const ys = [];
  for (let yr = Math.min(years[0], NOW.y) - 2; yr <= NOW.y; yr++) ys.push(yr);
  const c = month ? cmpMonth() : { y: cmpYear() };
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
    <h3>${esc(t('compareWith'))}</h3>
    <p class="muted small">${esc(month ? t('cmpHelpMonth', { p: mLabel(D.y, D.m) }) : t('cmpHelpYear', { p: digits(D.yy) }))}</p>
    <div class="cmp-selects">
      ${month ? `<label class="fld"><span>${esc(t('month'))}</span><select id="cm-m">${Array.from({ length: 12 }, (_, i) => `<option value="${i}" ${i === c.m ? 'selected' : ''}>${esc(monthName(i))}</option>`).join('')}</select></label>` : ''}
      <label class="fld"><span>${esc(t('year'))}</span><select id="cm-y">${ys.map((yr) => `<option value="${yr}" ${yr === c.y ? 'selected' : ''}>${digits(yr)}</option>`).join('')}</select></label>
    </div>
    <button class="btn ghost block" data-a="default">${esc(t('lastYearDefault'))}</button>
    <div class="modal-actions">
      <button class="btn ghost" data-a="no">${esc(t('cancel'))}</button>
      <button class="btn primary" data-a="yes">${esc(t('apply'))}</button>
    </div></div>`;
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('show'));
  const close = () => { wrap.classList.remove('show'); setTimeout(() => wrap.remove(), 200); };
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) return close();
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (!a) return;
    if (a === 'default') { if (month) D.cmp = null; else D.cmpYear = null; }
    if (a === 'yes') {
      const yr = Number(wrap.querySelector('#cm-y').value);
      if (month) {
        const m = Number(wrap.querySelector('#cm-m').value);
        D.cmp = yr === D.y - 1 && m === D.m ? null : { y: yr, m };
      } else D.cmpYear = yr === D.yy - 1 ? null : yr;
    }
    close();
    if (a !== 'no') draw();
  });
}
