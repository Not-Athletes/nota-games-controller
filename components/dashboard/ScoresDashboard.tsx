"use client";

import { useMemo } from "react";
import { NotaAppNav } from "@/components/NotaAppNav";
import { useSessionController } from "@/contexts/SessionControllerContext";
import { isNotaApiConfigured } from "@/lib/config/api";
import { teamDisplayKey } from "@/lib/session/playerTeams";
import type { LeaderboardEntry } from "@/types/leaderboard";
import { useSessionStore } from "@/stores/sessionStore";

const TEAM_THEMES: Record<
  string,
  {
    section: string;
    header: string;
    score: string;
    playerRow: string;
    badge: string;
    rank: string;
  }
> = {
  "team-red": {
    section: "bg-gradient-to-b from-red-50 to-white shadow-sm shadow-red-100/50",
    header: "text-red-900",
    score: "text-red-700",
    playerRow: "bg-red-50/90 ring-1 ring-red-200/80",
    badge: "bg-red-100 text-red-800 ring-1 ring-red-200/60",
    rank: "text-red-400",
  },
  "team-blue": {
    section: "bg-gradient-to-b from-blue-50 to-white shadow-sm shadow-blue-100/50",
    header: "text-blue-900",
    score: "text-blue-700",
    playerRow: "bg-blue-50/90 ring-1 ring-blue-200/80",
    badge: "bg-blue-100 text-blue-800 ring-1 ring-blue-200/60",
    rank: "text-blue-400",
  },
};

const DEFAULT_TEAM_THEME = {
  section: "bg-white shadow-sm",
  header: "text-zinc-900",
  score: "text-zinc-900",
  playerRow: "bg-zinc-50",
  badge: "bg-zinc-100 text-zinc-800",
  rank: "text-zinc-400",
};

function getTeamTheme(teamKey: string) {
  return TEAM_THEMES[teamKey] ?? DEFAULT_TEAM_THEME;
}

function teamKey(entry: LeaderboardEntry) {
  return teamDisplayKey(entry.teamId, entry.teamName);
}

function teamLabel(entry: LeaderboardEntry) {
  return entry.teamName ?? "Unassigned";
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex min-h-28 flex-col rounded-sm bg-zinc-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">{label}</p>
      <p className="mt-auto font-display text-3xl font-bold tabular-nums text-zinc-900 md:text-4xl">
        {value}
      </p>
    </div>
  );
}

export function ScoresDashboard() {
  const sessionId = useSessionStore((state) => state.sessionId);
  const leaderboard = useSessionStore((state) => state.leaderboard);
  const { sessionState, sessionConfig } = useSessionController();

  const sessionStats = useMemo(() => {
    if (sessionConfig && sessionState.phase !== "idle") {
      return {
        station: sessionState.currentStation,
        round: sessionState.currentRound,
        pass: sessionState.currentPass,
        totalStations: sessionConfig.stations,
        roundsPerStation: sessionConfig.roundsPerStation,
        totalPasses: sessionConfig.totalPasses,
      };
    }

    return {
      station: 0,
      round: 0,
      pass: 0,
      totalStations: sessionConfig?.stations ?? 0,
      roundsPerStation: sessionConfig?.roundsPerStation ?? 0,
      totalPasses: sessionConfig?.totalPasses ?? 0,
    };
  }, [sessionConfig, sessionState]);

  const rankedPlayers = useMemo(
    () => [...leaderboard].sort((a, b) => b.totalXp - a.totalXp || a.rank - b.rank),
    [leaderboard]
  );

  const teams = useMemo(() => {
    const byTeam = new Map<string, { id: string; name: string; combinedScore: number }>();

    for (const entry of rankedPlayers) {
      const key = teamKey(entry);
      const existing = byTeam.get(key);
      if (existing) {
        existing.combinedScore += entry.totalXp;
      } else {
        byTeam.set(key, {
          id: key,
          name: teamLabel(entry),
          combinedScore: entry.totalXp,
        });
      }
    }

    return Array.from(byTeam.values()).sort((a, b) => b.combinedScore - a.combinedScore);
  }, [rankedPlayers]);

  const showTeamSections = teams.some((team) => team.id !== "unassigned");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex justify-center">
        <NotaAppNav />
      </header>

      {!sessionId && isNotaApiConfigured() ? (
        <p className="rounded-sm bg-zinc-50 p-5 text-sm text-zinc-600">
          Create a session on the Controller tab to see live scores.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Players" value={rankedPlayers.length} />
        <StatCard label="Teams" value={teams.filter((team) => team.id !== "unassigned").length} />
        <StatCard
          label="Station"
          value={`${sessionStats.station} / ${sessionStats.totalStations || 0}`}
        />
        <StatCard
          label="Round"
          value={`${sessionStats.round} / ${sessionStats.roundsPerStation || 0}`}
        />
        <StatCard
          label="Pass"
          value={`${sessionStats.pass} / ${sessionStats.totalPasses || 0}`}
        />
      </div>

      {showTeamSections ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {teams.map((team) => {
            const teamPlayers = rankedPlayers.filter((player) => teamKey(player) === team.id);
            const theme = getTeamTheme(team.id);

            return (
              <section key={team.id} className={`rounded-sm p-5 ${theme.section}`}>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className={`font-display text-2xl font-semibold ${theme.header}`}>
                    {team.name}
                  </h2>
                  <p className="text-right">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Team score
                    </span>
                    <span
                      className={`block font-display text-3xl font-bold tabular-nums ${theme.score}`}
                    >
                      {team.combinedScore.toLocaleString()}
                    </span>
                  </p>
                </div>

                <ul className="mt-4 space-y-2">
                  {teamPlayers.map((player, index) => (
                    <li
                      key={player.playerId}
                      className={`flex items-center justify-between gap-3 rounded-sm px-4 py-3 ${theme.playerRow}`}
                    >
                      <div>
                        <p className={`font-semibold ${theme.header}`}>
                          <span className={`mr-2 tabular-nums ${theme.rank}`}>#{index + 1}</span>
                          {player.playerName}
                        </p>
                      </div>
                      <p className="text-sm tabular-nums text-zinc-700">
                        {player.totalXp.toLocaleString()} XP
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : null}

      <section className="rounded-sm border border-zinc-200 bg-white p-5">
        <h2 className="font-display text-xl font-semibold text-zinc-900">All players</h2>
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
                {rankedPlayers.map((player, index) => {
                  const theme = getTeamTheme(teamKey(player));
                  return (
                    <tr key={player.playerId} className="text-zinc-800">
                      <td className="py-3 pr-4 tabular-nums text-zinc-500">{index + 1}</td>
                      <td className="py-3 pr-4 font-medium text-zinc-900">{player.playerName}</td>
                      <td className="py-3 pr-4 tabular-nums">{player.totalXp.toLocaleString()}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-semibold ${theme.badge}`}
                        >
                          {player.teamName ?? "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
