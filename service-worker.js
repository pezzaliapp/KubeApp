// service-worker.js — KubeApp v0.0.2 + GA safe
const CACHE_VERSION = "kubeapp-v002";  // bump versione cache
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./three.js",
  "./cube.js",
  "./icons/favicon-16x16.png",
  "./icons/favicon-32x32.png",
  "./icons/apple-touch-icon.png",
  "./icons/meta-image.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting(); // attiva subito la nuova versione
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("kubeapp-") && k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1) NON intercettare richieste esterne (Analytics, CDN, ecc.)
  if (url.origin !== self.location.origin) {
    // niente respondWith ⇒ il browser fa la fetch normale
    return;
  }

  const isHTML =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  // 2) HTML: network-first con fallback cache (index offline)
  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // 3) Statici (script, css, immagini…): cache-first con fallback rete
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type === "opaque") {
          return res;
        }
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        return res;
      });
    })
  );
});
