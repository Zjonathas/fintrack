/**
 * Service Worker do FinançasApp (PWA)
 * Habilita funcionamento offline do shell do app e instalação em dispositivos móveis/desktop.
 */

const CACHE_NAME = 'financas-app-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/icon.svg'
];

// Instalação do Service Worker e pré-carregamento do shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Ativação e limpeza de caches obsoletos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Estratégia de requisições:
// 1. API: Network-Only (garante dados financeiros sempre frescos)
// 2. Navegação (HTML): Network-first com fallback para index.html em cache
// 3. Recursos estáticos (JS, CSS, Imagens, Fontes): Cache-first com atualização em background (Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorar requisições não-GET ou extensões de terceiros (ex: chrome-extension://)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. Requisições da API do backend nunca devem vir de cache estático
  if (url.pathname.startsWith('/api') || url.port === '8000') {
    return;
  }

  // 2. Requisições de navegação do usuário (HTML da SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 3. Demais recursos estáticos: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Falha de rede quando offline
      });

      return cachedResponse || fetchPromise;
    })
  );
});
