const CACHE_NAME="conduit-rack-v1.93-method-below-inputs";
const APP_FILES=[
  "./",
  "./index.html",
  "./single.html",
  "./manifest.webmanifest",
  "./manifest-single.webmanifest",
  "./service-worker.js",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener("message", event => {
  if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting();
});
self.addEventListener("fetch", event => {
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  // Always network-first for the app shell so mark math updates are not stuck.
  if(
    url.pathname.endsWith("/")||
    url.pathname.endsWith("/index.html")||
    url.pathname.endsWith("/single.html")||
    url.pathname.endsWith("service-worker.js")
  ){
    event.respondWith(
      fetch(event.request,{cache:"no-store"}).then(response=>{
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
        return response;
      }).catch(()=>caches.match(event.request).then(r=>r||caches.match("./index.html")))
    );
    return;
  }
  event.respondWith(
    fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
      return response;
    }).catch(()=>caches.match(event.request))
  );
});
