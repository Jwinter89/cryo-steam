/**
 * Cold Creek — Service Worker
 * Enables offline caching and PWA install prompt.
 */

const CACHE_NAME = 'cold-creek-v7';

// Core assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/game.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/landing-bg.jpg',
  '/facility-bg.jpg',
  '/modes-bg.jpg',
  '/gameplay-bg.jpg',
  '/henry-character.png',
  '/favicon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/robots.txt',
  '/sitemap.xml',
  '/ads.txt',
  '/src/engine/simulationTick.js',
  '/src/engine/cascadeEngine.js',
  '/src/engine/processVariable.js',
  '/src/data/stabilizerConfig.js',
  '/src/data/refrigerationConfig.js',
  '/src/data/cryogenicConfig.js',
  '/src/data/amineConfig.js',
  '/src/events/eventSystem.js',
  '/src/events/equipmentEvents.js',
  '/src/events/refrigerationEvents.js',
  '/src/events/cryogenicEvents.js',
  '/src/events/amineEvents.js',
  '/src/events/pigEvents.js',
  '/src/events/crisisScenarios.js',
  '/src/ui/alarmManager.js',
  '/src/ui/faceplateManager.js',
  '/src/ui/facilityViews.js',
  '/src/ui/gaugeManager.js',
  '/src/ui/pidDiagram.js',
  '/src/ui/pidZoom.js',
  '/src/ui/trendManager.js',
  '/src/ui/pnlManager.js',
  '/src/ui/eventActionPanel.js',
  '/src/ui/henry.js',
  '/src/ui/kimrayWidget.js',
  '/src/ui/gcDisplay.js',
  '/src/ui/multiPlantManager.js',
  '/src/ui/fieldNotes.js',
  '/src/ui/learnMode.js',
  '/src/ui/objectives.js',
  '/src/ui/achievements.js',
  '/src/ui/careerProgression.js',
  '/src/ui/operatorProfile.js',
  '/src/ui/challenges.js',
  '/src/ui/debriefScreen.js',
  '/src/ui/glossary.js',
  '/src/ui/colorBlindMode.js',
  '/src/ui/leaderboard.js',
  '/src/ui/adManager.js',
  '/src/audio/audioManager.js',
  '/src/capacitor/storageBridge.js',
];

// Install — precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching core assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      // Only skip waiting after precache is complete
      return self.skipWaiting();
    })
  );
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network-first with cache fallback (same-origin only)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests, chrome-extension URLs, and external scripts
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;
  if (event.request.url.includes('googlesyndication.com')) return;
  if (event.request.url.includes('googleads.')) return;
  if (event.request.url.includes('doubleclick.net')) return;

  // Only cache same-origin requests to prevent unbounded third-party caching
  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful same-origin responses for offline use
        if (response.ok && isSameOrigin) {
          const responseClone = response.clone();
          // Strip query params for cache key to match precache entries
          const cacheUrl = requestUrl.origin + requestUrl.pathname;
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(cacheUrl, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache (strip query params to match)
        const cacheUrl = requestUrl.origin + requestUrl.pathname;
        return caches.match(cacheUrl).then((cached) => {
          if (cached) return cached;
          // Also try the original request URL as-is
          return caches.match(event.request);
        }).then((cached) => {
          if (cached) return cached;
          // If it's a navigation request, return the cached index
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
