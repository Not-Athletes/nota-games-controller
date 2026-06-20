"use client";

import { useSessionState } from "@/hooks/useSessionState";
import { gameSessionManager } from "@/lib/session/gameSessionManager";

export function PresenceIndicator() {
  const { sessionId, connectedPlayers, connectedCount } = useSessionState();

  if (!sessionId || !gameSessionManager.isEnabled()) {
    return null;
  }

  const showList = connectedPlayers.length > 0;

  return (
    <section className="rounded-sm bg-zinc-50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
          Connected players
        </p>
        <p className="text-sm font-semibold tabular-nums text-zinc-800">{connectedCount} connected</p>
      </div>

      {showList ? (
        <ul className="mt-3 space-y-1.5">
          {connectedPlayers.map((player) => (
            <li
              key={player.playerId}
              className="flex items-center gap-2 text-sm text-zinc-700"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center text-xs text-emerald-600" aria-hidden>
                ✓
              </span>
              <span className="font-medium text-zinc-900">{player.playerName}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">Waiting for phones to connect…</p>
      )}
    </section>
  );
}
