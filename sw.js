// Разряд — service worker. При обновлении игры увеличьте номер версии.
const VERSION = 'razryad-v6';
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
  './fonts/jetbrains-mono-cyrillic-600-normal.woff2',
  './fonts/jetbrains-mono-cyrillic-700-normal.woff2',
  './fonts/jetbrains-mono-cyrillic-800-normal.woff2',
  './fonts/jetbrains-mono-latin-600-normal.woff2',
  './fonts/jetbrains-mono-latin-700-normal.woff2',
  './fonts/jetbrains-mono-latin-800-normal.woff2',
  './fonts/manrope-cyrillic-600-normal.woff2',
  './fonts/manrope-cyrillic-700-normal.woff2',
  './fonts/manrope-cyrillic-800-normal.woff2',
  './fonts/manrope-latin-600-normal.woff2',
  './fonts/manrope-latin-700-normal.woff2',
  './fonts/manrope-latin-800-normal.woff2',
  './fonts/unbounded-cyrillic-800-normal.woff2',
  './fonts/unbounded-latin-800-normal.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Страница: сначала сеть (чтобы обновления приходили сразу), без сети — из кэша.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Остальное (иконки, шрифты): из кэша, параллельно обновляем в фоне.
  if (new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }))
  );
});
