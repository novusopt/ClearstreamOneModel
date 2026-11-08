/* Mishkah service worker: read offline.
 * - App shell & static assets (/_next/static, fonts, icons): cache-first.
 * - Qur'an data (/data/**, /api/surah/**): cache-first (it never changes for a deploy).
 * - Pages and RSC payloads: network-first, falling back to the cache, then to the home page.
 * - Recitation audio is streamed from other hosts and is not cached here.
 */
const VERSION = "mishkah-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.addAll(["/", "/library", "/review"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStatic = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/data/") ||
  url.pathname.startsWith("/api/surah/") ||
  url.pathname.startsWith("/icons/") ||
  /\.(woff2?|png|svg|ico)$/.test(url.pathname);

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(STATIC)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) (await caches.open(PAGES)).put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreVary: true });
    if (cached) return cached;
    if (request.mode === "navigate") return (await caches.match("/")) ?? Response.error();
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(isStatic(url) ? cacheFirst(request) : networkFirst(request));
});
