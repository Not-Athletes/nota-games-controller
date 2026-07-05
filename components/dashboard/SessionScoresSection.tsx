"use client";

import { teamDisplayKey } from "@/lib/session/playerTeams";
import { useSessionScores } from "@/hooks/useSessionScores";
import type { LeaderboardEntry } from "@/types/leaderboard";

const TEAM_BADGE: Record<string, string> = {
  "team-red": "bg-red-100 text-red-800",
  "team-blue": "bg-blue-100 text-blue-800",
};

function teamKey(entry: LeaderboardEntry) {
  return teamDisplayKey(entry.teamId, entry.teamName);
}

export function SessionScoresSection() {
  const { rankedPlayers } = useSessionScores();

  return (
    <section className="rounded-sm border border-zinc-200 bg-white p-5">
      <h2 className="font-display text-xl font-semibold text-zinc-900">Scores</h2>
      <p className="mt-1 text-sm text-zinc-500">Ranked highest to lowest</p>

      {rankedPlayers.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No scores yet — waiting for motion data.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="w-12 pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Player</th>
                <th className="pb-3 pr-4">XP</th>
                <th className="pb-3">Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rankedPlayers.map((player, index) => (
                <tr key={player.playerId} className="text-zinc-800">
                  <td className="py-3 pr-4 tabular-nums text-zinc-500">{index + 1}</td>
                  <td className="py-3 pr-4 font-medium text-zinc-900">{player.playerName}</td>
                  <td className="py-3 pr-4 tabular-nums">{player.totalXp.toLocaleString()}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-semibold ${
                        TEAM_BADGE[teamKey(player)] ?? "bg-zinc-100 text-zinc-800"
                      }`}
                    >
                      {player.teamName ?? "—"}
                    </span>
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
