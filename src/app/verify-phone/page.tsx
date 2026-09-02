import type { Metadata } from "next";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { VerifyPhoneView } from "@/components/auth/VerifyPhoneView";

export const metadata: Metadata = {
  title: "Verify your phone number — Servora",
  robots: { index: false, follow: false },
};

export default function VerifyPhonePage() {
  return (
    <PageWrapper>
      <VerifyPhoneView />
    </PageWrapper>
  );
}
