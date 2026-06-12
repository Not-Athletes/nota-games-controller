import {
  PLACEHOLDER_MAJOR_TEAMS,
  PLACEHOLDER_PLAYERS,
  PLACEHOLDER_SESSION,
} from "@/lib/placeholderGame/data";
import type { PlaceholderGameState } from "@/lib/placeholderGame/types";

/** Build the full read-only placeholder view model (aggregated scores + totals). */
export function buildPlaceholderGameState(): PlaceholderGameState {
  const players = PLACEHOLDER_PLAYERS;

  const majorTeams = PLACEHOLDER_MAJOR_TEAMS.map((team) => ({
    ...team,
    combinedScore: players
      .filter((player) => player.majorTeamId === team.id)
      .reduce((sum, player) => sum + player.score, 0),
  }));

  return {
    session: PLACEHOLDER_SESSION,
    players,
    majorTeams,
    totals: {
      players: players.length,
      majorTeams: majorTeams.length,
    },
  };
}
