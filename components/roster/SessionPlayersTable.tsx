"use client";

import { useSessionParticipants } from "@/hooks/useSessionParticipants";
import { gameSessionManager } from "@/lib/session/gameSessionManager";

function formatJoinedAt(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function SessionPlayersTable() {
  const { players, loading, hasSession } = useSessionParticipants();

  return (
    <section className="rounded-sm bg-zinc-50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Players</p>
        {hasSession ? (
          <p className="text-sm font-semibold tabular-nums text-zinc-800">{players.length} joined</p>
        ) : null}
      </div>

      <p className="mt-1 text-sm text-zinc-600">
        Phones join by scanning the session QR on the Players tab. Players appear here
        automatically and stay in the session until it ends.
      </p>

      {!hasSession ? (
        <p className="mt-4 text-sm text-zinc-500">
          {gameSessionManager.isEnabled()
            ? "Create a session on the Controller tab first."
            : "Connect the NOTA API to enable live player join."}
        </p>
      ) : loading && players.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">Loading players…</p>
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
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.playerId} className="border-b border-zinc-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-zinc-900">{player.playerName}</td>
                  <td className="px-4 py-3 text-zinc-600">{player.teamName ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-600">
                    {formatJoinedAt(player.joinedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
