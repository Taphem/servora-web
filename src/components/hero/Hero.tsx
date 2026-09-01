"use client";

import { Container } from "@/components/ui/Container";
import { AnimatedReveal } from "@/components/ui/AnimatedReveal";
import { HeroSearch } from "@/components/hero/HeroSearch";
import { HeroVisual } from "@/components/hero/HeroVisual";
import { staggerContainer, staggerItem } from "@/animations/variants";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-48 lg:pb-32">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,var(--color-brand-100),transparent)]"
        aria-hidden="true"
      />

      <Container className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.1)}
        >
          <motion.h1
            variants={staggerItem}
            className="font-display text-[clamp(2.5rem,6vw,4.25rem)] font-medium leading-[1.05] tracking-tight text-ink-900"
          >
            Find the right service.
            <br />
            Right when you need it.
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mt-6 max-w-xl text-lg leading-relaxed text-text-secondary"
          >
            Discover trusted local professionals, compare your options side
            by side, and book in minutes — no phone tag, no guesswork.
          </motion.p>

          <motion.div variants={staggerItem} className="mt-9">
            <HeroSearch />
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-tertiary"
          >
            <span>Popular:</span>
            <a href="#categories" className="text-ink-700 underline decoration-border-strong underline-offset-4 hover:text-brand-700">
              AC repair
            </a>
            <a href="#categories" className="text-ink-700 underline decoration-border-strong underline-offset-4 hover:text-brand-700">
              Home cleaning
            </a>
            <a href="#categories" className="text-ink-700 underline decoration-border-strong underline-offset-4 hover:text-brand-700">
              Electrician
            </a>
          </motion.div>
        </motion.div>

        <AnimatedReveal delay={0.15} className="lg:pl-4">
          <HeroVisual />
        </AnimatedReveal>
      </Container>
    </section>
  );
}
