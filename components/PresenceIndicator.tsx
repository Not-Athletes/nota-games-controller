"use client";

import { useSessionState } from "@/hooks/useSessionState";
import { gameSessionManager } from "@/lib/session/gameSessionManager";

export function PresenceIndicator() {
  const { sessionId, connectedCount } = useSessionState();

  if (!sessionId || !gameSessionManager.isEnabled()) {
    return null;
  }

  return (
    <section className="rounded-sm bg-zinc-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
        Connected players
      </p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-zinc-900">
        {connectedCount}
      </p>
      {connectedCount === 0 ? (
        <p className="mt-1 text-sm text-zinc-500">Waiting for phones to connect…</p>
      ) : null}
    </section>
  );
}
