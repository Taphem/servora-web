import { categories } from "@/data/categories";
import { gradientForSeed } from "@/lib/media";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

interface ProviderMediaProps {
  seed: string;
  categoryId: string;
  className?: string;
}

/**
 * Generated abstract composition standing in for a provider photo — see
 * src/lib/media.ts. Deterministic per provider so the same card always
 * renders the same art.
 */
export function ProviderMedia({ seed, categoryId, className }: ProviderMediaProps) {
  const category = categories.find((c) => c.id === categoryId);
  const gradient = gradientForSeed(seed);

  return (
    <div
      className={cn("relative flex items-center justify-center overflow-hidden", className)}
      style={{ backgroundImage: gradient }}
      role="img"
      aria-label={`${category?.name ?? "Service"} provider`}
    >
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, white 0%, transparent 45%), radial-gradient(circle at 80% 75%, white 0%, transparent 40%)",
        }}
        aria-hidden="true"
      />
      <CategoryIcon
        name={category?.icon ?? "Hammer"}
        size={40}
        strokeWidth={1.4}
        className="relative text-white/90"
        aria-hidden="true"
      />
    </div>
  );
}
