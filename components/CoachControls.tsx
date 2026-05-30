"use client";

import type { CoachConnectionStatus } from "@/lib/useNotaCoach";

type CoachControlsProps = {
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  available: boolean;
  status: CoachConnectionStatus;
};

function statusLabel(available: boolean, status: CoachConnectionStatus) {
  if (!available) return "Not configured — pre-recorded cues will be used";
  switch (status) {
    case "connected":
      return "Live — NOTA Coach is hosting";
    case "connecting":
      return "Connecting to NOTA Coach…";
    case "error":
      return "Connection issue — falling back to cues";
    default:
      return "Will connect when the session starts";
  }
}

export function CoachControls({
  enabled,
  onEnabledChange,
  available,
  status,
}: CoachControlsProps) {
  return (
    <section className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-zinc-900">NOTA Coach (AI host)</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Live spoken commentary replaces the pre-recorded cues during the session.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onEnabledChange(!enabled)}
          className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
            enabled ? "bg-[#1DB954]" : "bg-zinc-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      <p className="mt-3 text-xs font-semibold tracking-[0.04em] text-zinc-500">
        {enabled ? statusLabel(available, status) : "Disabled — using pre-recorded cues"}
      </p>
    </section>
  );
}
