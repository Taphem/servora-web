import { BadgeCheck } from "lucide-react";
import type { VerificationSignal } from "@/types/domain";
import { trustSignals } from "@/data/trust-signals";
import { Tooltip } from "@/components/ui/Tooltip";

export function TrustSignalList({ signals }: { signals: VerificationSignal[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {signals.map((signalId) => {
        const signal = trustSignals.find((s) => s.id === signalId);
        if (!signal) return null;
        return (
          <li key={signalId}>
            <Tooltip content={signal.description}>
              <span className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">
                <BadgeCheck size={12} aria-hidden />
                {signal.label}
              </span>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}
