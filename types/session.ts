export type Phase =
  | "idle"
  | "work"
  | "rest"
  | "passBreak"
  | "complete";

export type PassConfig = {
  stations: number;
  roundsPerStation: number;
  workTime: number;
  restTime: number;
  restBetweenStationsTime: number;
};

export type SetupInput = {
  passes: PassConfig[];
  maxTrackPlaySeconds: number;
  spotifyPlaylistUri?: string;
  spotifyEnabled: boolean;
};

/** Active session configuration (global + all passes + denormalized active pass fields). */
export type SessionConfig = SetupInput & {
  workVolume: number;
  restVolume: number;
  totalPasses: number;
  stations: number;
  roundsPerStation: number;
  workTime: number;
  restTime: number;
  restBetweenStationsTime: number;
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
