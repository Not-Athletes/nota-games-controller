/** Read-only placeholder hierarchy: Player → Pair → Major Team */

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
  pairId: string;
  majorTeamId: string;
};

export type PlaceholderPair = {
  id: string;
  name: string;
  playerIds: string[];
  majorTeamId: string;
  combinedScore: number;
};

export type PlaceholderMajorTeam = {
  id: string;
  name: string;
  pairIds: string[];
  combinedScore: number;
};

export type PlaceholderGameState = {
  session: SessionContext;
  players: PlaceholderPlayer[];
  pairs: PlaceholderPair[];
  majorTeams: PlaceholderMajorTeam[];
  totals: {
    players: number;
    pairs: number;
    majorTeams: number;
  };
};
