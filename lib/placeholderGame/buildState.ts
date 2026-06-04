import {
  PLACEHOLDER_MAJOR_TEAMS,
  PLACEHOLDER_PLAYERS,
  PLACEHOLDER_SESSION,
} from "@/lib/placeholderGame/data";
import type {
  PlaceholderDuo,
  PlaceholderGameState,
  PlaceholderPlayer,
} from "@/lib/placeholderGame/types";

/** Official NATO phonetic alphabet (ICAO) — used for random duo names. */
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

function buildDuos(players: PlaceholderPlayer[]): PlaceholderDuo[] {
  const byDuo = new Map<string, PlaceholderPlayer[]>();
  for (const player of players) {
    const group = byDuo.get(player.duoId) ?? [];
    group.push(player);
    byDuo.set(player.duoId, group);
  }

  const entries = [...byDuo.entries()].sort(([a], [b]) => a.localeCompare(b));
  const natoNames = pickRandomNatoNames(entries.length);

  return entries.map(([duoId, members], index) => ({
    id: duoId,
    name: natoNames[index] ?? duoId,
    playerIds: members.map((m) => m.id),
    majorTeamId: members[0].majorTeamId,
    combinedScore: members.reduce((sum, m) => sum + m.score, 0),
  }));
}

/** Build the full read-only placeholder view model (aggregated scores + totals). */
export function buildPlaceholderGameState(): PlaceholderGameState {
  const players = PLACEHOLDER_PLAYERS;
  const duos = buildDuos(players);

  const duoScoreById = new Map(duos.map((d) => [d.id, d.combinedScore]));

  const majorTeams = PLACEHOLDER_MAJOR_TEAMS.map((team) => ({
    ...team,
    combinedScore: team.duoIds.reduce(
      (sum, duoId) => sum + (duoScoreById.get(duoId) ?? 0),
      0
    ),
  }));

  return {
    session: PLACEHOLDER_SESSION,
    players,
    duos,
    majorTeams,
    totals: {
      players: players.length,
      duos: duos.length,
      majorTeams: majorTeams.length,
    },
  };
}
