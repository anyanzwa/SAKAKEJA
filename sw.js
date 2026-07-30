// ==============================================================
// SAKA KEJA - SERVICE WORKER
// ==============================================================

const CACHE_NAME = 'saka-keja-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/login.html',
    '/register.html',
    '/tenant.html',
    '/landlord.html',
    '/manifest.json'
];

// ==============================================================
// INSTALL
// ==============================================================
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching files...');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// ==============================================================
// ACTIVATE
// ==============================================================
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ==============================================================
// FETCH
// ==============================================================
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                if (response) {
                    console.log('📦 Serving from cache:', event.request.url);
                    return response;
                }
                console.log('🌐 Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then(networkResponse => {
                        // Cache the new response for next time
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(error => {
                        console.log('⚠️ Network error:', error);
                        // You could return a fallback page here
                    });
            })
    );
});