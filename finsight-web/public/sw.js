const VERSION = 'finsight-ai-pwa-v1';
const APP_SHELL_CACHE = `app-shell-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const APP_SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/brand/logo_192.png', '/brand/logo_384.png', '/brand/logo_512.png', '/brand/logo_1024.png', '/brand/apple-touch-icon.png', '/brand/favicon.ico', '/brand/favicon-16x16.png', '/brand/favicon-32x32.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then(async (cache) => {
      await cache.addAll(APP_SHELL_URLS);
      self.skipWaiting();
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter((key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    }),
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const cache = await caches.open(RUNTIME_CACHE);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match('/index.html');
    if (cached) return cached;
    return caches.match('/');
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
  }
});
