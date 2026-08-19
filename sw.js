const CACHE = 'railfocus-offline-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png'
];

const EXTERNAL_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three-globe@2.31.1/example/img/earth-blue-marble.jpg',
  'https://cdn.jsdelivr.net/npm/three-globe@2.31.1/example/img/earth-topology.png',
  'https://cdn.jsdelivr.net/npm/three-globe@2.31.1/example/img/earth-water.png',
  'https://cdn.jsdelivr.net/npm/three-globe@2.31.1/example/img/earth-night.jpg',
  'https://cdn.jsdelivr.net/npm/three-globe@2.31.1/example/img/earth-clouds.png',
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP_SHELL);
    // Cross-origin resources are intentionally fetched as opaque responses.
    await Promise.all(EXTERNAL_ASSETS.map(async url => {
      try {
        const response = await fetch(url, { mode: 'no-cors', cache: 'no-store' });
        if (response && (response.ok || response.type === 'opaque')) {
          await cache.put(url, response);
        }
      } catch (_) {}
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    try {
      const response = await fetch(req);
      const cache = await caches.open(CACHE);
      if (response.ok || response.type === 'opaque') {
        cache.put(req, response.clone()).catch(() => {});
      }
      return response;
    } catch (err) {
      const fallback = await caches.match('./index.html');
      if (fallback && req.mode === 'navigate') return fallback;
      throw err;
    }
  })());
});
