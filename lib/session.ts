import type { Phase, SessionConfig } from "@/types/session";

export function getPhaseDuration(phase: Phase, config: SessionConfig) {
  switch (phase) {
    case "work":
      return config.workTime;
    case "rest":
      return config.restTime;
    default:
      return 0;
  }
}

export function getTotalIntervals(config: SessionConfig) {
  return config.stations * config.roundsPerStation * 2;
}
