/* Offline shell for hosted installs. The double-click HTML file does not use it. */
const CACHE = 'windows-12-concept-v1-2-0';
const SHELL = new URL('./', self.registration.scope);
const ASSETS = [
  SHELL.href,
  new URL('index.html', SHELL).href,
  new URL('manifest.webmanifest', SHELL).href,
  new URL('pwa/icon-192.png', SHELL).href,
  new URL('pwa/icon-512.png', SHELL).href
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('windows-12-concept-') && key !== CACHE).map(key => caches.delete(key)))),
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
      if (response.ok) caches.open(CACHE).then(cache => cache.put(request,response.clone()));
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match(new URL('index.html',SHELL).href))));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(request,response.clone()));
    return response;
  })));
});
