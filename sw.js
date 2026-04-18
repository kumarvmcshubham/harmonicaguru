// sw.js
// HarmonicaGuru — Service Worker

const CACHE_NAME = 'harmonicaguru-v3';
const BASE = '/harmonicaguru';

const SHELL_FILES = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/css/main.css',
  BASE + '/css/lesson.css',
  BASE + '/js/app.js',
  BASE + '/js/auth.js',
  BASE + '/js/audio.js',
  BASE + '/js/firebase-config.js',
  BASE + '/js/lesson.js',
  BASE + '/js/practice.js',
  BASE + '/js/request.js',
  BASE + '/js/songs.js',
  BASE + '/js/timer.js',
  BASE + '/js/voice.js',
  BASE + '/js/yin.js',
  BASE + '/assets/data/lessons.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => {
      self.clients.claim();
      // Tell all open tabs that a new version is active
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
      });
    })
  );
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // Always network for Firebase, Groq, Google APIs
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('firebase') ||
    url.includes('groq.com') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com/firebasejs')
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache first for app shell
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match(BASE + '/index.html');
        }
      });
    })
  );
});
