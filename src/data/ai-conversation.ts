import type { AIMessage } from "@/types/domain";

/**
 * Scripted demo conversation for the AI assistant showcase. This is a
 * fixed illustration of the intended pipeline (constraint extraction →
 * search → availability check → ranked match), not a live model — see
 * servora-docs/05-ai-ml/ai-agent.md for the real capability boundary
 * (confirmation is always required before booking or payment actions).
 */
export const aiConversation: AIMessage[] = [
  {
    id: "ai-1",
    role: "user",
    text: "My AC isn't cooling. I need someone tomorrow morning.",
  },
  {
    id: "ai-2",
    role: "assistant",
    text: "Got it — AC repair, tomorrow morning. I found 6 available specialists within 5 km.",
  },
  {
    id: "ai-3",
    role: "assistant",
    text: "Here's the best match based on rating, distance and availability.",
    match: {
      providerName: "CoolCare Services",
      rating: 4.9,
      distanceKm: 2.1,
      availability: "Tomorrow · 9:00 AM",
      priceRange: "₹800–₹1,200",
    },
  },
];
