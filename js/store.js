// Data layer: loads the four Excel tables, and saves entries / lookups.
// In demo mode (?demo in the address) everything stays in memory.
import { state } from './state.js';
import * as graph from './graph.js';
import { demoData } from './demo.js';
import { nowSerial } from './format.js';

const truthy = (v) => v === true || String(v).toUpperCase() === 'TRUE' || v === 1;
const num = (v) => (typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.\-]/g, '')) || 0);

function normEntry(r) {
  return {
    id: String(r.EntryID),
    date: Math.floor(num(r.Date)),
    type: String(r.Type || '').trim(),
    amount: num(r.Amount),
    cat: String(r.CategoryCode || ''),
    person: String(r.Person || ''),
    mode: String(r.PaymentMode || ''),
    note: String(r.Note || ''),
    linked: String(r.LinkedEntryID || ''),
    created: num(r.CreatedOn),
    deleted: truthy(r.IsDeleted),
  };
}
function toRow(e) {
  return {
    EntryID: e.id, Date: e.date, Type: e.type, Amount: e.amount, CategoryCode: e.cat,
    Person: e.type === 'Income' ? '' : e.person, PaymentMode: e.mode, Note: e.note,
    LinkedEntryID: e.linked || '', CreatedOn: e.created, IsDeleted: !!e.deleted,
  };
}
function normLookup(r) {
  return { ...r, Code: String(r.Code), NameEN: String(r.NameEN || ''), NameGU: String(r.NameGU || ''), Active: r.Active === '' ? true : truthy(r.Active), SortOrder: num(r.SortOrder) };
}

let demo = null;

export async function loadAll() {
  if (state.demo) {
    demo = demo || demoData();
    Object.assign(state, {
      categories: demo.categories, persons: demo.persons, modes: demo.modes,
      entries: demo.entries, fileUrl: '#', lastSync: Date.now(),
    });
    return;
  }
  // 1) Can this account see the file at all? (clear message if not)
  if (!state.fileUrl) {
    try {
      state.fileUrl = await graph.fileWebUrl();
    } catch (err) {
      if ([401, 403, 404].includes(err.status)) {
        const e2 = new Error(`NOACCESS: ${err.status} ${err.message}`); e2.noAccess = true; throw e2;
      }
      throw err;
    }
  }
  // 2) Open the workbook with one request first (Excel Online warms up), then read the rest together.
  const e = await graph.readTable('Entries');
  const [c, p, m] = await Promise.all(['Categories', 'Persons', 'PaymentModes'].map(graph.readTable));
  state.entries = e.rows.filter((r) => r.EntryID !== '' && r.EntryID !== null).map(normEntry);
  state.categories = c.rows.filter((r) => r.Code).map(normLookup);
  state.persons = p.rows.filter((r) => r.Code).map(normLookup);
  state.modes = m.rows.filter((r) => r.Code).map(normLookup);
  state.lastSync = Date.now();
}

export function newId() {
  const d = new Date();
  const p = (n, l = 2) => String(n).padStart(l, '0');
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `E${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${rnd}`;
}

export async function addEntry(e) {
  const entry = { ...e, id: newId(), created: nowSerial(), deleted: false };
  if (!state.demo) await graph.addRow('Entries', toRow(entry));
  state.entries.push(entry);
  state.lastSync = Date.now();
  return entry;
}

export async function updateEntry(e) {
  if (!state.demo) await graph.updateRowByKey('Entries', e.id, toRow(e));
  const i = state.entries.findIndex((x) => x.id === e.id);
  if (i >= 0) state.entries[i] = { ...e };
  state.lastSync = Date.now();
}

/** Soft delete: sets IsDeleted = TRUE. Linked refunds of a deleted purchase are soft-deleted too. */
export async function softDelete(id) {
  const targets = [id, ...state.entries.filter((x) => x.linked === id && !x.deleted).map((x) => x.id)];
  for (const tid of targets) {
    const e = state.entries.find((x) => x.id === tid);
    if (!e) continue;
    await updateEntry({ ...e, deleted: true });
  }
}

const TABLE_FOR = { categories: 'Categories', persons: 'Persons', modes: 'PaymentModes' };
const PALETTE = ['#0F766E', '#3B82C4', '#D97706', '#C2557A', '#7C5CC4', '#5FA39B', '#8B7B4B', '#A8A29E', '#B45309', '#2F855A', '#9F7AEA', '#E07A5F'];

/** Adds a category / income source / person / payment mode. Returns the new code. */
export async function addLookup(kind, { NameEN, NameGU, catKind }) {
  const list = state[kind];
  let base = NameEN.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'ITEM';
  let code = base, n = 2;
  while (list.some((x) => x.Code === code)) code = base + n++;
  const row = { Code: code, NameEN, NameGU: NameGU || '', Active: true };
  if (kind === 'categories') {
    const same = list.filter((x) => x.Kind === catKind);
    const used = new Set(list.map((x) => x.Colour));
    row.Kind = catKind;
    row.Colour = PALETTE.find((c) => !used.has(c)) || PALETTE[list.length % PALETTE.length];
    row.SortOrder = same.reduce((m, x) => Math.max(m, x.SortOrder || 0), 0) + 1;
  }
  if (!state.demo) await graph.addRow(TABLE_FOR[kind], row);
  list.push(normLookup(row));
  state.lastSync = Date.now();
  return code;
}

// ---- Helpers used by the screens ----
export const live = () => state.entries.filter((e) => !e.deleted);
export const activeCats = (kind) => state.categories.filter((c) => c.Kind === kind && c.Active).sort((a, b) => a.SortOrder - b.SortOrder);
export const activePersons = () => state.persons.filter((p) => p.Active);
export const activeModes = () => state.modes.filter((p) => p.Active);
export const findCat = (code) => state.categories.find((c) => c.Code === code);
export const findPerson = (code) => state.persons.find((c) => c.Code === code);
export const findMode = (code) => state.modes.find((c) => c.Code === code);

/** How much of a purchase has already been refunded (optionally ignoring one refund). */
export function refundedFor(purchaseId, ignoreId) {
  return live().filter((e) => e.type === 'Refund' && e.linked === purchaseId && e.id !== ignoreId).reduce((s, e) => s + e.amount, 0);
}
