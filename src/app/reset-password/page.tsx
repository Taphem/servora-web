import { Suspense } from "react";
import type { Metadata } from "next";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { ResetPasswordView } from "@/components/auth/ResetPasswordView";

export const metadata: Metadata = {
  title: "Reset your password — Servora",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <PageWrapper>
      <Suspense fallback={<LoadingFallback />}>
        <ResetPasswordView />
      </Suspense>
    </PageWrapper>
  );
}

function LoadingFallback() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center py-20">
      <Spinner size={28} className="text-text-brand" />
    </section>
  );
}
