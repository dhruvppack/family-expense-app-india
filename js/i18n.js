// All on-screen text in English (en) and Gujarati (gu).
import { state } from './state.js';

const T = {
  appName: ['Family Expense App - India', 'કુટુંબ ખર્ચ એપ - ઇન્ડિયા'],
  appNameShort: ['Family Expense App', 'કુટુંબ ખર્ચ'],
  appSub: ['કુટુંબ ખર્ચ', 'Family Expense App - India'],

  navAdd: ['Add', 'ઉમેરો'],
  navAddEntry: ['Add entry', 'એન્ટ્રી ઉમેરો'],
  navEntries: ['Entries', 'એન્ટ્રી'],
  navDashboard: ['Dashboard', 'ડેશબોર્ડ'],
  navSettings: ['Settings', 'સેટિંગ્સ'],

  addExpense: ['Add expense', 'ખર્ચ ઉમેરો'],
  addIncome: ['Add income', 'આવક ઉમેરો'],
  addRefund: ['Add refund', 'રિફંડ ઉમેરો'],
  addEntry: ['Add entry', 'એન્ટ્રી ઉમેરો'],
  editEntry: ['Edit entry', 'એન્ટ્રી બદલો'],

  Expense: ['Expense', 'ખર્ચ'],
  Income: ['Income', 'આવક'],
  Refund: ['Refund', 'રિફંડ'],

  whoSpent: ['Who spent?', 'કોણે ખર્ચ કર્યો?'],
  amount: ['Amount', 'રકમ'],
  amountReceived: ['Amount received', 'મળેલી રકમ'],
  wholeFamily: ['Counted for the whole family', 'આખા કુટુંબ માટે ગણાશે'],
  category: ['Category', 'કેટેગરી'],
  source: ['Source', 'સ્ત્રોત'],
  spentVia: ['Spent via', 'ચુકવણી'],
  receivedIn: ['Received in', 'ક્યાં મળ્યા'],
  newItem: ['New', 'નવી'],
  date: ['Date', 'તારીખ'],
  note: ['Note', 'નોંધ'],
  notePhExpense: ['Vegetables, milk', 'શાકભાજી, દૂધ'],
  notePhIncome: ['October salary', 'ઓક્ટોબરનો પગાર'],
  notePhRefund: ['Optional', 'વૈકલ્પિક'],

  saveExpense: ['Save expense', 'ખર્ચ સેવ કરો'],
  saveIncome: ['Save income', 'આવક સેવ કરો'],
  saveRefund: ['Save refund', 'રિફંડ સેવ કરો'],
  saveAnother: ['Save & add another', 'સેવ કરી બીજું ઉમેરો'],
  saveChanges: ['Save changes', 'ફેરફાર સેવ કરો'],
  saving: ['Saving…', 'સેવ થાય છે…'],

  whichPurchase: ['1. Which purchase was returned?', '1. કઈ ખરીદી પાછી આપી?'],
  returnedPurchase: ['Returned purchase', 'પાછી આપેલી ખરીદી'],
  searchPurchase: ['Search item, category or amount', 'વસ્તુ, કેટેગરી કે રકમ શોધો'],
  showOlder: ['Show older purchases', 'જૂની ખરીદીઓ બતાવો'],
  noPurchases: ['No purchases to refund', 'રિફંડ માટે કોઈ ખરીદી નથી'],
  howMuchBack: ['2. How much came back?', '2. કેટલા પાછા આવ્યા?'],
  fullRefund: ['Full refund', 'પૂરું રિફંડ'],
  partRefund: ['Part refund', 'થોડું રિફંડ'],
  refundedTo: ['Refunded to', 'ક્યાં પાછા આવ્યા'],
  leftToRefund: ['left to refund', 'રિફંડ બાકી'],

  returned: ['Returned', 'પાછું આપ્યું'],
  partReturned: ['Part returned', 'થોડું પાછું'],
  today: ['Today', 'આજે'],
  yesterday: ['Yesterday', 'ગઈકાલે'],

  search: ['Search', 'શોધો'],
  searchDesk: ['Search note, category, amount', 'નોંધ, કેટેગરી, રકમ શોધો'],
  all: ['All', 'બધું'],
  fExpenses: ['Expenses', 'ખર્ચ'],
  fIncome: ['Income', 'આવક'],
  fRefunds: ['Refunds', 'રિફંડ'],
  person: ['Person', 'વ્યક્તિ'],
  allTypes: ['All types', 'બધા પ્રકાર'],
  allPersons: ['All persons', 'બધી વ્યક્તિ'],
  allCategories: ['All categories', 'બધી કેટેગરી'],
  inShort: ['In', 'આવક'],
  outShort: ['Out', 'ખર્ચ'],
  savedShort: ['Saved', 'બચત'],
  moneyIn: ['Money in', 'આવેલા પૈસા'],
  moneyOut: ['Money out', 'ગયેલા પૈસા'],
  refundsTitle: ['Refunds', 'રિફંડ'],
  family: ['Family', 'કુટુંબ'],
  colDate: ['Date', 'તારીખ'],
  colType: ['Type', 'પ્રકાર'],
  colNote: ['Note', 'નોંધ'],
  colCategory: ['Category', 'કેટેગરી'],
  colPerson: ['Person', 'વ્યક્તિ'],
  colVia: ['Via', 'માધ્યમ'],
  colAmount: ['Amount', 'રકમ'],
  openExcel: ['Open in Excel', 'Excel માં ખોલો'],
  loadMore: ['Load more', 'વધુ બતાવો'],
  noEntries: ['No entries for this month yet.', 'આ મહિને હજુ કોઈ એન્ટ્રી નથી.'],
  noMatch: ['No entries match your filters.', 'ફિલ્ટર મુજબ કોઈ એન્ટ્રી નથી.'],
  addFirst: ['Add the first one', 'પહેલી એન્ટ્રી ઉમેરો'],
  edit: ['Edit', 'બદલો'],
  delete: ['Delete', 'કાઢી નાખો'],
  cancel: ['Cancel', 'રદ કરો'],
  add: ['Add', 'ઉમેરો'],
  to: ['to', '→'],

  confirmDeleteTitle: ['Delete this entry?', 'આ એન્ટ્રી કાઢી નાખવી છે?'],
  confirmDeleteBody: [
    'It disappears from the app and the dashboard. The row stays in the Excel file (marked IsDeleted = TRUE), so it can be restored there.',
    'એ એપ અને ડેશબોર્ડમાંથી દેખાતી બંધ થશે. Excel ફાઇલમાં લાઇન રહેશે (IsDeleted = TRUE), તેથી ત્યાંથી પાછી લાવી શકાય.'],
  confirmDeleteRefunds: [
    'This purchase has a refund linked to it. The refund will also be deleted.',
    'આ ખરીદી સાથે રિફંડ જોડાયેલું છે. એ રિફંડ પણ કાઢી નખાશે.'],
  toastSaved: ['Saved to Excel', 'Excel માં સેવ થયું'],
  toastDeleted: ['Deleted', 'કાઢી નાખ્યું'],
  toastAdded: ['Added', 'ઉમેરાયું'],

  monthSoFar: ['{m} so far', '{m} અત્યાર સુધી'],
  monthTotal: ['{m}', '{m}'],
  recent: ['Recent entries', 'તાજેતરની એન્ટ્રી'],
  viewAll: ['View all', 'બધું જુઓ'],
  showingOf: ['Showing {a} of {b} entries in {m}', '{m} ની {b} માંથી {a} એન્ટ્રી'],

  errAmount: ['Enter an amount', 'રકમ લખો'],
  errPerson: ['Choose who spent', 'કોણે ખર્ચ કર્યો તે પસંદ કરો'],
  errCategory: ['Choose a category', 'કેટેગરી પસંદ કરો'],
  errSource: ['Choose a source', 'સ્ત્રોત પસંદ કરો'],
  errMode: ['Choose how it was paid', 'ચુકવણીનું માધ્યમ પસંદ કરો'],
  errPurchase: ['Choose the purchase that was returned', 'પાછી આપેલી ખરીદી પસંદ કરો'],
  errTooBig: ['Refund can be at most {a}', 'રિફંડ વધુમાં વધુ {a} હોઈ શકે'],
  errName: ['Enter a name', 'નામ લખો'],
  errExists: ['That name already exists', 'એ નામ પહેલેથી છે'],

  newCategory: ['New category', 'નવી કેટેગરી'],
  newSource: ['New income source', 'આવકનો નવો સ્ત્રોત'],
  newMode: ['New payment mode', 'ચુકવણીનું નવું માધ્યમ'],
  nameEn: ['Name (English)', 'નામ (અંગ્રેજી)'],
  nameGu: ['Gujarati name (optional)', 'ગુજરાતી નામ (વૈકલ્પિક)'],

  signInTitle: ['Welcome', 'સ્વાગત છે'],
  signInBody: ['Sign in once with the family Microsoft account. The app keeps you signed in.',
    'કુટુંબના Microsoft એકાઉન્ટથી એક વાર સાઇન ઇન કરો. એપ તમને સાઇન ઇન રાખશે.'],
  signIn: ['Sign in with Microsoft', 'Microsoft થી સાઇન ઇન કરો'],
  signOut: ['Sign out', 'સાઇન આઉટ'],
  loading: ['Loading from Excel…', 'Excel માંથી લોડ થાય છે…'],
  loadFailed: ['Could not open the Excel file', 'Excel ફાઇલ ખૂલી નહીં'],
  tryAgain: ['Try again', 'ફરી પ્રયત્ન કરો'],
  refresh: ['Refresh', 'રિફ્રેશ'],

  comingTitle: ['Coming in the next phase', 'આગળના તબક્કામાં આવશે'],
  dashComing: ['The dashboard with Month and Year views is built in Phase 4.', 'મહિનો અને વર્ષ સાથેનું ડેશબોર્ડ તબક્કા 4 માં બનશે.'],
  setComing: ['Editing persons, categories, income sources and payment modes comes in Phase 5.', 'વ્યક્તિ, કેટેગરી, આવકના સ્ત્રોત અને ચુકવણીના માધ્યમ બદલવાનું તબક્કા 5 માં આવશે.'],

  language: ['Language', 'ભાષા'],
  appLanguage: ['App language', 'એપની ભાષા'],
  numbersGu: ['Numbers in Gujarati mode', 'ગુજરાતી મોડમાં આંકડા'],
  data: ['Data', 'ડેટા'],
  syncedJustNow: ['SharePoint · synced just now', 'SharePoint · હમણાં જ સિંક થયું'],
  syncedAgo: ['SharePoint · synced {n} min ago', 'SharePoint · {n} મિનિટ પહેલાં સિંક થયું'],
  signedInAs: ['Signed in as {u}', '{u} તરીકે સાઇન ઇન'],

  demoBanner: ['Demo mode – sample data only, nothing is saved to Excel.', 'ડેમો મોડ – ફક્ત નમૂના ડેટા, Excel માં કંઈ સેવ નથી થતું.'],
};

export function t(key, vars) {
  const pair = T[key];
  let s = pair ? pair[state.lang === 'gu' ? 1 : 0] : key;
  if (vars) for (const k in vars) s = s.replaceAll('{' + k + '}', vars[k]);
  return s;
}

export const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  gu: ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઑગસ્ટ', 'સપ્ટેમ્બર', 'ઑક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'],
};
export const MONTHS_SHORT = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  gu: ['જાન્યુ.', 'ફેબ્રુ.', 'માર્ચ', 'એપ્રિ.', 'મે', 'જૂન', 'જુલાઈ', 'ઑગ.', 'સપ્ટે.', 'ઑક્ટો.', 'નવે.', 'ડિસે.'],
};
export const WEEKDAYS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  gu: ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'],
};
