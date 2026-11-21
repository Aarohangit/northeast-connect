import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { flushOutbox } from './lib/outbox.js'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// The whole app shell is cached, so it opens with no network at all.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// Map tiles the person has already seen stay available offline.
registerRoute(
  ({ url }) => url.hostname.endsWith('tile.openstreetmap.org'),
  new CacheFirst({
    cacheName: 'map-tiles',
    plugins: [new ExpirationPlugin({ maxEntries: 800, maxAgeSeconds: 30 * 24 * 3600 })],
  }),
)

// Background Sync: the browser wakes us when connectivity returns, even if the app is closed
// (Chrome on Android). Throwing tells the browser to try again later.
self.addEventListener('sync', (event) => {
  if (event.tag !== 'flush-outbox') return
  event.waitUntil(
    flushOutbox().then((remaining) => {
      if (remaining > 0) throw new Error(`${remaining} SOS request(s) still waiting`)
    }),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'flush-outbox') event.waitUntil(flushOutbox())
})
