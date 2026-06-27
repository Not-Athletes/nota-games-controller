"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useSessionParticipants } from "@/hooks/useSessionParticipants";
import { useSessionOrchestration } from "@/hooks/useSessionOrchestration";
import { useSessionState } from "@/hooks/useSessionState";
import { gameSessionManager } from "@/lib/session/gameSessionManager";

function formatJoinedAt(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function SessionPlayersTable() {
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
    <section className="rounded-sm bg-zinc-50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Players</p>
      </div>

      <p className="mt-1 text-sm text-zinc-600">
        Phones join by scanning the session QR on this tab. Remove a player if they joined by
        mistake or need to leave early.
      </p>

      {!hasSession ? (
        <p className="mt-4 text-sm text-zinc-500">
          {gameSessionManager.isEnabled()
            ? "Create a session on the Controller tab first."
            : "Connect the NOTA API to enable live player join."}
        </p>
      ) : players.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">Waiting for the first phone to join…</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-sm bg-white ring-1 ring-zinc-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Joined</th>
                {canRemove ? <th className="px-4 py-3 text-center">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const isRemoving = removingPlayerId === player.playerId;

                return (
                  <tr key={player.playerId} className="border-b border-zinc-100 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-zinc-900">{player.playerName}</td>
                    <td className="px-4 py-3 text-zinc-600">{player.teamName ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-600">
                      {formatJoinedAt(player.joinedAt)}
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

      {sessionEnded ? (
        <p className="mt-3 text-sm text-zinc-500">Session ended — player list is read-only.</p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
    </section>
  );
}
