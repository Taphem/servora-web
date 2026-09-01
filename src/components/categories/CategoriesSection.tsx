import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryCard } from "@/components/categories/CategoryCard";
import { categories } from "@/data/categories";

export function CategoriesSection() {
  return (
    <section id="categories" className="py-[var(--space-section-y)]">
      <Container>
        <SectionHeading
          eyebrow="Browse"
          title="Popular categories"
          description="From emergency repairs to recurring help — start with a category or search for exactly what you need."
        />

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </ul>
      </Container>
    </section>
  );
}
