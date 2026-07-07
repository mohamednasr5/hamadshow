const CACHE_NAME="hammadshow-v3";
const PRECACHE_URLS=["./","./index.html","./style.css","./app.js","./manifest.json","./icons/icon-192.png","./icons/icon-512.png","https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js","https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js","https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(PRECACHE_URLS)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(n=>Promise.all(n.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(u.hostname.includes("firebaseio.com")||u.pathname.includes("player_api.php")||u.pathname.includes("/live/")||u.pathname.includes("/movie/")||u.pathname.includes("/series/"))return;
  if(u.hostname.includes("gstatic.com")||u.hostname.includes("googleapis.com")||u.hostname.includes("cdn.jsdelivr.net")){
    e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{if(r.ok){const cl=r.clone();caches.open(CACHE_NAME).then(ca=>ca.put(e.request,cl))}return r})));return;
  }
  if(u.origin===self.location.origin){
    e.respondWith(caches.open(CACHE_NAME).then(c=>c.match(e.request).then(ca=>{const fp=fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r}).catch(()=>ca);return ca||fp})));return;
  }
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cl=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,cl))}return r}).catch(()=>caches.match(e.request)));
});