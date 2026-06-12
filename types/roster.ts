export type RosterTeam = {
  id: string;
  name: string;
};

export type RosterPlayer = {
  id: string;
  tag: string;
  teamId: string | null;
};

/** Controller-configured roster. Backend export comes later. */
export type RosterState = {
  teams: RosterTeam[];
  players: RosterPlayer[];
};
