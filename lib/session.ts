import type { Phase, SessionConfig } from "@/types/session";

export function getPhaseDuration(phase: Phase, config: SessionConfig) {
  switch (phase) {
    case "work":
      return config.workTime;
    case "rest":
      return config.restTime;
    case "passBreak":
      return config.passBreakSeconds;
    default:
      return 0;
  }
}

export function getTotalIntervals(config: SessionConfig) {
  const perPass = config.stations * config.roundsPerStation * 2;
  return perPass * config.fullSessionPasses;
}
