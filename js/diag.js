// Connection test page (open the app with ?diag). Tries several ways of reaching the
// Excel workbook through Microsoft Graph and shows which work. Read-only: nothing is changed.
import { CONFIG } from './config.js';
import { getToken } from './auth.js';
import { state } from './state.js';
import { esc } from './format.js';

const G = 'https://graph.microsoft.com/v1.0';
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');
const byPath = `${G}/drives/${CONFIG.driveId}/root:/${enc(CONFIG.folderPath + '/' + CONFIG.workbookName)}:`;

async function req(method, url, body, headers = {}) {
  const token = await getToken();
  const t0 = performance.now();
  try {
    const r = await fetch(url, { method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });
    let j = null; try { j = await r.json(); } catch { /* empty */ }
    return { ok: r.ok, status: r.status, ms: Math.round(performance.now() - t0), json: j,
      msg: r.ok ? '' : `${j?.error?.code || ''} ${j?.error?.message || r.statusText}`.trim(),
      reqId: r.headers.get('request-id') || j?.error?.innerError?.['request-id'] || '' };
  } catch (e) {
    return { ok: false, status: 0, ms: 0, msg: 'Network: ' + e.message };
  }
}

function claims(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch { return {}; }
}

export async function runDiag(el) {
  el.innerHTML = `<div class="page"><header class="phead"><h1>Connection test</h1></header><div class="card pad" id="dg"><p class="muted">Running…</p></div></div>`;
  const out = [];
  const add = (name, r, note = '') => out.push({ name, ...r, note });
  const tok = claims(await getToken());
  const info = `Account: ${tok.upn || tok.preferred_username || state.account?.username}\nScopes: ${tok.scp}\nApp: ${tok.appid || tok.azp}\nTenant: ${tok.tid}\nCapabilities: ${tok.xms_cc || '-'}`;

  const meta = await req('GET', `${byPath}?$select=id,name,size,webUrl,file`);
  add('1. File details (by path)', meta);
  const itemId = meta.json?.id || '01OSQ5NINFABEB5BPXQREKPB7Z3LWEVPBJ';
  const byId = `${G}/drives/${CONFIG.driveId}/items/${itemId}`;

  add('2. Workbook sheets (by path)', await req('GET', `${byPath}/workbook/worksheets?$select=name`));
  add('3. Workbook sheets (by ID)', await req('GET', `${byId}/workbook/worksheets?$select=name`));
  add('4. Entries table (by ID)', await req('GET', `${byId}/workbook/tables/Entries/range?$select=address`));

  const s1 = await req('POST', `${byId}/workbook/createSession`, { persistChanges: true });
  add('5. Open edit session', s1);
  if (s1.ok && s1.json?.id) {
    add('6. Sheets inside session', await req('GET', `${byId}/workbook/worksheets?$select=name`, null, { 'workbook-session-id': s1.json.id }));
    await req('POST', `${byId}/workbook/closeSession`, null, { 'workbook-session-id': s1.json.id });
  }
  const s2 = await req('POST', `${byId}/workbook/createSession`, { persistChanges: false });
  add('7. Open read-only session', s2);
  if (s2.ok && s2.json?.id) await req('POST', `${byId}/workbook/closeSession`, null, { 'workbook-session-id': s2.json.id });

  // A workbook in the account's own OneDrive (helps tell "this file" from "this account").
  const mine = await req('GET', `${G}/me/drive/root/search(q='.xlsx')?$select=id,name&$top=1`);
  if (mine.ok && mine.json?.value?.length) {
    const f = mine.json.value[0];
    add(`8. Another Excel file in own OneDrive ("${f.name}")`, await req('GET', `${G}/me/drive/items/${f.id}/workbook/worksheets?$select=name`));
  } else add('8. Another Excel file in own OneDrive', mine, mine.ok ? 'no .xlsx found' : '');

  document.getElementById('dg').innerHTML = `
    <pre class="diag-pre">${esc(info)}\nTime: ${new Date().toISOString()}</pre>
    <table class="etable diag"><tbody>
      ${out.map((r) => `<tr><td>${r.ok ? '✅' : '❌'}</td><td><b>${esc(r.name)}</b><br><span class="muted small">${r.status} · ${r.ms} ms ${esc(r.note)}</span>
        ${r.msg ? `<br><span class="small" style="color:#B42318">${esc(r.msg)}</span>` : ''}${!r.ok && r.reqId ? `<br><span class="muted small">request-id ${esc(r.reqId)}</span>` : ''}</td></tr>`).join('')}
    </tbody></table>
    <p class="muted small">Take a screenshot of this whole page and send it to Claude.</p>`;
}
