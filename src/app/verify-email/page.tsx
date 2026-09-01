import { Suspense } from "react";
import type { Metadata } from "next";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { VerifyEmailView } from "@/components/auth/VerifyEmailView";

export const metadata: Metadata = {
  title: "Verify your email — Servora",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <PageWrapper>
      <Suspense fallback={<VerifyingFallback />}>
        <VerifyEmailView />
      </Suspense>
    </PageWrapper>
  );
}

function VerifyingFallback() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center py-20">
      <Spinner size={28} className="text-text-brand" />
    </section>
  );
}
