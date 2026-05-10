export type Phase =
  | "idle"
  | "work"
  | "rest"
  | "complete";

export type SessionConfig = {
  attendees: number;
  workTime: number;
  restTime: number;
  roundsPerStation: number;
  stations: number;
  maxTrackPlaySeconds: number;
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
  startedAtMs?: number;
  endedAtMs?: number;
};

export type SetupInput = {
  attendees: number;
  workTime: number;
  restTime: number;
  roundsPerStation: number;
  stations: number;
  maxTrackPlaySeconds: number;
  spotifyPlaylistUri?: string;
};
