import { Hero } from "@/components/hero/Hero";
import { CategoriesSection } from "@/components/categories/CategoriesSection";
import { ProvidersSection } from "@/components/providers/ProvidersSection";
import { DiscoverCompareBookSection } from "@/components/scroll-story/DiscoverCompareBookSection";
import { AIShowcaseSection } from "@/components/ai/AIShowcaseSection";
import { TrustSection } from "@/components/trust/TrustSection";
import { TestimonialsSection } from "@/components/testimonials/TestimonialsSection";
import { BusinessCtaSection } from "@/components/business/BusinessCtaSection";
import { FinalCtaSection } from "@/components/final-cta/FinalCtaSection";

export default function Home() {
  return (
    <>
      <Hero />
      <CategoriesSection />
      <ProvidersSection />
      <DiscoverCompareBookSection />
      <AIShowcaseSection />
      <TrustSection />
      <TestimonialsSection />
      <BusinessCtaSection />
      <FinalCtaSection />
    </>
  );
}
