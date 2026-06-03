import type {
  PlaceholderMajorTeam,
  PlaceholderPlayer,
  SessionContext,
} from "@/lib/placeholderGame/types";

/** Hardcoded session context — replace with live controller state later. */
export const PLACEHOLDER_SESSION: SessionContext = {
  station: 3,
  round: 2,
  pass: 1,
  totalStations: 6,
  roundsPerStation: 3,
  totalPasses: 2,
};

const MAJOR_TEAM_RED = "team-red";
const MAJOR_TEAM_BLUE = "team-blue";

/** Raw player rows (scores aggregated into pairs/teams in buildState). */
export const PLACEHOLDER_PLAYERS: PlaceholderPlayer[] = [
  { id: "player-01", tag: "Nova", score: 420, pairId: "pair-alpha", majorTeamId: MAJOR_TEAM_RED },
  { id: "player-02", tag: "Blitz", score: 385, pairId: "pair-alpha", majorTeamId: MAJOR_TEAM_RED },
  { id: "player-03", tag: "Ridge", score: 510, pairId: "pair-bravo", majorTeamId: MAJOR_TEAM_RED },
  { id: "player-04", tag: "Sprint", score: 490, pairId: "pair-bravo", majorTeamId: MAJOR_TEAM_RED },
  { id: "player-05", tag: "Echo", score: 360, pairId: "pair-charlie", majorTeamId: MAJOR_TEAM_RED },
  { id: "player-06", tag: "Flux", score: 340, pairId: "pair-charlie", majorTeamId: MAJOR_TEAM_RED },
  { id: "player-07", tag: "Volt", score: 455, pairId: "pair-delta", majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-08", tag: "Quake", score: 430, pairId: "pair-delta", majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-09", tag: "Haze", score: 395, pairId: "pair-echo", majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-10", tag: "Drift", score: 410, pairId: "pair-echo", majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-11", tag: "Spark", score: 300, pairId: "pair-foxtrot", majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-12", tag: "Pulse", score: 325, pairId: "pair-foxtrot", majorTeamId: MAJOR_TEAM_BLUE },
];

export const PLACEHOLDER_MAJOR_TEAMS: PlaceholderMajorTeam[] = [
  {
    id: MAJOR_TEAM_RED,
    name: "Team Red",
    pairIds: ["pair-alpha", "pair-bravo", "pair-charlie"],
    combinedScore: 0,
  },
  {
    id: MAJOR_TEAM_BLUE,
    name: "Team Blue",
    pairIds: ["pair-delta", "pair-echo", "pair-foxtrot"],
    combinedScore: 0,
  },
];
