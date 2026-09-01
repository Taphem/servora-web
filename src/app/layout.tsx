import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { MotionConfig } from "framer-motion";
import { SmoothScrollProvider } from "@/components/layout/SmoothScrollProvider";
import { AnchorScrollHandler } from "@/components/layout/AnchorScrollHandler";
import { ToastProvider } from "@/components/ui/Toast";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { env } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const siteUrl = env.siteUrl;
const title = "Servora — Find the right service. Right when you need it.";
const description =
  "Discover trusted local professionals, compare your options, and book in minutes.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Servora",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <MotionConfig reducedMotion="user">
          <SmoothScrollProvider>
            <ToastProvider>
              <AnchorScrollHandler />
              <Navbar />
              <main id="top" className="flex-1">
                {children}
              </main>
              <Footer />
            </ToastProvider>
          </SmoothScrollProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
