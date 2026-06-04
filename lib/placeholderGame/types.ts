/** Read-only placeholder hierarchy: Player → Duo → Major Team */

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
  duoId: string;
  majorTeamId: string;
};

export type PlaceholderDuo = {
  id: string;
  name: string;
  playerIds: string[];
  majorTeamId: string;
  combinedScore: number;
};

export type PlaceholderMajorTeam = {
  id: string;
  name: string;
  duoIds: string[];
  combinedScore: number;
};

export type PlaceholderGameState = {
  session: SessionContext;
  players: PlaceholderPlayer[];
  duos: PlaceholderDuo[];
  majorTeams: PlaceholderMajorTeam[];
  totals: {
    players: number;
    duos: number;
    majorTeams: number;
  };
};
