/* ═══════════════════════════════════════════════════════════════════════
   hammadshow — Service Worker
   من برمجة وتطوير المهندس محمد حماد
   ═══════════════════════════════════════════════════════════════════════ */

const CACHE_NAME = "hammadshow-v2";

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js",
  "https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js",
];

// Install — precache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network first for API, cache first for assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Firebase Realtime Database — always network
  if (url.hostname.includes("firebaseio.com")) {
    return;
  }

  // Xtream Codes servers — always network
  if (url.pathname.includes("player_api.php") ||
      url.pathname.includes("/live/") ||
      url.pathname.includes("/movie/") ||
      url.pathname.includes("/series/")) {
    return;
  }

  // Firebase SDK / HLS.js files — cache first
  if (url.hostname.includes("gstatic.com") ||
      url.hostname.includes("googleapis.com") ||
      url.hostname.includes("cdn.jsdelivr.net")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // App assets — stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request)
            .then((response) => {
              if (response.ok) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Everything else — network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});