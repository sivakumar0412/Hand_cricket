const CACHE_NAME = 'hand-cricket-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/responsive.css',
  '/js/game.js',
  '/js/ui.js',
  '/js/storage.js',
  '/js/sound.js',
  '/js/app.js',
  '/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match('/offline.html'))
  );
});