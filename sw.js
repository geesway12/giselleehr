// service-worker.js
const CACHE_NAME = 'facility-cache-v4'; // 🔁 Increment on each update

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
  './512-icon.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
  'https://cdn.jsdelivr.net/npm/flatpickr',
  'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// ✅ Install: Cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Caching app shell...');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// ✅ Activate: Clear old cache versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log(`🧹 Removing old cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ✅ Fetch: Serve from cache first
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
