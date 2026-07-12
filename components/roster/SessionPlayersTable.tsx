"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useSessionParticipants } from "@/hooks/useSessionParticipants";
import { useSessionOrchestration } from "@/hooks/useSessionOrchestration";
import { useSessionState } from "@/hooks/useSessionState";
import { gameSessionManager } from "@/lib/session/gameSessionManager";

export function SessionPlayersTable({ compact = false }: { compact?: boolean }) {
  const { players, hasSession } = useSessionParticipants();
  const { removePlayerFromSession } = useSessionOrchestration();
  const { statusLabel } = useSessionState();
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionEnded = statusLabel === "Ended";
  const canRemove = gameSessionManager.isEnabled() && hasSession && !sessionEnded;

  const handleRemove = async (playerId: string, playerName: string) => {
    if (!canRemove || removingPlayerId) return;

    const confirmed = window.confirm(`Remove ${playerName} from this session?`);
    if (!confirmed) return;

    setError(null);
    setRemovingPlayerId(playerId);
    try {
      await removePlayerFromSession(playerId);
    } catch (removeError) {
      const message =
        removeError instanceof Error ? removeError.message : "Could not remove player";
      setError(message);
    } finally {
      setRemovingPlayerId(null);
    }
  };

  return (
    <section className={compact ? "" : "rounded-sm bg-zinc-50 p-5"}>
      {!compact ? (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Players</p>
        </div>
      ) : null}

      {!hasSession ? (
        <p className="mt-4 text-sm text-zinc-500">Create a session on the Controller first.</p>
      ) : players.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">Waiting for the first phone to join…</p>
      ) : (
        <div
          className={`rounded-sm bg-white ring-1 ring-zinc-200 ${
            compact ? "mt-0" : "mt-4 overflow-x-auto"
          }`}
        >
          <table className="min-w-full text-left text-sm">
            <thead
              className={`border-b border-zinc-200 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500 ${
                compact ? "sticky top-0 bg-white" : ""
              }`}
            >
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Team</th>
                {canRemove ? <th className="px-4 py-3 text-center">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const isRemoving = removingPlayerId === player.playerId;

                return (
                  <tr key={player.playerId} className="border-b border-zinc-100 last:border-b-0">
                    <td
                      className={`px-4 py-3 font-medium text-zinc-900 ${compact ? "max-w-[7rem] truncate" : ""}`}
                    >
                      {player.playerName}
                    </td>
                    <td className={`px-4 py-3 text-zinc-600 ${compact ? "max-w-[5rem] truncate" : ""}`}>
                      {player.teamName ?? "—"}
                    </td>
                    {canRemove ? (
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <button
                          type="button"
                          aria-label={isRemoving ? `Removing ${player.playerName}` : `Remove ${player.playerName}`}
                          onClick={() => void handleRemove(player.playerId, player.playerName)}
                          disabled={Boolean(removingPlayerId)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <X className="h-4 w-4" strokeWidth={2} />
                        </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
    </section>
  );
}
