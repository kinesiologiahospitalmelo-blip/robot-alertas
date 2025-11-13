self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open("robot-alertas-cache").then((cache) => {
            return cache.addAll([
                "/static/index.html",
                "/static/styles.css",
                "/static/app.js"
            ]);
        })
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});