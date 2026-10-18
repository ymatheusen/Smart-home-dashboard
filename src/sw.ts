/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
  type PrecacheEntry,
} from "workbox-precaching";
import { registerRoute } from "workbox-routing";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: (PrecacheEntry | string)[];
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();

// Only this app's navigations use the offline shell. No device/API responses
// or other GitHub Pages projects are cached by the app.
const scopePath = new URL(self.registration.scope).pathname;
registerRoute(
  ({ request, url }) =>
    request.mode === "navigate" &&
    url.origin === self.location.origin &&
    url.pathname.startsWith(scopePath) &&
    !url.pathname.startsWith(`${scopePath}download/`) &&
    !url.pathname.startsWith(`${scopePath}android/`),
  createHandlerBoundToURL("index.html"),
);

// Updates wait until the user chooses to reopen the app.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});
