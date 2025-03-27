const CACHE_NAME = 'facility-cache-v2'; // increment on each update

const FILES_TO_CACHE = [
  './',
  './index.html',
  './patients.html',
  './visits.html',
  './registers.html',
  './app.js',
  './patients.js',
  './visits.js',
  './registers.js',
  './db.js',
  './styles.css',
  './manifest.json',
  './192-icon.png',
  './512-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key); // Clean up old cache
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
