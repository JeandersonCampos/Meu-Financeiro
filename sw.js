const C = 'cf-v2';
const LOCAL = ['./', 'index.html', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'icon-180.png'];
const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => Promise.allSettled([c.addAll(LOCAL), c.add(new Request(LIB, { mode: 'no-cors' }))])));
  self.skipWaiting();
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => clients.claim())
));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).hostname.endsWith('supabase.co')) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(C).then(x => x.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
