"use client";

import { useEffect } from "react";

export default function PWARegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const handleLoad = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registered successfully with scope:", reg.scope);
          })
          .catch((err) => {
            console.error("Service Worker registration failed:", err);
          });
      };

      // Register service worker after window load to prevent blocking main thread
      if (document.readyState === "complete") {
        handleLoad();
      } else {
        window.addEventListener("load", handleLoad);
        return () => window.removeEventListener("load", handleLoad);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Listen for custom install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Store event globally for custom install buttons to trigger
      (window as any).deferredPrompt = e;
      
      // Dispatch custom event to notify components that the app is installable
      window.dispatchEvent(new Event("pwa_installable"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  return null;
}
