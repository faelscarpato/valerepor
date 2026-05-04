// Service worker leve para notificações e cache básico (offline-friendly)
const CACHE = "ap-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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

// Periodic Background Sync (Chrome Android, requer instalação como PWA)
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
