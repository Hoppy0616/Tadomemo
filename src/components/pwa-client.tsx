"use client";

import { useEffect } from "react";

export function PWAClient() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        // Optional: listen for updates
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              // New content is available; it will be used on next load.
              // Could show a toast to refresh here.
              // console.info("New content available");
            }
          });
        });
      } catch (e) {
        // console.error("SW registration failed", e);
      }
    };
    // delay until window load for stability
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}

