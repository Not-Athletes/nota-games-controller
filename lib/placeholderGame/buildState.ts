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

/** Official NATO phonetic alphabet (ICAO) — used for random pair names. */
const NATO_PHONETIC_ALPHABET = [
  "Alpha",
  "Bravo",
  "Charlie",
  "Delta",
  "Echo",
  "Foxtrot",
  "Golf",
  "Hotel",
  "India",
  "Juliet",
  "Kilo",
  "Lima",
  "Mike",
  "November",
  "Oscar",
  "Papa",
  "Quebec",
  "Romeo",
  "Sierra",
  "Tango",
  "Uniform",
  "Victor",
  "Whiskey",
  "X-ray",
  "Yankee",
  "Zulu",
] as const;

function pickRandomNatoNames(count: number): string[] {
  const pool = [...NATO_PHONETIC_ALPHABET];
  const picked: string[] = [];

  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool[index]);
    pool.splice(index, 1);
  }

  return picked;
}

function buildPairs(players: PlaceholderPlayer[]): PlaceholderPair[] {
  const byPair = new Map<string, PlaceholderPlayer[]>();
  for (const player of players) {
    const group = byPair.get(player.pairId) ?? [];
    group.push(player);
    byPair.set(player.pairId, group);
  }

  const entries = [...byPair.entries()].sort(([a], [b]) => a.localeCompare(b));
  const natoNames = pickRandomNatoNames(entries.length);

  return entries.map(([pairId, members], index) => ({
    id: pairId,
    name: natoNames[index] ?? pairId,
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
