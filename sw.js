const C = 'cf-v3';
const LOCAL = ['./', 'index.html', 'manifest.json', 'logo.svg', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'icon-180.png'];
const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => Promise.allSettled([c.addAll(LOCAL), c.add(new Request(LIB, { mode: 'no-cors' }))])));
  self.skipWaiting();
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => clients.claim())
));
// rede com tempo limite: com sinal fraco, abre a cópia guardada em vez de ficar esperando
const comTempo = (req, ms) => new Promise((ok, no) => {
  const t = setTimeout(() => no(new Error('timeout')), ms);
  fetch(req).then(r => { clearTimeout(t); ok(r); }, e => { clearTimeout(t); no(e); });
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.hostname.endsWith('supabase.co')) return;
  e.respondWith((async () => {
    const c = await caches.open(C);
    if (u.origin !== location.origin) {
      // bibliotecas externas: usa a cópia guardada e atualiza em segundo plano
      const guardado = await c.match(e.request);
      const rede = fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; }).catch(() => null);
      return guardado || (await rede) || Response.error();
    }
    try {
      const r = await comTempo(e.request, 4000);
      if (r.ok) c.put(e.request, r.clone());
      return r;
    } catch {
      return (await c.match(e.request, { ignoreSearch: true })) || (e.request.mode === 'navigate' ? await c.match('index.html') : null) || Response.error();
    }
  })());
});
