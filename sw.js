// ==============================================================
// SAKA KEJA - SERVICE WORKER (FIXED: GET only, skip Firebase APIs)
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
                console.log('📦 Caching static files...');
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
// FETCH - ONLY CACHE GET REQUESTS, SKIP FIREBASE API
// ==============================================================
self.addEventListener('fetch', event => {
    // 1. Skip all non-GET requests (POST, PUT, DELETE, etc.)
    if (event.request.method !== 'GET') {
        return; // Let the browser handle these normally
    }

    // 2. Skip Firebase / Google API calls (they are dynamic)
    const url = event.request.url;
    if (url.includes('firebase') || url.includes('googleapis') || url.includes('gstatic')) {
        // Just fetch from network without caching
        event.respondWith(fetch(event.request));
        return;
    }

    // 3. For all other GET requests, try cache first, then network
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    console.log('📦 Serving from cache:', event.request.url);
                    return response;
                }
                console.log('🌐 Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                })
                                .catch(err => {
                                    // Swallow errors if response is not cacheable
                                });
                        }
                        return networkResponse;
                    })
                    .catch(error => {
                        console.log('⚠️ Network error:', error);
                    });
            })
    );
});