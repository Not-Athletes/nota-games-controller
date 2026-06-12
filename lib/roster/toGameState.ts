import type { PlaceholderGameState, SessionContext } from "@/lib/placeholderGame/types";
import type { RosterState } from "@/types/roster";

const DEFAULT_SESSION: SessionContext = {
  station: 1,
  round: 1,
  pass: 1,
  totalStations: 6,
  roundsPerStation: 3,
  totalPasses: 2,
};

/** Map controller roster into the Scores dashboard shape (scores zero until live data). */
export function rosterToGameState(
  roster: RosterState,
  session: SessionContext = DEFAULT_SESSION
): PlaceholderGameState {
  const players = roster.players.map((player) => ({
    id: player.id,
    tag: player.tag,
    score: 0,
    majorTeamId: player.teamId ?? "",
  }));

  const majorTeams = roster.teams.map((team) => ({
    id: team.id,
    name: team.name,
    combinedScore: players
      .filter((player) => player.majorTeamId === team.id)
      .reduce((sum, player) => sum + player.score, 0),
  }));

  return {
    session,
    players,
    majorTeams,
    totals: {
      players: players.length,
      majorTeams: majorTeams.length,
    },
  };
}
