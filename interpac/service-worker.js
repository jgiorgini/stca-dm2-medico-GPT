// Cambiá la versión cuando actualices archivos para forzar refresh
const CACHE_NAME = "interpac-v1";

const ASSETS = [
  "/stca-dm2-medico-GPT/interpac/",
  "/stca-dm2-medico-GPT/interpac/index.html",
  "/stca-dm2-medico-GPT/interpac/style-pac.css",
  "/stca-dm2-medico-GPT/interpac/interpac.js",
  "/stca-dm2-medico-GPT/interpac/manifest.webmanifest",
  "/stca-dm2-medico-GPT/interpac/icons/icon-192.png",
  "/stca-dm2-medico-GPT/interpac/icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
