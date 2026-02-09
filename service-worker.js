/* Simple offline cache for GitHub Pages (static) */
const CACHE = "crm-score-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./app.html",
  "./styles/app.css",
  "./js/config.js",
  "./js/firebase.js",
  "./js/auth.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./assets/favicon.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => (k !== CACHE) ? caches.delete(k) : Promise.resolve()))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      if (req.method === "GET" && res.status === 200 && req.url.startsWith(self.location.origin)) {
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match("./")))
  );
});
