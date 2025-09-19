// Import Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js');

// Cache name
const CACHE = 'pwabuilder-page-v1';
const offlineFallbackPage = '/offline.html';

// Files to cache
const ASSETS_TO_CACHE = [
  offlineFallbackPage,
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
];

// Listen for SKIP_WAITING message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install event: cache important files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );

  if (workbox.navigationPreload.isSupported()) {
    workbox.navigationPreload.enable();
  }
});

// Fetch handler: offline fallback for navigation
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloadResp = await event.preloadResponse;
          if (preloadResp) return preloadResp;

          const networkResp = await fetch(event.request);
          return networkResp;
        } catch (error) {
          const cache = await caches.open(CACHE);
          const cachedResp = await cache.match(offlineFallbackPage);
          return cachedResp;
        }
      })()
    );
  } else {
    // For other requests, try cache first, fallback to network
    event.respondWith(
      caches.match(event.request).then((cachedResp) => cachedResp || fetch(event.request))
    );
  }
});
