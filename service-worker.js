const CACHE_NAME = 'martin-superwebapp-v7';
const CACHE_PREFIX = 'martin-superwebapp-';
const APP_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for the app document: an installed PWA window would otherwise
  // serve a stale index.html from the cache forever and never pick up updates.
  const isNavigation = event.request.mode === 'navigate' || url.pathname.endsWith('/index.html');
  if (isNavigation) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() =>
        caches.open(CACHE_NAME).then(cache =>
          cache.match(event.request).then(cached => cached || cache.match('./index.html'))
        )
      )
    );
    return;
  }

  // Cache-first for static assets (icons, manifest).
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => cache.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        cache.put(event.request, response.clone());
        return response;
      });
    }))
  );
});
