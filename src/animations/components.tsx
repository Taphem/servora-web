"use client";

import { Children, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";
import { fadeIn, fadeInUp, scaleIn, staggerContainer, staggerItem } from "@/animations/variants";

interface RevealComponentProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li";
}

/**
 * Named, scroll-triggered reveal patterns — the vocabulary every section
 * should reach for instead of writing one-off framer-motion props inline.
 * All three animate once, ~20% into the viewport (see AnimatedReveal).
 */
export function FadeIn(props: RevealComponentProps) {
  return <AnimatedReveal {...props} variants={fadeIn} />;
}

export function SlideUp(props: RevealComponentProps) {
  return <AnimatedReveal {...props} variants={fadeInUp} />;
}

export function ScaleIn(props: RevealComponentProps) {
  return <AnimatedReveal {...props} variants={scaleIn} />;
}

/** Alias of AnimatedReveal — the general-purpose reveal underlying FadeIn/SlideUp/ScaleIn. */
export const Reveal = AnimatedReveal;

interface StaggerProps {
  children: ReactNode;
  /** Seconds between each direct child's entrance. */
  stagger?: number;
  delayChildren?: number;
  className?: string;
  as?: "div" | "ul" | "ol";
}

/**
 * Staggers its direct children's entrance. Each child is wrapped in a
 * motion element automatically — callers just render plain children,
 * they don't need to know about variants.
 */
export function Stagger({
  children,
  stagger = 0.08,
  delayChildren = 0,
  className,
  as = "div",
}: StaggerProps) {
  const MotionTag = as === "ul" ? motion.ul : as === "ol" ? motion.ol : motion.div;
  const ItemTag = as === "ul" || as === "ol" ? motion.li : motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={staggerContainer(stagger, delayChildren)}
    >
      {Children.map(children, (child) => (
        <ItemTag variants={staggerItem}>{child}</ItemTag>
      ))}
    </MotionTag>
  );
}
