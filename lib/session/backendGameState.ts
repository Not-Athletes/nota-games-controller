import type { BackendGameState, SessionStatePatch } from "@/lib/api/dashboard/schemas";
import type { GameStatePayload } from "@/lib/gameState/types";
import type { Phase, SessionState } from "@/types/session";
import type { SessionStatus } from "@/types/session-api";

const BACKEND_PHASES = new Set<Phase>(["work", "rest", "passBreak", "complete"]);

export function toBackendStatePatch(payload: GameStatePayload): SessionStatePatch | null {
  const { state } = payload;

  if (state.phase === "idle") {
    return null;
  }

  const base = {
    currentStation: state.currentStation,
    currentRound: state.currentRound,
    currentPass: state.currentPass,
    timeRemaining: state.timeRemaining,
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    completedIntervals: state.completedIntervals,
    totalIntervals: state.totalIntervals,
  };

  if (state.phase === "complete") {
    return {
      status: "ended",
      phase: "complete",
      ...base,
    };
  }

  if (state.phase === "passBreak") {
    return {
      status: "paused",
      phase: "passBreak",
      ...base,
    };
  }

  if (state.isPaused && state.phase === "work") {
    return {
      status: "paused",
      phase: "work",
      ...base,
    };
  }

  return {
    status: "active",
    phase: state.phase,
    ...base,
  };
}

export function storeStatusFromBackendState(state: BackendGameState): SessionStatus {
  if (state.sessionEnded || state.phase === "complete") {
    return "ended";
  }
  if (state.phase === "passBreak" || state.isPaused) {
    return "paused";
  }
  return "active";
}

export function backendGameStateToSessionState(state: BackendGameState): SessionState {
  return {
    phase: state.phase,
    currentStation: state.currentStation,
    currentRound: state.currentRound,
    currentPass: state.currentPass,
    timeRemaining: state.timeRemaining,
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    completedIntervals: state.completedIntervals,
    totalIntervals: state.totalIntervals,
    endedAtMs: state.sessionEnded || state.phase === "complete" ? Date.now() : undefined,
  };
}

export function isBackendSyncPhase(phase: Phase) {
  return BACKEND_PHASES.has(phase);
}
