import type { SessionState, SetupInput } from "@/types/session";

export const DEFAULT_SETUP: SetupInput = {
  workTime: 45,
  restTime: 15,
  restBetweenStationsTime: 30,
  roundsPerStation: 3,
  stations: 6,
  fullSessionPasses: 2,
  maxTrackPlaySeconds: 190,
  spotifyPlaylistUri: "",
};

export const WORK_VOLUME = 100;
export const REST_VOLUME = 25;

export const INITIAL_SESSION_STATE: SessionState = {
  phase: "idle",
  currentStation: 1,
  currentRound: 1,
  currentPass: 1,
  timeRemaining: 0,
  isRunning: false,
  isPaused: false,
  completedIntervals: 0,
  totalIntervals: 0,
  startedAtMs: undefined,
  endedAtMs: undefined,
};

export const TIMED_PHASES = ["work", "rest"] as const;
export const AUTO_NEXT_THRESHOLD_MS = 7000;
export const NOW_PLAYING_POLL_MS = 1000;
