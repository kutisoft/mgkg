// Saves the app on the phone so it opens with no internet.
// The page itself is fetched fresh whenever there is internet, so updates show straight away.
// Bump VERSION whenever you change index.html.
const VERSION = 'mgkg-v3';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache so we never save a stale copy.
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const save = res => {
    if (res && (res.ok || res.type === 'opaque')) {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req, copy));
    }
    return res;
  };
  // The app page: try the internet first, fall back to the saved copy when offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-store' }).then(save)
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html'))));
    return;
  }
  // Icons and fonts: saved copy first, then the internet.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(save)));
});
