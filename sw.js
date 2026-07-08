const CACHE_NAME = 'nasr-live-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/manifest.json',
  '/lang/ar.json',
  '/lang/en.json',
  '/js/utils/i18n.js',
  '/js/utils/crypto.js',
  '/js/utils/focus-engine.js',
  '/js/services/database.js',
  '/js/services/xtream-api.js',
  '/js/services/playlist-parser.js',
  '/js/services/playlist-source.js',
  '/js/services/auth.js',
  '/js/components/ui.js',
  '/js/components/cards.js',
  '/js/components/epg.js',
  '/js/player/player.js',
  '/js/pages/home.js',
  '/js/pages/live-tv.js',
  '/js/pages/movies.js',
  '/js/pages/series.js',
  '/js/pages/favorites.js',
  '/js/pages/search.js',
  '/js/pages/settings.js',
  '/js/pages/playlist.js',
  '/js/app.js'
];

const DYNAMIC_CACHE = 'nasr-live-dynamic-v1';
const IMAGE_CACHE = 'nasr-live-images-v1';
const MAX_DYNAMIC_ENTRIES = 100;
const MAX_IMAGE_ENTRIES = 200;

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some static assets failed to cache:', err);
        return cache.addAll(STATIC_ASSETS.filter((url) => url === '/'));
      });
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first for API, cache first for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const reqUrl = event.request.url;

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase and cross-origin API requests
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebaseapp.com')) {
    return;
  }

  // Image caching strategy
  if (reqUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)/i)) {
    event.respondWith(cacheImage(event.request));
    return;
  }

  // Xtream API / stream URLs - network only, no cache
  if (url.pathname.includes('player_api') ||
      url.pathname.includes('/live/') ||
      url.pathname.includes('/movie/') ||
      url.pathname.includes('/series/')) {
    event.respondWith(fetch(event.request).catch(() => new Response('Offline', {status: 503})));
    return;
  }

  // Static assets - cache first, then network
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Everything else - network first
  event.respondWith(networkFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cached = await caches.match('/index.html');
      if (cached) return cached;
    }
    return new Response('Offline', {status: 503});
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_ENTRIES);
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', {status: 503});
  }
}

async function cacheImage(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, response.clone());
      trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
    }
    return response;
  } catch (err) {
    return new Response('', {status: 404});
  }
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const deleteCount = keys.length - maxEntries;
    const deletePromises = keys.slice(0, deleteCount).map((key) => cache.delete(key));
    await Promise.all(deletePromises);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'NASR LIVE';
  const options = {
    body: data.body || 'New content available',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true}).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
  if (event.tag === 'sync-history') {
    event.waitUntil(syncHistory());
  }
});

async function syncFavorites() {
  // Sync local favorites with server when back online
  console.log('Syncing favorites...');
}

async function syncHistory() {
  // Sync watch history with server when back online
  console.log('Syncing watch history...');
}