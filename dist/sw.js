// Service worker do ValeRepor: cache básico do app shell + suporte a notificações.
// Observação: dados operacionais continuam no navegador; exporte backup JSON regularmente.
const CACHE = "valerepor-shell-v3";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/robots.txt",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL).catch(() => undefined)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function putInCache(request, response) {
  try {
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
    }
  } catch {
    // cache pode falhar por quota; o app continua funcionando online
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          putInCache("/index.html", response);
          return response;
        })
        .catch(() => caches.match("/index.html").then((cached) => cached || caches.match("/")))
    );
    return;
  }

  if (url.pathname.startsWith("/assets/") || url.pathname.endsWith(".png") || url.pathname.endsWith(".ico") || url.pathname.endsWith(".svg")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            putInCache(request, response);
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/alertas";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "verifica-validades") {
    event.waitUntil(
      (async () => {
        const all = await clients.matchAll({ includeUncontrolled: true });
        all.forEach((c) => c.postMessage({ type: "verifica-validades" }));
      })()
    );
  }
});
