const CACHE_NAME="hammadshow-v6";
const PRECACHE_URLS=[
  "./","./index.html","./setup.html","./style.css","./app.js","./manifest.json",
  "./icons/icon-192.png","./icons/icon-512.png",
  "./icons/icon-maskable-192.png","./icons/icon-maskable-512.png",
  "https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-database-compat.js"
];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(PRECACHE_URLS).catch(err=>{console.warn("[SW] Precache miss:",err)})));
  self.skipWaiting();
});

self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  const isStream=u.pathname.includes("player_api.php")||u.pathname.includes("/live/")||u.pathname.includes("/movie/")||u.pathname.includes("/series/");
  const isFirebase=u.hostname.includes("firebaseio.com")||u.hostname.includes("googleapis.com");

  // Never cache streams and API calls
  if(isStream)return;

  // Firebase: network-first (realtime data)
  if(isFirebase){
    e.respondWith(fetch(e.request).then(r=>{
      if(r.ok){const cl=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,cl))}
      return r;
    }).catch(()=>caches.match(e.request)));
    return;
  }

  // CDN libs: stale-while-revalidate
  const isCDN=u.hostname.includes("cdn.jsdelivr.net")||u.hostname.includes("gstatic.com");
  if(isCDN){
    e.respondWith(caches.match(e.request).then(cached=>{
      const fetchPromise=fetch(e.request).then(r=>{
        if(r.ok){const cl=r.clone();caches.open(CACHE_NAME).then(ca=>ca.put(e.request,cl))}
        return r;
      }).catch(()=>cached);
      return cached||fetchPromise;
    }));
    return;
  }

  // App assets: cache-first
  if(u.origin===self.location.origin){
    e.respondWith(caches.match(e.request).then(cached=>{
      if(cached)return cached;
      return fetch(e.request).then(r=>{
        if(r.ok){const cl=r.clone();caches.open(CACHE_NAME).then(ca=>ca.put(e.request,cl))}
        return r;
      }).catch(()=>new Response("Offline",{status:503}));
    }));
    return;
  }

  // Everything else: network with cache fallback
  e.respondWith(fetch(e.request).then(r=>{
    if(r.ok){const cl=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,cl))}
    return r;
  }).catch(()=>caches.match(e.request)));
});