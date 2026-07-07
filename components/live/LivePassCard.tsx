"use client";

import type { SessionConfig } from "@/types/session";

type LivePassCardProps = {
  currentPass: number;
  totalPasses: number;
  isPassPaused: boolean;
  config: Pick<SessionConfig, "stations" | "roundsPerStation" | "workTime">;
};

export function LivePassCard({
  currentPass,
  totalPasses,
  isPassPaused,
  config,
}: LivePassCardProps) {
  return (
    <div className="flex min-h-32 flex-col rounded-sm bg-zinc-50 p-5 text-left">
      <p className="mb-1 text-xs font-semibold tracking-[0.1em] text-zinc-500">PASS</p>
      {isPassPaused ? (
        <p className="mb-2 text-xs leading-relaxed text-zinc-600">
          Up next: {config.stations} stations × {config.roundsPerStation} rounds, {config.workTime}s
          work
        </p>
      ) : null}
      <p className="mt-auto self-start font-display text-4xl font-bold leading-none tabular-nums text-zinc-900 md:text-5xl">
        {currentPass} of {totalPasses}
      </p>
    </div>
  );
}
