// Service worker: lets the app open quickly and show its screens even with a weak connection.
// Strategy: always try the network first (so updates appear straight away), fall back to the
// saved copy when offline. Only the app's own files are saved — never Microsoft / Excel data.
const CACHE = 'feai-v5';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/app.js', 'js/config.js', 'js/state.js', 'js/i18n.js', 'js/format.js', 'js/icons.js', 'js/auth.js',
  'js/graph.js', 'js/store.js', 'js/calc.js', 'js/dashcalc.js', 'js/charts.js', 'js/demo.js', 'js/ui.js', 'js/diag.js',
  'js/views/add.js', 'js/views/entries.js', 'js/views/common.js', 'js/views/dashboard.js', 'js/views/settings.js', 'js/views/install.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Microsoft sign-in, Graph, fonts: untouched
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))),
  );
});
