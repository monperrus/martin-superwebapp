const CACHE_NAME = 'martin-superwebapp-v8';
const CACHE_PREFIX = 'martin-superwebapp-';
const APP_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg'
];

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
}

async function bundledTab(projectId) {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('martin-superwebapp');
    request.onerror = () => reject(request.error || new Error('Could not open app database.'));
    request.onsuccess = () => resolve(request.result);
  });
  try {
    if (!db.objectStoreNames.contains('tabs')) return null;
    const tx = db.transaction('tabs');
    const tabs = await requestResult(tx.objectStore('tabs').getAll());
    return tabs.find(tab => tab.project?.projectId === projectId) || null;
  } finally { db.close(); }
}

function base64Bytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function bundledResponse(url) {
  const marker = '/__pwa__/';
  const markerIndex = url.pathname.indexOf(marker);
  if (markerIndex < 0) return null;
  const parts = url.pathname.slice(markerIndex + marker.length).split('/');
  const projectId = decodeURIComponent(parts.shift() || '');
  const path = parts.map(part => decodeURIComponent(part)).join('/') || 'index.html';
  if (!projectId || path.split('/').some(part => !part || part === '.' || part === '..')) return new Response('Invalid imported PWA path.', { status: 400 });
  const tab = await bundledTab(projectId);
  if (!tab?.project) return new Response('Imported PWA not found.', { status: 404 });
  const file = path === tab.project.entryPath
    ? { bytes: new TextEncoder().encode(tab.html || ''), type: 'text/html; charset=utf-8' }
    : tab.project.files?.[path] ? { bytes: base64Bytes(tab.project.files[path].base64), type: tab.project.files[path].type || 'application/octet-stream' } : null;
  if (!file) return new Response('Imported PWA file not found.', { status: 404 });
  const headers = new Headers({
    'Content-Type': file.type,
    'Access-Control-Allow-Origin': '*',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=(), usb=()'
  });
  if (/^text\/html(?:;|$)/i.test(file.type)) {
    headers.set('Content-Security-Policy', "sandbox allow-scripts allow-forms allow-modals; default-src 'self' https: data: blob:; script-src 'self' https: data: blob: 'unsafe-inline'; style-src 'self' https: data: 'unsafe-inline'; img-src 'self' https: data: blob:; font-src 'self' https: data:; connect-src https:; media-src 'self' https: data: blob:; frame-src 'self' https:; worker-src 'self' blob:");
  }
  return new Response(file.bytes, { status: 200, headers });
}

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

  if (url.pathname.includes('/__pwa__/')) {
    event.respondWith(bundledResponse(url).catch(() => new Response('Could not load imported PWA.', { status: 500 })));
    return;
  }

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
