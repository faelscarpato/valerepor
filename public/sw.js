// Service worker do ValeRepor: cache básico do app shell + suporte a notificações.
// Observação: dados operacionais continuam no navegador; exporte backup JSON regularmente.
const CACHE = "valerepor-shell-v4";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/robots.txt",
];

const offlineHtml = () =>
  new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>ValeRepor offline</title></head><body style="font-family:system-ui,sans-serif;padding:24px"><h1>ValeRepor</h1><p>Sem conexão e sem cache disponível para esta tela. Abra o app online uma vez e tente novamente.</p></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url))))
  );
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
    if (response && response.ok && response.type !== "opaque") {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
    }
  } catch {
    // cache pode falhar por quota; o app continua funcionando online
  }
}

async function appShellFallback() {
  const cachedIndex = await caches.match("/index.html");
  const cachedRoot = await caches.match("/");
  return cachedIndex || cachedRoot || offlineHtml();
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
          if (response.ok) putInCache("/index.html", response);
          return response.ok ? response : appShellFallback();
        })
        .catch(() => appShellFallback())
    );
    return;
  }

  if (url.pathname.startsWith("/assets/") || /\.(png|ico|svg|webp|jpg|jpeg|css|js|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) putInCache(request, response);
            return response.ok ? response : cached || Response.error();
          })
          .catch(() => cached || Response.error());
        return cached || network;
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => response)
      .catch(async () => (await caches.match(request)) || new Response("Offline", { status: 503, statusText: "Offline" }))
  );
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
