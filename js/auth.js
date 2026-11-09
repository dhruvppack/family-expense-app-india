// Microsoft sign-in (MSAL.js). Uses redirect sign-in, which works best for
// apps installed on the home screen. Tokens are kept in this browser's
// localStorage so the family stays signed in.
import { CONFIG } from './config.js';
import { state } from './state.js';

let pca = null;

function redirectUri() {
  // e.g. https://dhruvppack.github.io/family-expense-app-india/
  return location.origin + location.pathname.replace(/[^/]*$/, '');
}

async function loadMsal() {
  if (window.msal) return;
  const urls = [
    'https://cdn.jsdelivr.net/npm/@azure/msal-browser@3.27.0/lib/msal-browser.min.js',
    'https://unpkg.com/@azure/msal-browser@3.27.0/lib/msal-browser.min.js',
  ];
  for (const src of urls) {
    try {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src; s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
      if (window.msal) return;
    } catch { /* try next */ }
  }
  throw new Error('Could not load the Microsoft sign-in library. Check the internet connection.');
}

/** Returns the signed-in account, or null if the user still needs to sign in. */
export async function initAuth() {
  await loadMsal();
  pca = new window.msal.PublicClientApplication({
    auth: {
      clientId: CONFIG.clientId,
      authority: `https://login.microsoftonline.com/${CONFIG.tenantId}`,
      redirectUri: redirectUri(),
      postLogoutRedirectUri: redirectUri(),
      navigateToLoginRequestUrl: false,
    },
    cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: false },
  });
  await pca.initialize();
  const result = await pca.handleRedirectPromise();
  const account = result?.account || pca.getActiveAccount() || pca.getAllAccounts()[0] || null;
  if (account) pca.setActiveAccount(account);
  state.account = account;
  return account;
}

export function signIn() {
  return pca.loginRedirect({ scopes: CONFIG.scopes, prompt: 'select_account' });
}

export function signOut() {
  return pca.logoutRedirect({ account: pca.getActiveAccount() });
}

export async function getToken(forceRefresh = false) {
  const account = pca.getActiveAccount();
  try {
    const r = await pca.acquireTokenSilent({ scopes: CONFIG.scopes, account, forceRefresh });
    return r.accessToken;
  } catch (e) {
    if (e instanceof window.msal.InteractionRequiredAuthError || e?.errorCode === 'no_tokens_found') {
      await pca.acquireTokenRedirect({ scopes: CONFIG.scopes, account });
      return new Promise(() => {}); // page is navigating away
    }
    throw e;
  }
}
