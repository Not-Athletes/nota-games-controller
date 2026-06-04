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

/** Raw player rows (scores aggregated into duos/teams in buildState). */
export const PLACEHOLDER_PLAYERS: PlaceholderPlayer[] = [
  { id: "player-01", tag: "Sarah", score: 420, duoId: "duo-1", majorTeamId: MAJOR_TEAM_RED },
  { id: "player-02", tag: "James", score: 385, duoId: "duo-1", majorTeamId: MAJOR_TEAM_RED },
  { id: "player-03", tag: "Emma", score: 510, duoId: "duo-2", majorTeamId: MAJOR_TEAM_RED },
  { id: "player-04", tag: "Oliver", score: 490, duoId: "duo-2", majorTeamId: MAJOR_TEAM_RED },
  { id: "player-05", tag: "Priya", score: 360, duoId: "duo-3", majorTeamId: MAJOR_TEAM_RED },
  { id: "player-06", tag: "Marcus", score: 340, duoId: "duo-3", majorTeamId: MAJOR_TEAM_RED },
  { id: "player-07", tag: "Hannah", score: 455, duoId: "duo-4", majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-08", tag: "Daniel", score: 430, duoId: "duo-4", majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-09", tag: "Aisha", score: 395, duoId: "duo-5", majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-10", tag: "Tom", score: 410, duoId: "duo-5", majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-11", tag: "Lucy", score: 300, duoId: "duo-6", majorTeamId: MAJOR_TEAM_BLUE },
  { id: "player-12", tag: "Ryan", score: 325, duoId: "duo-6", majorTeamId: MAJOR_TEAM_BLUE },
];

export const PLACEHOLDER_MAJOR_TEAMS: PlaceholderMajorTeam[] = [
  {
    id: MAJOR_TEAM_RED,
    name: "Team Red",
    duoIds: ["duo-1", "duo-2", "duo-3"],
    combinedScore: 0,
  },
  {
    id: MAJOR_TEAM_BLUE,
    name: "Team Blue",
    duoIds: ["duo-4", "duo-5", "duo-6"],
    combinedScore: 0,
  },
];
