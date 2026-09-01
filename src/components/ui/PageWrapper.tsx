import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a page's content when it does NOT open with a Hero. The Hero
 * section handles its own spacing under the fixed navbar (it overlaps
 * intentionally); any other page needs this instead so its first
 * heading doesn't render underneath the fixed navbar.
 */
export function PageWrapper({ children, className }: PageWrapperProps) {
  return <div className={cn("pt-24 pb-16 sm:pt-28", className)}>{children}</div>;
}
