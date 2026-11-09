// Small hand-made SVG charts, drawn at the exact pixel width of their box.
// Every mark carries data-tip (shown on hover / tap).
import { esc } from './format.js';

const INK = '#1C1A17', MUTED = '#8C8880', GRID = '#ECE9E3', CMP = '#A8A49D';

/** Rounds a max value up to a "nice" axis maximum and returns [max, step]. */
function niceScale(max, ticks = 3) {
  if (max <= 0) return [1, 1];
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((x) => x * mag).find((s) => s >= raw);
  return [Math.ceil(max / step) * step, step];
}

/**
 * Line chart. series: [{ values: (number|null)[], color, dashed, name }]
 * xLabels: [{ i, text }]. tip(i) -> html string for the crosshair tooltip.
 */
export function lineChart({ w, h = 210, n, series, xLabels, yFmt, tip }) {
  const padL = 46, padR = 10, padT = 12, padB = 26;
  const iw = Math.max(10, w - padL - padR), ih = h - padT - padB;
  const all = series.flatMap((s) => s.values.filter((v) => v !== null && v !== undefined));
  const [ymax, step] = niceScale(Math.max(1, ...all));
  const x = (i) => padL + (n <= 1 ? 0 : (i / (n - 1)) * iw);
  const y = (v) => padT + ih - (v / ymax) * ih;
  let g = '';
  for (let v = step; v <= ymax + 0.001; v += step) {
    g += `<line x1="${padL}" x2="${w - padR}" y1="${y(v)}" y2="${y(v)}" stroke="${GRID}"/><text x="${padL - 8}" y="${y(v) + 4}" text-anchor="end" class="ax">${esc(yFmt(v))}</text>`;
  }
  g += `<line x1="${padL}" x2="${w - padR}" y1="${y(0)}" y2="${y(0)}" stroke="#DAD6CE"/>`;
  for (const l of xLabels) g += `<text x="${x(l.i)}" y="${h - 6}" text-anchor="${l.i === 0 ? 'start' : l.i === n - 1 ? 'end' : 'middle'}" class="ax">${esc(l.text)}</text>`;
  // draw comparison (dashed) first so the main line sits on top
  for (const s of [...series].sort((a, b) => (b.dashed ? 1 : 0) - (a.dashed ? 1 : 0))) {
    let d = '', pen = false;
    s.values.forEach((v, i) => {
      if (v === null || v === undefined) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`; pen = true;
    });
    if (d) g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.dashed ? 1.8 : 2.4}" ${s.dashed ? 'stroke-dasharray="5 4"' : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  g += `<line class="xhair" x1="0" x2="0" y1="${padT}" y2="${padT + ih}" stroke="#BDB8AF" stroke-dasharray="3 3" style="display:none"/>`;
  g += series.map((s, k) => `<circle class="xdot" data-k="${k}" r="4.5" fill="${s.dashed ? '#fff' : s.color}" stroke="${s.color}" stroke-width="2" style="display:none"/>`).join('');
  const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="chart-svg" role="img">${g}<rect class="hit" x="${padL}" y="${padT}" width="${iw}" height="${ih}" fill="transparent"/></svg>`;
  return {
    svg,
    bind(box) {
      const svgEl = box.querySelector('svg'), hit = box.querySelector('.hit');
      const xh = box.querySelector('.xhair'), dots = box.querySelectorAll('.xdot');
      const move = (ev) => {
        const r = svgEl.getBoundingClientRect();
        const px = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
        const i = Math.max(0, Math.min(n - 1, Math.round(((px - padL) / iw) * (n - 1))));
        xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.style.display = '';
        dots.forEach((dot) => {
          const v = series[dot.dataset.k].values[i];
          if (v === null || v === undefined) { dot.style.display = 'none'; return; }
          dot.setAttribute('cx', x(i)); dot.setAttribute('cy', y(v)); dot.style.display = '';
        });
        showTip(tip(i), r.left + x(i), r.top + padT);
      };
      const leave = () => { xh.style.display = 'none'; dots.forEach((d) => { d.style.display = 'none'; }); hideTip(); };
      hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
      hit.addEventListener('pointerleave', leave);
    },
  };
}

/**
 * Bars per month. groups: [{ color, values: (number|null)[], name }] side by side,
 * or stacked: [{ color, values }] drawn bottom-up. tip(i) -> html.
 */
export function barChart({ w, h = 210, n, groups, stacked = false, xLabels, yFmt, tip, showAxis = false }) {
  const padL = showAxis ? 46 : 4, padR = 4, padT = 10, padB = 24;
  const iw = w - padL - padR, ih = h - padT - padB;
  const totals = Array.from({ length: n }, (_, i) => (stacked
    ? groups.reduce((s, gr) => s + Math.max(0, gr.values[i] || 0), 0)
    : Math.max(0, ...groups.map((gr) => gr.values[i] || 0))));
  const [ymax, step] = niceScale(Math.max(1, ...totals));
  const slot = iw / n;
  const y = (v) => padT + ih - (v / ymax) * ih;
  let g = '';
  if (showAxis) for (let v = step; v <= ymax + 0.001; v += step) g += `<line x1="${padL}" x2="${w - padR}" y1="${y(v)}" y2="${y(v)}" stroke="${GRID}"/><text x="${padL - 8}" y="${y(v) + 4}" text-anchor="end" class="ax">${esc(yFmt(v))}</text>`;
  g += `<line x1="${padL}" x2="${w - padR}" y1="${y(0)}" y2="${y(0)}" stroke="#DAD6CE"/>`;
  for (let i = 0; i < n; i++) {
    const cx = padL + slot * i + slot / 2;
    if (stacked) {
      const bw = Math.min(34, slot * 0.66);
      let base = 0;
      const segs = groups.map((gr) => ({ color: gr.color, v: Math.max(0, gr.values[i] || 0) })).filter((s) => s.v > 0);
      segs.forEach((s, k) => {
        const y0 = y(base), y1 = y(base + s.v);
        const top = k === segs.length - 1;
        const hgt = Math.max(0, y0 - y1 - (top ? 0 : 1.5));
        g += top
          ? `<path d="${roundTop(cx - bw / 2, y1, bw, hgt, 3)}" fill="${s.color}"/>`
          : `<rect x="${cx - bw / 2}" y="${y1 + 1.5}" width="${bw}" height="${hgt}" fill="${s.color}"/>`;
        base += s.v;
      });
    } else {
      const gap = 3, k = groups.length;
      const bw = Math.min(18, (slot * 0.72 - gap * (k - 1)) / k);
      const start = cx - (bw * k + gap * (k - 1)) / 2;
      groups.forEach((gr, j) => {
        const v = gr.values[i];
        if (v === null || v === undefined || v <= 0) return;
        g += `<path d="${roundTop(start + j * (bw + gap), y(v), bw, y(0) - y(v), 3)}" fill="${gr.color}"/>`;
      });
    }
    g += `<rect class="bhit" data-i="${i}" x="${padL + slot * i}" y="${padT}" width="${slot}" height="${ih}" fill="transparent"/>`;
  }
  for (const l of xLabels) g += `<text x="${padL + slot * l.i + slot / 2}" y="${h - 6}" text-anchor="middle" class="ax">${esc(l.text)}</text>`;
  return {
    svg: `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="chart-svg" role="img">${g}</svg>`,
    bind(box) {
      box.querySelectorAll('.bhit').forEach((r) => {
        const show = () => { const b = r.getBoundingClientRect(); showTip(tip(Number(r.dataset.i)), b.left + b.width / 2, b.top + 10); r.setAttribute('fill', 'rgba(0,0,0,.04)'); };
        r.addEventListener('pointerenter', show); r.addEventListener('pointerdown', show);
        r.addEventListener('pointerleave', () => { hideTip(); r.setAttribute('fill', 'transparent'); });
      });
    },
  };
}

function roundTop(x, y, w, h, r) {
  if (h <= 0) return '';
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/** Donut. segs: [{ value, color, tip }] */
export function donut({ size = 170, segs, center }) {
  const total = segs.reduce((s, x) => s + x.value, 0);
  const R = size / 2, r = R * 0.6, cx = R, cy = R;
  let a = -Math.PI / 2, paths = '';
  const gapA = segs.length > 1 ? 0.012 : 0;
  segs.forEach((s, k) => {
    const sweep = (s.value / total) * Math.PI * 2;
    const a0 = a + gapA, a1 = a + sweep - gapA;
    a += sweep;
    if (a1 <= a0) return;
    const p = (ang, rad) => `${(cx + rad * Math.cos(ang)).toFixed(2)},${(cy + rad * Math.sin(ang)).toFixed(2)}`;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const d = segs.length === 1
      ? `M${cx},${cy - R}A${R},${R} 0 1 1 ${cx - 0.01},${cy - R}Z M${cx},${cy - r}A${r},${r} 0 1 0 ${cx + 0.01},${cy - r}Z`
      : `M${p(a0, R)}A${R},${R} 0 ${large} 1 ${p(a1, R)}L${p(a1, r)}A${r},${r} 0 ${large} 0 ${p(a0, r)}Z`;
    paths += `<path d="${d}" fill="${s.color}" fill-rule="evenodd" data-k="${k}" class="seg"/>`;
  });
  return {
    svg: `<div class="donut" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${paths}</svg><div class="donut-c">${center}</div></div>`,
    bind(box) {
      box.querySelectorAll('.seg').forEach((p) => {
        const show = (ev) => showTip(segs[p.dataset.k].tip, ev.clientX, ev.clientY - 8);
        p.addEventListener('pointermove', show); p.addEventListener('pointerdown', show);
        p.addEventListener('pointerleave', hideTip);
      });
    },
  };
}

// ---- tooltip ----
let tipEl = null;
export function showTip(html, x, y) {
  if (!html) return;
  if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'ctip'; document.body.appendChild(tipEl); }
  tipEl.innerHTML = html;
  tipEl.style.display = 'block';
  const r = tipEl.getBoundingClientRect();
  const left = Math.max(8, Math.min(window.innerWidth - r.width - 8, x - r.width / 2));
  const top = y - r.height - 10 < 8 ? y + 18 : y - r.height - 10;
  tipEl.style.left = left + 'px'; tipEl.style.top = top + 'px';
}
export function hideTip() { if (tipEl) tipEl.style.display = 'none'; }
document.addEventListener('scroll', hideTip, { passive: true });

export const COLORS = { INK, MUTED, CMP, IN: '#3474B8', OUT: INK, TEAL: '#0F766E' };
