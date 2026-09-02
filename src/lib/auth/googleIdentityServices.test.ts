import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Each test needs a fresh module instance so the module-level
// `loadPromise` singleton doesn't leak state between tests.
async function freshLoader() {
  vi.resetModules();
  return import("@/lib/auth/googleIdentityServices");
}

describe("loadGoogleIdentityServices", () => {
  const originalGoogle = window.google;

  beforeEach(() => {
    document.getElementById("google-identity-services")?.remove();
    delete window.google;
  });

  afterEach(() => {
    document.getElementById("google-identity-services")?.remove();
    window.google = originalGoogle;
  });

  it("resolves immediately without injecting a script if window.google is already present", async () => {
    // @ts-expect-error -- minimal stub, only presence is checked
    window.google = { accounts: { id: {} } };
    const { loadGoogleIdentityServices } = await freshLoader();

    await loadGoogleIdentityServices();
    expect(document.getElementById("google-identity-services")).toBeNull();
  });

  it("injects exactly one script tag even when called concurrently multiple times", async () => {
    const { loadGoogleIdentityServices } = await freshLoader();

    const p1 = loadGoogleIdentityServices();
    const p2 = loadGoogleIdentityServices();
    const p3 = loadGoogleIdentityServices();

    expect(document.querySelectorAll("#google-identity-services")).toHaveLength(1);

    // @ts-expect-error -- simulate the script finishing load
    window.google = { accounts: { id: {} } };
    document.getElementById("google-identity-services")!.dispatchEvent(new Event("load"));

    await expect(Promise.all([p1, p2, p3])).resolves.toEqual([undefined, undefined, undefined]);
  });

  it("rejects (without leaving the page stuck) when the script fails to load", async () => {
    const { loadGoogleIdentityServices } = await freshLoader();

    const promise = loadGoogleIdentityServices();
    document.getElementById("google-identity-services")!.dispatchEvent(new Event("error"));

    await expect(promise).rejects.toThrow(/couldn't load/i);
  });

  it("rejects when called outside a browser environment (no window)", async () => {
    const { loadGoogleIdentityServices } = await freshLoader();
    const originalWindow = globalThis.window;
    // @ts-expect-error -- simulating SSR
    delete globalThis.window;

    await expect(loadGoogleIdentityServices()).rejects.toThrow(/browser/i);

    globalThis.window = originalWindow;
  });
});
