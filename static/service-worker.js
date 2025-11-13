self.addEventListener("install", e => {
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    console.log("SW activo");
});

self.addEventListener("fetch", event => {});
