// Service Worker for Daily Du'a PWA
const CACHE_NAME = 'daily-dua-v2.3';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa/app.css',
  '/pwa/app.js',
  '/pwa/data.js',
  '/pwa/icons/icon-192.png',
  '/pwa/icons/icon-512.png',
  '/pwa/icons/apple-touch-icon.png',
  '/pwa/icons/favicon.png',
  '/fonts/Amiri-Regular.ttf',
  '/fonts/Amiri-Bold.ttf',
  '/fonts/CormorantGaramond-Var.ttf',
  '/fonts/CormorantGaramond-Italic-Var.ttf'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of PRECACHE_ASSETS) {
        try {
          const response = await fetch(asset, { cache: 'no-cache' });
          if (response && (response.ok || response.type === 'opaque')) {
            await cache.put(asset, response);
          }
        } catch (err) {
          console.warn('Precache skip for:', asset, err);
        }
      }
    })
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
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Navigation Requests (Membuka aplikasi dari icon homescreen HP)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // OFFLINE FALLBACK: Layani selalu dari cache yang tersedia
          const cached = await caches.match(event.request)
            || await caches.match('/')
            || await caches.match('/index.html')
            || await caches.match('./')
            || await caches.match('./index.html');
          if (cached) return cached;
          return new Response('Aplikasi Doa Harian sedang offline.', {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 2. Static Assets (CSS, JS, Fonts, Images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Cache-first: kembalikan dari cache seketika
        // Update di latar belakang jika online
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Jika belum ada di cache, ambil dari network
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          (networkResponse.ok || networkResponse.type === 'opaque') &&
          (url.origin === self.location.origin || url.hostname.includes('fonts.gstatic.com'))
        ) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      });
    })
  );
});
