/**
 * Hamad Show — Service Worker
 * ===========================
 * Handles caching, offline support, and background sync.
 */

const CACHE_NAME = 'hamad-show-v1';
const STATIC_CACHE = 'hamad-show-static-v1';
const DYNAMIC_CACHE = 'hamad-show-dynamic-v1';
const IMAGE_CACHE = 'hamad-show-images-v1';

/* Static assets to pre-cache during installation */
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/variables.css',
  './css/animations.css',
  './css/components.css',
  './css/main.css',
  './css/player.css',
  './css/responsive.css',
  './css/admin.css',
  './js/config.js',
  './js/utils.js',
  './js/storage.js',
  './js/router.js',
  './js/api.js',
  './js/player.js',
  './js/search.js',
  './js/favorites.js',
  './js/history.js',
  './js/notifications.js',
  './js/offline.js',
  './js/admin.js',
  './js/app.js',
  './manifest.json',
  './icons/icon.svg'
];

/* Cache size limits */
const MAX_DYNAMIC_CACHE = 100;
const MAX_IMAGE_CACHE = 200;

/* ═══════════════════════════════
   INSTALL EVENT
   ═══════════════════════════════ */
self.addEventListener('install', (event) => {
  console.log('[HamadShow SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[HamadShow SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[HamadShow SW] Pre-cache failed, continuing:', err);
        return self.skipWaiting();
      })
  );
});

/* ═══════════════════════════════
   ACTIVATE EVENT
   ═══════════════════════════════ */
self.addEventListener('activate', (event) => {
  console.log('[HamadShow SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== STATIC_CACHE &&
                     name !== DYNAMIC_CACHE &&
                     name !== IMAGE_CACHE;
            })
            .map((name) => {
              console.log('[HamadShow SW] Removing old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

/* ═══════════════════════════════
   FETCH EVENT — Stale-While-Revalidate Strategy
   ═══════════════════════════════ */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET requests */
  if (request.method !== 'GET') return;

  /* Skip cross-origin API requests (Xtream Codes API) */
  if (url.hostname !== self.location.hostname) {
    /* For API streams, use network-first with no cache */
    if (url.pathname.includes('.m3u8') || url.pathname.includes('.ts') || url.pathname.includes('.mp4')) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            /* Cache successful stream responses briefly */
            if (response.ok) {
              const cloned = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, cloned);
              });
            }
            return response;
          })
          .catch(() => {
            /* Try cache as fallback */
            return caches.match(request);
          })
      );
      return;
    }
    return;
  }

  /* Static assets — Cache First, then Network */
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) return cached;
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const cloned = response.clone();
                caches.open(STATIC_CACHE).then((cache) => cache.put(request, cloned));
              }
              return response;
            });
        })
    );
    return;
  }

  /* Images — Stale-While-Revalidate */
  if (isImageAsset(url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response.ok) {
                cache.put(request, response.clone());
                trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE);
              }
              return response;
            })
            .catch(() => cached);

          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  /* HTML pages — Network First, then Cache */
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('./index.html');
          });
        })
    );
    return;
  }

  /* Default — Stale-While-Revalidate */
  event.respondWith(
    caches.open(DYNAMIC_CACHE).then((cache) => {
      return cache.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
              trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE);
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      });
    })
  );
});

/* ═══════════════════════════════
   PUSH NOTIFICATION EVENT
   ═══════════════════════════════ */
self.addEventListener('push', (event) => {
  let data = { title: 'Hamad Show', body: 'New content available!' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: './icons/icon-192.png',
    badge: './icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || './' },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/* ═══════════════════════════════
   NOTIFICATION CLICK EVENT
   ═══════════════════════════════ */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        /* Focus existing window if available */
        for (const client of clients) {
          if (client.url.includes('index.html') && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        /* Open new window */
        return self.clients.openWindow(url);
      })
  );
});

/* ═══════════════════════════════
   BACKGROUND SYNC EVENT
   ═══════════════════════════════ */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-history') {
    console.log('[HamadShow SW] Syncing watch history...');
    /* In a real app, sync watch history to server here */
  }

  if (event.tag === 'sync-favorites') {
    console.log('[HamadShow SW] Syncing favorites...');
  }
});

/* ═══════════════════════════════
   MESSAGE EVENT
   ═══════════════════════════════ */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});

/* ═══════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════ */

/**
 * Check if the URL points to a static asset (CSS, JS, fonts, etc.)
 */
function isStaticAsset(url) {
  const staticExtensions = [
    '.css', '.js', '.woff', '.woff2', '.ttf', '.eot',
    '.svg', '.json', '.xml', '.webmanifest'
  ];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

/**
 * Check if the URL points to an image
 */
function isImageAsset(url) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.ico'];
  return imageExtensions.some((ext) => url.pathname.endsWith(ext));
}

/**
 * Trim a cache to a maximum number of entries (LRU-style)
 */
function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        const deleteCount = keys.length - maxItems;
        const deletePromises = keys.slice(0, deleteCount).map((key) => cache.delete(key));
        Promise.all(deletePromises);
      }
    });
  });
}