/** Read-only game hierarchy: Player → Team */

export type SessionContext = {
  station: number;
  round: number;
  pass: number;
  totalStations: number;
  roundsPerStation: number;
  totalPasses: number;
};

export type PlaceholderPlayer = {
  id: string;
  tag: string;
  score: number;
  majorTeamId: string;
};

export type PlaceholderMajorTeam = {
  id: string;
  name: string;
  combinedScore: number;
};

export type PlaceholderGameState = {
  session: SessionContext;
  players: PlaceholderPlayer[];
  majorTeams: PlaceholderMajorTeam[];
  totals: {
    players: number;
    majorTeams: number;
  };
};
