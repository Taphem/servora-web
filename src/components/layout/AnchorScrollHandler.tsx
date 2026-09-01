"use client";

import { useEffect } from "react";
import { useLenis } from "lenis/react";

/**
 * Routes in-page `#hash` link clicks through Lenis instead of the browser's
 * native instant jump. Without this, Lenis's internal scroll state falls
 * out of sync with a native jump and "corrects" itself on the next scroll,
 * producing a jarring snap-back.
 */
export function AnchorScrollHandler() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest('a[href^="#"]');
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.length < 2) return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -84 });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [lenis]);

  return null;
}
