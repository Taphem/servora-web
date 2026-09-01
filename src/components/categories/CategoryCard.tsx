import { ArrowUpRight } from "lucide-react";
import type { Category } from "@/types/domain";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";
import { staggerItem } from "@/animations/variants";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <AnimatedReveal as="li" variants={staggerItem} className="list-none">
      <a
        href={`#explore`}
        className="group flex h-full flex-col justify-between gap-6 rounded-lg border border-border-default bg-surface-raised p-5 transition-all duration-[var(--duration-base)] ease-[var(--ease-out-premium)] hover:-translate-y-1 hover:border-brand-300 hover:shadow-md"
      >
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-50 text-brand-700 transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-premium)] group-hover:-rotate-6 group-hover:scale-110">
            <CategoryIcon name={category.icon} size={20} aria-hidden />
          </span>
          <ArrowUpRight
            size={16}
            className="text-text-tertiary opacity-0 transition-opacity duration-[var(--duration-base)] group-hover:opacity-100"
            aria-hidden
          />
        </div>
        <div>
          <h3 className="font-medium text-ink-900">{category.name}</h3>
          <p className="mt-1 text-sm text-text-tertiary">
            {category.providerCount}+ providers
          </p>
        </div>
      </a>
    </AnimatedReveal>
  );
}
