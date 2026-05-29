export type Phase =
  | "idle"
  | "work"
  | "rest"
  | "passBreak"
  | "complete";

export type SessionConfig = {
  workTime: number;
  restTime: number;
  /** Rest duration after the last round at a station, before moving to the next station. */
  restBetweenStationsTime: number;
  roundsPerStation: number;
  stations: number;
  /** Run through all stations × rounds this many times (1 = current behavior). */
  fullSessionPasses: number;
  maxTrackPlaySeconds: number;
  workVolume: number;
  restVolume: number;
  spotifyPlaylistUri?: string;
};

export type SessionState = {
  phase: Phase;
  currentStation: number;
  currentRound: number;
  /** 1-based index of the current full pass through all stations. */
  currentPass: number;
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  completedIntervals: number;
  totalIntervals: number;
  startedAtMs?: number;
  endedAtMs?: number;
};

export type SetupInput = {
  workTime: number;
  restTime: number;
  restBetweenStationsTime: number;
  roundsPerStation: number;
  stations: number;
  fullSessionPasses: number;
  maxTrackPlaySeconds: number;
  spotifyPlaylistUri?: string;
};
