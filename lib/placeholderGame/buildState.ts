import {
  PLACEHOLDER_MAJOR_TEAMS,
  PLACEHOLDER_PLAYERS,
  PLACEHOLDER_SESSION,
} from "@/lib/placeholderGame/data";
import type {
  PlaceholderGameState,
  PlaceholderPair,
  PlaceholderPlayer,
} from "@/lib/placeholderGame/types";

function buildPairs(players: PlaceholderPlayer[]): PlaceholderPair[] {
  const byPair = new Map<string, PlaceholderPlayer[]>();
  for (const player of players) {
    const group = byPair.get(player.pairId) ?? [];
    group.push(player);
    byPair.set(player.pairId, group);
  }

  const pairNames: Record<string, string> = {
    "pair-alpha": "Pair Alpha",
    "pair-bravo": "Pair Bravo",
    "pair-charlie": "Pair Charlie",
    "pair-delta": "Pair Delta",
    "pair-echo": "Pair Echo",
    "pair-foxtrot": "Pair Foxtrot",
  };

  return [...byPair.entries()].map(([pairId, members]) => ({
    id: pairId,
    name: pairNames[pairId] ?? pairId,
    playerIds: members.map((m) => m.id),
    majorTeamId: members[0].majorTeamId,
    combinedScore: members.reduce((sum, m) => sum + m.score, 0),
  }));
}

/** Build the full read-only placeholder view model (aggregated scores + totals). */
export function buildPlaceholderGameState(): PlaceholderGameState {
  const players = PLACEHOLDER_PLAYERS;
  const pairs = buildPairs(players);

  const pairScoreById = new Map(pairs.map((p) => [p.id, p.combinedScore]));

  const majorTeams = PLACEHOLDER_MAJOR_TEAMS.map((team) => ({
    ...team,
    combinedScore: team.pairIds.reduce(
      (sum, pairId) => sum + (pairScoreById.get(pairId) ?? 0),
      0
    ),
  }));

  return {
    session: PLACEHOLDER_SESSION,
    players,
    pairs,
    majorTeams,
    totals: {
      players: players.length,
      pairs: pairs.length,
      majorTeams: majorTeams.length,
    },
  };
}
