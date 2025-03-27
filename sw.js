self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('facility-cache').then(cache => {
        return cache.addAll([
          './',
          './index.html',
          './patients.html',
          './visits.html',
          './registers.html',
          './app.js',
          './db.js'
        ]);
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
  