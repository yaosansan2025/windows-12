/* Offline shell for hosted installs. The double-click HTML file does not use it. */
const CACHE = 'windows-12-concept-127c6f57de762297';
const SHELL = new URL('./', self.registration.scope);
// Cache Storage is origin-wide; different installation paths need separate caches.
const CACHE_PREFIX = 'windows-12-shell:' + self.registration.scope + ':';
const CACHE_NAME = CACHE_PREFIX + CACHE;
const ASSETS = [
  SHELL.href,
  new URL('index.html', SHELL).href,
  new URL('manifest.webmanifest', SHELL).href,
  new URL('pwa/icon-192.png', SHELL).href,
  new URL('pwa/icon-512.png', SHELL).href
];

self.addEventListener('install', event => {
  // Keep the installed version running until its user chooses Save and update.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== SHELL.origin || !url.pathname.startsWith(SHELL.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request,copy)));
      }
      return response;
    }).catch(() => caches.open(CACHE_NAME).then(cache => cache.match(request).then(cached => cached || cache.match(new URL('index.html',SHELL).href)))));
    return;
  }
  event.respondWith(caches.open(CACHE_NAME).then(cache => cache.match(request)).then(cached => cached || fetch(request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(request,copy)));
    }
    return response;
  })));
});
