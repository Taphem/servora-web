import {
  Hammer,
  SprayCan,
  Zap,
  Wind,
  Scissors,
  Camera,
  GraduationCap,
  Dumbbell,
  Car,
  Smartphone,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

const iconMap: Record<string, ComponentType<LucideProps>> = {
  Hammer,
  SprayCan,
  Zap,
  Wind,
  Scissors,
  Camera,
  GraduationCap,
  Dumbbell,
  Car,
  Smartphone,
};

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = iconMap[name] ?? Hammer;
  return <Icon {...props} />;
}
