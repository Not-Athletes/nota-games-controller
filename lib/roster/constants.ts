import type { RosterState, RosterTeam } from "@/types/roster";

export const ROSTER_STORAGE_KEY = "nota_roster";

export const DEFAULT_TEAMS: RosterTeam[] = [
  { id: "team-red", name: "Team Red" },
  { id: "team-blue", name: "Team Blue" },
];

export const EMPTY_ROSTER: RosterState = {
  teams: DEFAULT_TEAMS,
  players: [],
};

export const UNASSIGNED_TEAM_ID = "__unassigned__";
