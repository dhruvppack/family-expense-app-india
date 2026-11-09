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
  // Last month + same month last year (for later dashboard comparisons)
  for (const [y, m, scale] of [[tp.m === 0 ? tp.y - 1 : tp.y, (tp.m + 11) % 12, 1.05], [tp.y - 1, tp.m, 0.93]]) {
    const s = (d) => partsToSerial(y, m, d);
    entries.push(
      E(s(1), 'Income', Math.round(70000 * scale), 'SALARY', '', 'BANK', 'Salary'),
      E(s(1), 'Income', 10000, 'RENT', '', 'BANK', 'Rent received'),
      E(s(3), 'Expense', Math.round(4200 * scale), 'GROC', 'MUMMY', 'CASH', 'Monthly groceries'),
      E(s(6), 'Expense', Math.round(2600 * scale), 'BILLS', 'ME', 'UPI', 'Electricity bill'),
      E(s(9), 'Expense', Math.round(2400 * scale), 'FUEL', 'PAPA', 'CARD', 'Petrol'),
      E(s(14), 'Expense', Math.round(1500 * scale), 'DINE', 'PAPA', 'CARD', 'Dinner out'),
      E(s(20), 'Expense', Math.round(3100 * scale), 'SHOP', 'ME', 'UPI', 'Kurta'),
      E(s(24), 'Expense', Math.round(900 * scale), 'MED', 'MUMMY', 'CASH', 'Medicines'),
    );
  }
  return { categories, persons, modes, entries };
}
