import { cn } from "@/lib/utils";
import type { AIRole } from "@/types/domain";

export function ChatBubble({ role, text }: { role: AIRole; text: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <p
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-brand-600 text-white"
            : "rounded-bl-sm bg-white text-ink-800",
        )}
      >
        {text}
      </p>
    </div>
  );
}
