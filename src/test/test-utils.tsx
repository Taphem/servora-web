import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/lib/auth/AuthProvider";

function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}

/** Renders with the same provider stack the real app mounts (see src/app/layout.tsx). */
export function renderWithProviders(ui: ReactElement) {
  return render(ui, { wrapper: Providers });
}

export * from "@testing-library/react";
