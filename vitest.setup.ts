import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL's auto-cleanup only self-registers when `globals: true` is set; this
// project keeps that off (so describe/it/expect stay explicit imports and
// ESLint can see them), so cleanup is wired up here instead.
afterEach(() => {
  cleanup();
});
