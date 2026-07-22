const CACHE_VERSION = 'division2-companion-v2-1.0.0'
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const scopeUrl = new URL(self.registration.scope)
const basePath = scopeUrl.pathname.endsWith('/') ? scopeUrl.pathname : `${scopeUrl.pathname}/`
const shellUrls = [basePath, `${basePath}manifest.webmanifest`]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(shellUrls)),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key.startsWith('division2-companion-') && ![CACHE_VERSION, RUNTIME_CACHE].includes(key))
        .map(key => caches.delete(key)),
    )).then(() => self.clients.claim()),
  )
})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) return cached
    if (request.mode === 'navigate') {
      return caches.match(basePath)
    }
    throw error
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }

  const isFreshData = url.pathname.includes('/data/') || url.pathname.includes('/catalog/')
  const isStaticAsset = ['script', 'style', 'image', 'font'].includes(request.destination)

  if (isFreshData) {
    event.respondWith(networkFirst(request))
  } else if (isStaticAsset) {
    event.respondWith(cacheFirst(request))
  }
})
