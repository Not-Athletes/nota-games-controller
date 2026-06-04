"use client";

import { NotaAppNav } from "@/components/NotaAppNav";
import { usePlaceholderGameState } from "@/contexts/PlaceholderGameStateContext";
import { useSessionController } from "@/contexts/SessionControllerContext";
import type { SessionContext } from "@/lib/placeholderGame/types";

const TEAM_THEMES: Record<
  string,
  {
    section: string;
    header: string;
    score: string;
    duoCard: string;
    badge: string;
    rank: string;
  }
> = {
  "team-red": {
    section: "bg-gradient-to-b from-red-50 to-white shadow-sm shadow-red-100/50",
    header: "text-red-900",
    score: "text-red-700",
    duoCard: "bg-red-50/90 ring-1 ring-red-200/80",
    badge: "bg-red-100 text-red-800 ring-1 ring-red-200/60",
    rank: "text-red-400",
  },
  "team-blue": {
    section: "bg-gradient-to-b from-blue-50 to-white shadow-sm shadow-blue-100/50",
    header: "text-blue-900",
    score: "text-blue-700",
    duoCard: "bg-blue-50/90 ring-1 ring-blue-200/80",
    badge: "bg-blue-100 text-blue-800 ring-1 ring-blue-200/60",
    rank: "text-blue-400",
  },
};

const DEFAULT_TEAM_THEME = {
  section: "bg-white shadow-sm",
  header: "text-zinc-900",
  score: "text-zinc-900",
  duoCard: "bg-zinc-50",
  badge: "bg-zinc-100 text-zinc-800",
  rank: "text-zinc-400",
};

function getTeamTheme(teamId: string) {
  return TEAM_THEMES[teamId] ?? DEFAULT_TEAM_THEME;
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="flex min-h-28 flex-col rounded-sm bg-zinc-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">{label}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
      <p className="mt-auto font-display text-3xl font-bold tabular-nums text-zinc-900 md:text-4xl">
        {value}
      </p>
    </div>
  );
}

export function PlaceholderGameDashboard() {
  const { session: placeholderSession, players, duos, majorTeams, totals } =
    usePlaceholderGameState();
  const { sessionState, sessionConfig } = useSessionController();

  const session: SessionContext =
    sessionConfig && sessionState.phase !== "idle"
      ? {
          station: sessionState.currentStation,
          round: sessionState.currentRound,
          pass: sessionState.currentPass,
          totalStations: sessionConfig.stations,
          roundsPerStation: sessionConfig.roundsPerStation,
          totalPasses: sessionConfig.fullSessionPasses,
        }
      : placeholderSession;

  const playersByDuo = new Map(duos.map((duo) => [duo.id, players.filter((p) => p.duoId === duo.id)]));
  const rankedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex justify-center">
        <NotaAppNav />
      </header>

      <div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Placeholder data only. Live session, duos, and scoring are not connected yet.
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Players" value={totals.players} />
        <StatCard label="Duos" value={totals.duos} />
        <StatCard label="Teams" value={totals.majorTeams} />
        <StatCard label="Station" value={`${session.station} / ${session.totalStations}`} />
        <StatCard label="Round" value={`${session.round} / ${session.roundsPerStation}`} />
        <StatCard label="Pass" value={`${session.pass} / ${session.totalPasses}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {majorTeams.map((team) => {
          const teamDuos = duos
            .filter((d) => d.majorTeamId === team.id)
            .sort((a, b) => b.combinedScore - a.combinedScore);
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

              <ul className="mt-4 space-y-4">
                {teamDuos.map((duo, index) => {
                  const duoPlayers = playersByDuo.get(duo.id) ?? [];
                  return (
                    <li key={duo.id} className={`rounded-sm p-4 ${theme.duoCard}`}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className={`font-semibold ${theme.header}`}>
                            <span className={`mr-2 tabular-nums ${theme.rank}`}>#{index + 1}</span>
                            {duo.name}
                          </p>
                        </div>
                        <p className="text-right text-sm">
                          <span className="text-zinc-500">Duo score </span>
                          <span className="font-semibold tabular-nums text-zinc-900">
                            {duo.combinedScore.toLocaleString()}
                          </span>
                        </p>
                      </div>

                      <ul className="mt-3 divide-y divide-zinc-200/80">
                        {duoPlayers.map((player) => (
                          <li
                            key={player.id}
                            className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                          >
                            <div>
                              <p className="text-sm font-medium text-zinc-900">{player.tag}</p>
                              <p className="font-mono text-[10px] text-zinc-400">{player.id}</p>
                            </div>
                            <p className="text-sm tabular-nums text-zinc-700">
                              {player.score.toLocaleString()} pts
                            </p>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-zinc-900">All players</h2>
        <p className="mt-1 text-sm text-zinc-500">Ranked highest to lowest</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="pb-3 pr-4 w-12">#</th>
                <th className="pb-3 pr-4">Player</th>
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Score</th>
                <th className="pb-3 pr-4">Duo</th>
                <th className="pb-3">Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rankedPlayers.map((player, index) => {
                const duo = duos.find((d) => d.id === player.duoId);
                const team = majorTeams.find((t) => t.id === player.majorTeamId);
                const theme = getTeamTheme(player.majorTeamId);
                return (
                  <tr key={player.id} className="text-zinc-800">
                    <td className="py-3 pr-4 tabular-nums text-zinc-500">{index + 1}</td>
                    <td className="py-3 pr-4 font-medium text-zinc-900">{player.tag}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-zinc-500">{player.id}</td>
                    <td className="py-3 pr-4 tabular-nums">{player.score.toLocaleString()}</td>
                    <td className="py-3 pr-4">{duo?.name ?? player.duoId}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-semibold ${theme.badge}`}
                      >
                        {team?.name ?? player.majorTeamId}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
