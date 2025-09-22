// Service worker with Workbox; updates caches using Stale-While-Revalidate

const cacheName = 'stale-with-revalidate'
const htmlCacheName = 'network-first-html'
const allowedCacheNames = new Set([cacheName, htmlCacheName])

// import workbox 
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js')
const { routing, strategies } = workbox

// serve navigations with NetworkFirst so updated HTML references fresh assets
routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new strategies.NetworkFirst({ cacheName: htmlCacheName }),
)

// implements staleWhileRevalidate for non-navigation requests
routing.registerRoute(
  ({ request }) => request.mode !== 'navigate',
  new strategies.StaleWhileRevalidate({ cacheName }),
)

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData()
        const title = formData.get('title') || ''
        const text = formData.get('text') || ''
        const sharedUrl = formData.get('url') || ''
        const params = new URLSearchParams({ title, text, url: sharedUrl })
        return Response.redirect('/?' + params.toString(), 303)
      })()
    )
  }
})


// removes all caches not tracked in allowedCacheNames
const invalidateOldCache = async () => {
  const keys = await caches.keys()
  const oldKeys = keys.filter((key) => !allowedCacheNames.has(key))

  return Promise.all(oldKeys.map((key) => caches.delete(key)))
}

// runs invalidateOldCache on activation
self.addEventListener('activate', (e) => e.waitUntil(invalidateOldCache()))
