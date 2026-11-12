/* Service worker : l'application s'ouvre hors connexion (fichiers de l'application seulement ; les données du cabinet sont
   gardées chiffrées dans IndexedDB par l'application, jamais dans ce cache). Mise à jour : nouvelle version au prochain lancement. */
const VERSION = 'dcm-1.0';
const FICHIERS = ['./', 'index.html', 'mobile.css', 'config.js', 'msal-browser.min.js', 'dcm-stockage.js', 'dcm-coffre.js', 'dcm-graph.js', 'dcm-moteur.js', 'dcm-vues.js', 'dcm-demarrage.js',
  'manifest.webmanifest', 'apple-touch-icon.png', 'icone-192.png', 'icone-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(l => Promise.all(l.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // Microsoft et SharePoint : jamais mis en cache
  // réseau d'abord (nouvelle version publiée), cache si hors connexion
  e.respondWith(fetch(e.request).then(r => { if (r.ok && r.type === 'basic') { const copie = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copie)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
