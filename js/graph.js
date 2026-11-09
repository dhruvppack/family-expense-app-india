// Reading and writing the Excel tables through Microsoft Graph (Excel API).
//
// The file is found once by its folder path (so it keeps working if it is ever
// re-uploaded with the same name), then all Excel calls use the file's ID and a
// workbook session, which is what Microsoft recommends for the Excel API.
import { CONFIG } from './config.js';
import { getToken } from './auth.js';

const GRAPH = 'https://graph.microsoft.com/v1.0';
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');
const pathUrl = () => `${GRAPH}/drives/${CONFIG.driveId}/root:/${enc(CONFIG.folderPath + '/' + CONFIG.workbookName)}:`;

let item = null;          // { id, webUrl }
let session = null;       // { id, last } — Excel workbook session
const SESSION_IDLE_MS = 4 * 60 * 1000; // Excel drops idle sessions after ~5 minutes

const wb = () => `${GRAPH}/drives/${CONFIG.driveId}/items/${item.id}/workbook`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, url, body, { attempt = 0, useSession = true, step = '' } = {}) {
  const token = await getToken(attempt === 1);
  const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  if (useSession && session) headers['workbook-session-id'] = session.id;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.ok) {
    if (useSession && session) session.last = Date.now();
    return res.status === 204 ? null : res.json();
  }
  let msg = res.status + ' ' + res.statusText, code = '', inner = '';
  try {
    const j = await res.json();
    msg = j.error?.message || msg; code = j.error?.code || '';
    inner = j.error?.innerError?.code || '';
  } catch { /* ignore */ }
  const next = { useSession, step, attempt: attempt + 1 };

  // Token expired: refresh once.
  if (res.status === 401 && attempt === 0) return call(method, url, body, next);
  // Session expired: open a new one and repeat.
  if (useSession && session && (/session/i.test(code + inner + msg)) && attempt < 2) {
    session = null;
    await openSession();
    return call(method, url, body, next);
  }
  // Busy / throttled / Excel Online warming up: wait and repeat a few times.
  const transient = [409, 429, 500, 502, 503, 504].includes(res.status) || /WAC access token/i.test(msg);
  if (transient && attempt < 3) {
    await sleep(Number(res.headers.get('Retry-After')) * 1000 || 1200 * (attempt + 1) ** 2);
    return call(method, url, body, next);
  }
  const reqId = res.headers.get('request-id') || res.headers.get('client-request-id') || '';
  const err = new Error(msg);
  Object.assign(err, { status: res.status, code, step, detail: `${step || method} · ${res.status} ${code}${inner ? '/' + inner : ''}${reqId ? ' · ' + reqId : ''}` });
  throw err;
}

/** Finds the workbook (by path) and remembers its ID and web link. */
export async function resolveFile() {
  if (item) return item;
  const r = await call('GET', `${pathUrl()}?$select=id,webUrl,name`, null, { useSession: false, step: 'find file' });
  item = { id: r.id, webUrl: r.webUrl };
  return item;
}

async function openSession() {
  await resolveFile();
  try {
    const r = await call('POST', `${wb()}/createSession`, { persistChanges: true }, { useSession: false, step: 'open workbook' });
    session = { id: r.id, last: Date.now() };
  } catch (e) {
    // Sessions are optional; carry on without one.
    console.warn('Excel session not available, continuing without:', e.message);
    session = null;
  }
}

async function ensureSession() {
  await resolveFile();
  if (!session || Date.now() - session.last > SESSION_IDLE_MS) await openSession();
}

/**
 * Reads a whole table. Returns { headers, rows (array of objects), sheet, firstDataRow, firstCol, lastCol }.
 * rows[i]._i is the 0-based position of the row inside the table.
 */
export async function readTable(name) {
  await ensureSession();
  let r;
  try {
    r = await call('GET', `${wb()}/tables/${name}/range?$select=address,values`, null, { step: 'read ' + name });
  } catch (e) {
    if (e.status !== 400) throw e;
    r = await call('GET', `${wb()}/tables/${name}/range`, null, { step: 'read ' + name });
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
  await call('POST', `${wb()}/tables/${name}/rows/add`, { index: null, values: [toValues(table, obj)] }, { step: 'add to ' + name });
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
  await call('PATCH', `${wb()}/worksheets/${encodeURIComponent(table.sheet)}/range(address='${addr}')`,
    { values: [toValues(table, obj)] }, { step: 'save to ' + table.name });
}

export async function fileWebUrl() {
  return (await resolveFile()).webUrl;
}
