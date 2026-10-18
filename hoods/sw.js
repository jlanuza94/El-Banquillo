// Hood Cleaners sin conexión: la página se pide primero a la red (para tener siempre la última versión)
// y, si no hay internet, sale de la caché. three.js y las letras se guardan la primera vez que se usan.
const CACHE = 'hood-cleaners-__HV__';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'manifest.webmanifest', 'icono-180.png', 'icono-192.png']))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('hood-cleaners-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.url.includes('api.github.com')) return;
  const guardar = res => { if (res && (res.ok || res.type === 'opaque')) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); } return res; };
  if (r.mode === 'navigate' || new URL(r.url).origin === location.origin) e.respondWith(fetch(r).then(guardar).catch(() => caches.match(r, { ignoreSearch: true }).then(x => x || caches.match('./'))));
  else e.respondWith(caches.match(r).then(x => x || fetch(r).then(guardar)));
});
