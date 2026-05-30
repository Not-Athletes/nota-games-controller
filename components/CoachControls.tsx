"use client";

import { useEffect, useState } from "react";
import type { CoachConnectionStatus } from "@/lib/useNotaCoach";

type CoachControlsProps = {
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  status: CoachConnectionStatus;
};

type ConfigProbe = "checking" | "ready" | "unreachable" | "unconfigured";

const HAS_PUBLIC_AGENT = Boolean(process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID);

const PROBE_META: Record<ConfigProbe, { dot: string; label: string }> = {
  checking: { dot: "bg-zinc-300", label: "Checking configuration…" },
  ready: { dot: "bg-[#1DB954]", label: "Configured — agent reachable" },
  unreachable: {
    dot: "bg-amber-500",
    label: "Configured, but the agent can't be reached — cues will be used",
  },
  unconfigured: {
    dot: "bg-red-500",
    label: "Not configured — pre-recorded cues will be used",
  },
};

function connectionLabel(status: CoachConnectionStatus) {
  switch (status) {
    case "connected":
      return "Live — NOTA Coach is hosting";
    case "connecting":
      return "Connecting to NOTA Coach…";
    case "error":
      return "Connection issue — falling back to cues";
    default:
      return null;
  }
}

export function CoachControls({
  enabled,
  onEnabledChange,
  status,
}: CoachControlsProps) {
  const [probe, setProbe] = useState<ConfigProbe>("checking");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/convai/status");
        const data = (await res.json()) as { configured?: boolean; reachable?: boolean };
        if (cancelled) return;
        if (data.reachable) {
          setProbe("ready");
        } else if (data.configured) {
          setProbe("unreachable");
        } else {
          setProbe(HAS_PUBLIC_AGENT ? "ready" : "unconfigured");
        }
      } catch {
        if (!cancelled) setProbe(HAS_PUBLIC_AGENT ? "ready" : "unconfigured");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const live = enabled ? connectionLabel(status) : null;
  const meta = PROBE_META[probe];

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

      <div className="mt-4 flex items-center gap-2">
        <span
          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`}
          aria-hidden
        />
        <p className="text-xs font-semibold tracking-[0.04em] text-zinc-600">
          {!enabled ? "Disabled — using pre-recorded cues" : live ?? meta.label}
        </p>
      </div>
    </section>
  );
}
