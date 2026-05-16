export type Phase =
  | "idle"
  | "work"
  | "rest"
  | "passBreak"
  | "complete";

export type SessionConfig = {
  workTime: number;
  restTime: number;
  roundsPerStation: number;
  stations: number;
  /** Run through all stations × rounds this many times (1 = current behavior). */
  fullSessionPasses: number;
  /** Quiet countdown (in seconds) after pass transition audio before the next pass work starts. */
  passBreakSeconds: number;
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
  roundsPerStation: number;
  stations: number;
  fullSessionPasses: number;
  passBreakSeconds: number;
  maxTrackPlaySeconds: number;
  spotifyPlaylistUri?: string;
};
