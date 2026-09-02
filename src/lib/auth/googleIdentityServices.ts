const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const SCRIPT_ID = "google-identity-services";

/**
 * Module-level singleton so concurrent/repeated calls (Login and Signup
 * modals mounting and unmounting as the user switches between them,
 * React StrictMode's double-invoke, multiple components on one page)
 * never inject the script twice or race each other — everyone awaits
 * the same promise, and it's only created once.
 */
let loadPromise: Promise<void> | null = null;

/**
 * Loads Google Identity Services' script exactly once and resolves once
 * `window.google.accounts.id` is ready to use. Safe to call from
 * multiple components; safe to call repeatedly. Never touches
 * window/document outside a browser (guards SSR/build), and reuses a
 * script tag already present in the page (e.g. a fast remount finding
 * the previous script still loading) instead of adding a second one.
 */
export function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Identity Services can only load in the browser."));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const onLoad = () => {
      if (window.google?.accounts?.id) {
        resolve();
      } else {
        reject(new Error("Google Identity Services script loaded but did not initialize."));
      }
    };
    const onError = () => {
      // Let a future call try again instead of permanently caching a failure.
      loadPromise = null;
      reject(new Error("Couldn't load Google Identity Services."));
    };

    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
  });

  return loadPromise;
}
