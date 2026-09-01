"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { fadeInUp } from "@/animations/variants";

interface AnimatedRevealProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
  as?: "div" | "li";
}

/**
 * Scroll-triggered reveal used throughout the landing page. Animates once
 * when ~20% of the element enters the viewport, then leaves it alone —
 * intentionally not a scroll-linked/parallax effect.
 */
export function AnimatedReveal({
  children,
  className,
  variants = fadeInUp,
  delay = 0,
  as = "div",
}: AnimatedRevealProps) {
  const MotionTag = as === "li" ? motion.li : motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}
