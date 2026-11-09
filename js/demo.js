// Sample data for demo mode (open the app with ?demo at the end of the address).
// Nothing here touches the real Excel file.
import { todaySerial, serialToParts, partsToSerial } from './format.js';

export function demoData() {
  const categories = [
    ['GROC', 'Groceries', 'કરિયાણું', 'Expense', '#0F766E', 1], ['BILLS', 'Bills', 'બિલ', 'Expense', '#3B82C4', 2],
    ['FUEL', 'Fuel', 'પેટ્રોલ', 'Expense', '#D97706', 3], ['SHOP', 'Shopping', 'ખરીદી', 'Expense', '#C2557A', 4],
    ['DINE', 'Dining', 'બહાર જમવું', 'Expense', '#7C5CC4', 5], ['MED', 'Medical', 'દવા', 'Expense', '#5FA39B', 6],
    ['EDU', 'Education', 'શિક્ષણ', 'Expense', '#8B7B4B', 7], ['OTHER', 'Other', 'અન્ય', 'Expense', '#A8A29E', 8],
    ['SALARY', 'Salary', 'પગાર', 'Income', '#1F5A94', 1], ['RENT', 'Rent', 'ભાડું', 'Income', '#7FA9D6', 2],
    ['BUSINESS', 'Business', 'ધંધો', 'Income', '#3B82C4', 3], ['GIFT', 'Gift', 'ભેટ', 'Income', '#5B8DB8', 4],
    ['INTEREST', 'Interest', 'વ્યાજ', 'Income', '#A9C4E2', 5],
  ].map(([Code, NameEN, NameGU, Kind, Colour, SortOrder]) => ({ Code, NameEN, NameGU, Kind, Colour, SortOrder, Active: true }));
  const persons = [['ME', 'Me', 'હું'], ['PAPA', 'Papa', 'પપ્પા'], ['MUMMY', 'Mummy', 'મમ્મી']]
    .map(([Code, NameEN, NameGU]) => ({ Code, NameEN, NameGU, Active: true }));
  const modes = [['CASH', 'Cash', 'રોકડ'], ['UPI', 'UPI', 'UPI'], ['CARD', 'Card', 'કાર્ડ'], ['BANK', 'Bank', 'બેંક']]
    .map(([Code, NameEN, NameGU]) => ({ Code, NameEN, NameGU, Active: true }));

  const today = todaySerial();
  const tp = serialToParts(today);
  const day = (back) => today - back;
  let n = 0;
  const E = (date, type, amount, cat, person, mode, note, linked = '') =>
    ({ id: 'DEMO-' + ++n, date, type, amount, cat, person, mode, note, linked, created: date, deleted: false });

  const entries = [];
  // This month, like the mockup
  const first = partsToSerial(tp.y, tp.m, 1);
  entries.push(
    E(first, 'Income', 75000, 'SALARY', '', 'BANK', 'Salary'),
    E(first, 'Income', 10000, 'RENT', '', 'BANK', 'Rent received'),
    E(Math.max(first, day(7)), 'Expense', 599, 'BILLS', 'ME', 'UPI', 'Mobile recharge'),
    E(Math.max(first, day(6)), 'Expense', 3200, 'SHOP', 'PAPA', 'UPI', 'Shoes'),
    E(Math.max(first, day(5)), 'Expense', 860, 'GROC', 'MUMMY', 'CASH', 'Fruits'),
  );
  const shirt = E(Math.max(first, day(4)), 'Expense', 2000, 'SHOP', 'ME', 'CARD', 'Shirt');
  entries.push(
    shirt,
    E(Math.max(first, day(4)), 'Expense', 1180, 'DINE', 'PAPA', 'CARD', 'Dinner out'),
    E(Math.max(first, day(3)), 'Expense', 3450, 'BILLS', 'ME', 'UPI', 'Electricity bill'),
    E(Math.max(first, day(2)), 'Expense', 640, 'MED', 'MUMMY', 'CASH', 'Medicines'),
    E(Math.max(first, day(1)), 'Expense', 2000, 'FUEL', 'PAPA', 'CARD', 'Petrol'),
    E(today, 'Expense', 1250, 'GROC', 'ME', 'UPI', 'Vegetables, milk'),
    E(today, 'Refund', 2000, 'SHOP', 'ME', 'CARD', 'Shirt refund', shirt.id),
  );
  // Every earlier month from January last year: a realistic, slightly varying month.
  const rnd = (seed) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };
  for (let k = 1; ; k++) {
    const d = new Date(Date.UTC(tp.y, tp.m - k, 1));
    const y = d.getUTCFullYear(), m = d.getUTCMonth();
    if (y < tp.y - 1) break;
    const s = (dd) => partsToSerial(y, m, dd);
    const f = (base, seed) => Math.round((base * (0.8 + 0.4 * rnd(k * 7 + seed))) / 10) * 10;
    const grow = y < tp.y ? 0.93 : 1;
    entries.push(
      E(s(1), 'Income', y < tp.y ? 70000 : 75000, 'SALARY', '', 'BANK', 'Salary'),
      E(s(1), 'Income', 10000, 'RENT', '', 'BANK', 'Rent received'),
      E(s(3), 'Expense', f(9000 * grow, 1), 'GROC', 'MUMMY', 'CASH', 'Monthly groceries'),
      E(s(16), 'Expense', f(5200 * grow, 2), 'GROC', 'ME', 'UPI', 'Vegetables, fruits'),
      E(s(6), 'Expense', f(8800 * grow, 3), 'BILLS', 'ME', 'UPI', 'Electricity, phone, gas'),
      E(s(9), 'Expense', f(6400 * grow, 4), 'FUEL', 'PAPA', 'CARD', 'Petrol'),
      E(s(14), 'Expense', f(4800 * grow, 5), 'DINE', 'PAPA', 'CARD', 'Dinner out'),
      E(s(20), 'Expense', f(5200 * grow, 6), 'SHOP', 'ME', 'UPI', 'Clothes'),
      E(s(24), 'Expense', f(2600 * grow, 7), 'MED', 'MUMMY', 'CASH', 'Medicines'),
      E(s(27), 'Expense', f(3300 * grow, 8), 'OTHER', 'ME', 'CASH', 'Misc'),
    );
    if (m === 5 || m === 0) entries.push(E(s(10), 'Expense', 18000, 'EDU', 'PAPA', 'BANK', 'School fees'));
    if (m === 3) entries.push(E(s(5), 'Income', 6200, 'INTEREST', '', 'BANK', 'FD interest'));
  }
  return { categories, persons, modes, entries };
}
