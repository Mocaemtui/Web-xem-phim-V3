"use client";

import { useEffect } from "react";

export default function PWARegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Disable Service Worker registration to fix cache blocking issues
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) console.log("Service Worker unregistered to fix cache issues");
          });
        }
      });
      return;
    }
  }, []);

  return null;
}
