"use client";

import { NotaAppNav } from "@/components/NotaAppNav";
import { usePlaceholderGameState } from "@/contexts/PlaceholderGameStateContext";

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
  const { session, players, pairs, majorTeams, totals } = usePlaceholderGameState();

  const playersByPair = new Map(pairs.map((pair) => [pair.id, players.filter((p) => p.pairId === pair.id)]));
  const rankedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex justify-center">
        <NotaAppNav />
      </header>

      <div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Placeholder data only. Live session, pairing, and scoring are not connected yet.
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Players" value={totals.players} />
        <StatCard label="Pairs" value={totals.pairs} />
        <StatCard label="Major teams" value={totals.majorTeams} />
        <StatCard label="Station" value={`${session.station} / ${session.totalStations}`} />
        <StatCard label="Round" value={`${session.round} / ${session.roundsPerStation}`} />
        <StatCard label="Pass" value={`${session.pass} / ${session.totalPasses}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {majorTeams.map((team) => {
          const teamPairs = pairs
            .filter((p) => p.majorTeamId === team.id)
            .sort((a, b) => b.combinedScore - a.combinedScore);
          return (
            <section
              key={team.id}
              className="rounded-sm border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-2xl font-semibold text-zinc-900">{team.name}</h2>
                <p className="text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Team score
                  </span>
                  <span className="block font-display text-3xl font-bold tabular-nums text-zinc-900">
                    {team.combinedScore.toLocaleString()}
                  </span>
                </p>
              </div>

              <ul className="mt-4 space-y-4">
                {teamPairs.map((pair, index) => {
                  const pairPlayers = playersByPair.get(pair.id) ?? [];
                  return (
                    <li key={pair.id} className="rounded-sm bg-zinc-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-zinc-900">
                            <span className="mr-2 tabular-nums text-zinc-400">#{index + 1}</span>
                            {pair.name}
                          </p>
                          <p className="font-mono text-[10px] text-zinc-400">{pair.id}</p>
                        </div>
                        <p className="text-right text-sm">
                          <span className="text-zinc-500">Pair score </span>
                          <span className="font-semibold tabular-nums text-zinc-900">
                            {pair.combinedScore.toLocaleString()}
                          </span>
                        </p>
                      </div>

                      <ul className="mt-3 divide-y divide-zinc-200/80">
                        {pairPlayers.map((player) => (
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
                <th className="pb-3 pr-4">Pair</th>
                <th className="pb-3">Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rankedPlayers.map((player, index) => {
                const pair = pairs.find((p) => p.id === player.pairId);
                const team = majorTeams.find((t) => t.id === player.majorTeamId);
                return (
                  <tr key={player.id} className="text-zinc-800">
                    <td className="py-3 pr-4 tabular-nums text-zinc-500">{index + 1}</td>
                    <td className="py-3 pr-4 font-medium text-zinc-900">{player.tag}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-zinc-500">{player.id}</td>
                    <td className="py-3 pr-4 tabular-nums">{player.score.toLocaleString()}</td>
                    <td className="py-3 pr-4">{pair?.name ?? player.pairId}</td>
                    <td className="py-3">{team?.name ?? player.majorTeamId}</td>
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
