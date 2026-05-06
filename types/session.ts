export type Phase =
  | "idle"
  | "get_ready"
  | "work"
  | "rest"
  | "rotate"
  | "complete"
  | "paused";

export type SessionConfig = {
  attendees: number;
  workTime: number;
  restTime: number;
  adjustedRestTime: number;
  roundsPerStation: number;
  stations: number;
  workVolume: number;
  restVolume: number;
  cueVolume: number;
  spotifyPlaylistUri?: string;
};

export type SessionState = {
  phase: Phase;
  currentStation: number;
  currentRound: number;
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  completedIntervals: number;
  totalIntervals: number;
};

export type SetupInput = {
  attendees: number;
  workTime: number;
  restTime: number;
  roundsPerStation: number;
  stations: number;
  spotifyPlaylistUri?: string;
  workVolume: number;
  restVolume: number;
  cueVolume: number;
};
