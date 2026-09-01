"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { ChatBubble } from "@/components/ai/ChatBubble";
import { AIMatchCard } from "@/components/ai/AIMatchCard";
import { aiConversation } from "@/data/ai-conversation";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const [userMsg, assistantMsg, matchMsg] = aiConversation;

export function AIShowcaseSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const userOpacity = useTransform(scrollYProgress, [0, 0.12], [0, 1]);
  const userY = useTransform(scrollYProgress, [0, 0.12], [16, 0]);

  const assistantOpacity = useTransform(scrollYProgress, [0.22, 0.36], [0, 1]);
  const assistantY = useTransform(scrollYProgress, [0.22, 0.36], [16, 0]);

  const matchOpacity = useTransform(scrollYProgress, [0.5, 0.66], [0, 1]);
  const matchY = useTransform(scrollYProgress, [0.5, 0.66], [16, 0]);

  return (
    <section
      id="ai-assistant"
      className="border-t border-border-subtle bg-ink-950 py-[var(--space-section-y)] text-white"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Tell us what you need"
              tone="inverse"
              title="Just say what's going on. We'll take it from there."
              description="Describe the job in your own words — Servora shows you who's actually free nearby, with real ratings and pricing. No forms to fill out."
            />
            <div className="mt-8 flex flex-wrap gap-2">
              <Badge tone="inverse" icon={<Sparkles size={12} aria-hidden />}>
                Shows real availability
              </Badge>
              <Badge tone="inverse">Always confirms before booking</Badge>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-400">
              You always review and confirm before anything is booked or
              paid for.
            </p>
          </div>

          {reduceMotion ? (
            <div className="rounded-xl border border-white/10 bg-ink-900 p-5 shadow-lg">
              <div className="flex flex-col gap-3">
                <ChatBubble role={userMsg.role} text={userMsg.text} />
                <ChatBubble role={assistantMsg.role} text={assistantMsg.text} />
                {matchMsg.match ? <AIMatchCard {...matchMsg.match} /> : null}
              </div>
            </div>
          ) : (
            <div ref={trackRef} className="relative h-[180vh]">
              <div className="sticky top-28 flex flex-col justify-center">
                <div className="rounded-xl border border-white/10 bg-ink-900 p-5 shadow-lg">
                  <div className="flex flex-col gap-3">
                    <motion.div style={{ opacity: userOpacity, y: userY }}>
                      <ChatBubble role={userMsg.role} text={userMsg.text} />
                    </motion.div>
                    <motion.div style={{ opacity: assistantOpacity, y: assistantY }}>
                      <ChatBubble role={assistantMsg.role} text={assistantMsg.text} />
                    </motion.div>
                    {matchMsg.match ? (
                      <motion.div style={{ opacity: matchOpacity, y: matchY }}>
                        <AIMatchCard {...matchMsg.match} />
                      </motion.div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
