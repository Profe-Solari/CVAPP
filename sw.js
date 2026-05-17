/*
 * ════════════════════════════════════════════════════════════
 * SERVICE WORKER — GestorAlumnos PWA
 *
 * Este archivo permite que la app funcione SIN INTERNET.
 * Guarda una copia de los archivos principales en el navegador
 * y los sirve cuando no hay conexión disponible.
 *
 * ¿Cómo funciona?
 * 1. "install" → guarda los archivos en el cache local
 * 2. "fetch"   → cuando la app pide un archivo, primero lo
 *                busca en el cache y solo va a internet si no
 *                lo encuentra.
 *
 * Para actualizar la app, cambiá el número de versión en
 * CACHE_NAME (ej: 'ga-v2').
 * ════════════════════════════════════════════════════════════
 */

const CACHE_NAME = 'ga-v1';

// Archivos que queremos guardar para uso offline
const ARCHIVOS_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

// ── INSTALACIÓN: guardar archivos en cache ──
self.addEventListener('install', evento => {
  console.log('[SW] Instalando Service Worker…');
  evento.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cacheando archivos principales');
      return cache.addAll(ARCHIVOS_CACHE).catch(err => {
        // Si falla alguno (ej: sin internet en la primera instalación), continuamos igual
        console.warn('[SW] Algunos archivos no pudieron cachearse:', err);
      });
    })
  );
  self.skipWaiting(); // Activar inmediatamente sin esperar
});

// ── ACTIVACIÓN: limpiar caches viejos ──
self.addEventListener('activate', evento => {
  console.log('[SW] Activando Service Worker…');
  evento.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME) // Todos los caches que NO son el actual
          .map(key => {
            console.log('[SW] Eliminando cache viejo:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim(); // Tomar control de todas las pestañas abiertas
});

// ── INTERCEPTAR PETICIONES: cache first, luego red ──
self.addEventListener('fetch', evento => {
  // Solo manejamos peticiones GET
  if (evento.request.method !== 'GET') return;

  // Las peticiones a la API de Anthropic/Firebase siempre van a la red
  const url = evento.request.url;
  if (url.includes('anthropic.com') || url.includes('googleapis.com/google.firestore') || url.includes('firestore.googleapis.com')) {
    return; // No interceptamos, dejar que vaya directo a internet
  }

  evento.respondWith(
    caches.match(evento.request).then(respuestaCache => {
      if (respuestaCache) {
        // Encontramos en cache → lo servimos inmediatamente
        return respuestaCache;
      }
      // No está en cache → buscamos en internet
      return fetch(evento.request).then(respuestaRed => {
        // Si la respuesta es válida, la guardamos en cache para la próxima vez
        if (respuestaRed && respuestaRed.status === 200 && respuestaRed.type !== 'opaque') {
          const cacheClone = respuestaRed.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(evento.request, cacheClone);
          });
        }
        return respuestaRed;
      }).catch(() => {
        // Sin internet y sin cache → mostramos página de offline básica
        return new Response(
          '<h1 style="font-family:sans-serif;text-align:center;margin-top:4rem">Sin conexión 📡</h1><p style="text-align:center">La app está funcionando en modo offline. Los datos locales siguen disponibles.</p>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      });
    })
  );
});
