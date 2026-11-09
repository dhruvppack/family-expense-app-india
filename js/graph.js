// Reading and writing the Excel tables through Microsoft Graph (Excel API).
import { CONFIG } from './config.js';
import { getToken } from './auth.js';

const GRAPH = 'https://graph.microsoft.com/v1.0';
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');
const itemPath = () => `${GRAPH}/drives/${CONFIG.driveId}/root:/${enc(CONFIG.folderPath + '/' + CONFIG.workbookName)}:`;
const wb = () => `${itemPath()}/workbook`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, url, body, attempt = 0) {
  const token = await getToken(attempt > 0 && attempt === 1);
  const res = await fetch(url, {
    method,
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.ok) return res.status === 204 ? null : res.json();
  let msg = res.status + ' ' + res.statusText, code = '';
  try { const j = await res.json(); msg = j.error?.message || msg; code = j.error?.code || ''; } catch { /* ignore */ }
  // Retry on expired token once, and on throttling / busy file / Excel Online warming up a few times.
  if (res.status === 401 && attempt === 0) return call(method, url, body, 1);
  const transient = [409, 429, 500, 502, 503, 504].includes(res.status) || /WAC access token/i.test(msg);
  if (transient && attempt < 4) {
    const wait = Number(res.headers.get('Retry-After')) * 1000 || 1000 * (attempt + 1) ** 2;
    await sleep(wait);
    return call(method, url, body, attempt + 1);
  }
  const err = new Error(msg); err.status = res.status; err.code = code;
  throw err;
}

function colLetter(n) { // 1 -> A
  let s = '';
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/**
 * Reads a whole table. Returns { headers, rows (array of objects), sheet, firstDataRow, lastCol }.
 * rows[i]._i is the 0-based position of the row inside the table.
 */
export async function readTable(name) {
  let r;
  try {
    r = await call('GET', `${wb()}/tables/${name}/range?$select=address,values`);
  } catch (e) {
    if (e.status !== 400) throw e;
    r = await call('GET', `${wb()}/tables/${name}/range`);
  }
  // address like  Entries!A1:K25  or  'My Sheet'!A1:K25
  const m = /^(?:'?(.*?)'?)!([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(r.address);
  const [headers, ...data] = r.values;
  const rows = data.map((vals, i) => {
    const o = { _i: i };
    headers.forEach((h, c) => { o[h] = vals[c]; });
    return o;
  });
  return { name, headers, rows, sheet: m[1], firstDataRow: Number(m[3]) + 1, firstCol: m[2], lastCol: m[4] };
}

function toValues(table, obj) {
  return table.headers.map((h) => (obj[h] === undefined || obj[h] === null ? '' : obj[h]));
}

/** Appends a row. If the table still has its empty placeholder row, that row is filled instead. */
export async function addRow(name, obj) {
  const table = await readTable(name);
  const firstKey = table.headers[0];
  const blank = table.rows.find((r) => r[firstKey] === '' || r[firstKey] === null);
  if (blank) return patchRow(table, blank._i, obj);
  await call('POST', `${wb()}/tables/${name}/rows/add`, { index: null, values: [toValues(table, obj)] });
}

/** Finds the row whose first column (the ID/Code) equals key, and overwrites it with obj. */
export async function updateRowByKey(name, key, obj) {
  const table = await readTable(name);
  const firstKey = table.headers[0];
  const row = table.rows.find((r) => String(r[firstKey]) === String(key));
  if (!row) throw new Error(`Row ${key} not found in ${name}`);
  return patchRow(table, row._i, { ...row, ...obj });
}

async function patchRow(table, i, obj) {
  const r = table.firstDataRow + i;
  const addr = `${table.firstCol}${r}:${table.lastCol}${r}`;
  await call('PATCH', `${wb()}/worksheets/${encodeURIComponent(table.sheet)}/range(address='${addr}')`, {
    values: [toValues(table, obj)],
  });
}

export async function fileWebUrl() {
  const r = await call('GET', `${itemPath()}?$select=webUrl`);
  return r.webUrl;
}

export { colLetter };
