# Family Expense App - India

A family expense app (English + ગુજરાતી) that keeps all its data in one Excel file on the
"Family" SharePoint site: `Documents / Family Expense App - India / Family Expense App - India.xlsx`.

**App link:** https://dhruvppack.github.io/family-expense-app-india/
**Try it with sample data (nothing saved):** https://dhruvppack.github.io/family-expense-app-india/?demo

## What's in this folder
| File / folder | What it does |
|---|---|
| `index.html` | The page that loads the app |
| `css/app.css` | Colours, fonts and layout (phone, iPad, computer) |
| `js/config.js` | **Settings** – Microsoft Entra app ID, tenant ID and where the Excel file is |
| `js/auth.js` | Microsoft sign-in (MSAL.js) |
| `js/graph.js` | Reads and writes the Excel tables (Microsoft Graph Excel API) |
| `js/store.js` | Loads entries/lookups, saves new entries, edits, soft delete |
| `js/i18n.js` | All on-screen text in English and Gujarati |
| `js/views/*.js` | The screens (Add, Entries, Dashboard, Settings) |
| `js/demo.js` | Sample data for `?demo` |
| `icons/`, `manifest.webmanifest` | App icon and "install to home screen" details |

There is no build step: edit a file, upload it to this repository, and GitHub Pages
republishes the same link within a minute or two.

## How the data is stored
Excel Tables `Entries`, `Categories`, `Persons`, `PaymentModes`. Entries store short codes
(e.g. `GROC`, `ME`, `UPI`), never translated names. Amounts are always positive; `Type` is
Expense / Income / Refund. Refunds point to the original purchase via `LinkedEntryID`.
Deleting in the app only sets `IsDeleted = TRUE`.

A full setup and maintenance guide is saved next to the Excel file on SharePoint.
