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

export const PLACEHOLDER_PLAYERS: PlaceholderPlayer[] = [
  { id: "player-01", tag: "Sarah", score: 420, majorTeamId: MAJOR_TEAM_RED },
  { id: "player-02", tag: "James", score: 385, majorTeamId: MAJOR_TEAM_RED },
  { id: "player-03", tag: "Emma", score: 510, majorTeamId: MAJOR_TEAM_RED },
  { id: "player-04", tag: "Oliver", score: 490, majorTeamId: MAJOR_TEAM_RED },
  { id: "player-05", tag: "Priya", score: 360, majorTeamId: MAJOR_TEAM_RED },
  { id: "player-06", tag: "Marcus", score: 340, majorTeamId: MAJOR_TEAM_RED },
  { id: "player-07", tag: "Hannah", score: 455, majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-08", tag: "Daniel", score: 430, majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-09", tag: "Aisha", score: 395, majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-10", tag: "Tom", score: 410, majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-11", tag: "Lucy", score: 300, majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-12", tag: "Ryan", score: 325, majorTeamId: MAJOR_TEAM_BLUE },
];

export const PLACEHOLDER_MAJOR_TEAMS: PlaceholderMajorTeam[] = [
  { id: MAJOR_TEAM_RED, name: "Team Red", combinedScore: 0 },
  { id: MAJOR_TEAM_BLUE, name: "Team Blue", combinedScore: 0 },
];
