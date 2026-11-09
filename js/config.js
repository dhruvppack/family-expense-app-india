// ------------------------------------------------------------------
// Family Expense App - India — settings that connect the app to
// Microsoft 365. Change these only if the Entra app or the Excel file
// location changes. See SETUP-GUIDE.md.
// ------------------------------------------------------------------
export const CONFIG = {
  appName: 'Family Expense App - India',
  version: '1.0 (Phase 5)',

  // Microsoft Entra app registration (PROPACK BV tenant)
  clientId: '91933921-fd38-4be6-9480-4f7c867db9c9',
  tenantId: '6520371b-0807-4468-832e-3676426d6993',
  scopes: ['Files.ReadWrite.All'],

  // Excel workbook on the "Family" SharePoint site.
  // driveId = the site's Documents library. The file is found by its path,
  // so it keeps working if the file is re-uploaded with the same name.
  driveId: 'b!_sa5e4QnfkaX2QpSYnLoI24dylYrZVlJikhXOx3aL-6RF47EHy6cR5j80YC6If25',
  folderPath: 'Family Expense App - India',
  workbookName: 'Family Expense App - India.xlsx',
};
