// Service Worker for Daily Du'a PWA
const CACHE_NAME = 'daily-dua-v1.9';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './pwa/app.css',
  './pwa/app.js',
  './pwa/data.js',
  './pwa/icons/icon-192.png',
  './pwa/icons/icon-512.png',
  './pwa/icons/apple-touch-icon.png',
  './pwa/icons/favicon.png',
  './fonts/Amiri-Regular.ttf',
  './fonts/Amiri-Bold.ttf',
  './fonts/CormorantGaramond-Var.ttf',
  './fonts/CormorantGaramond-Italic-Var.ttf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Respond with cache first, fall back to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Optionally cache new successful GET requests
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          event.request.method === 'GET' &&
          (event.request.url.startsWith(self.location.origin) || event.request.url.includes('fonts.gstatic.com') || event.request.url.includes('fonts.googleapis.com'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If offline and request is for navigation, return index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
