// public/service-worker.js
const CACHE_NAME = 'smb-buses-v1';
const urlsToCache = [
  '.',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './logo192.png',
  './logo512.png'
];

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SMB Buses cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate service worker - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch strategy: Cache first, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response or fetch from network
        return response || fetch(event.request);
      })
  );
});