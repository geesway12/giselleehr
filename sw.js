const CACHE_NAME = 'facility-cache-v2'; // 🔁 Increment on each update

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
});

// ✅ Fetch: Serve from cache first
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
