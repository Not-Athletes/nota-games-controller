import type { Phase, SessionConfig } from "@/types/session";

export function getRestDuration(config: SessionConfig, betweenStations: boolean) {
  return betweenStations ? config.restBetweenStationsTime : config.restTime;
}

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
  const perPass = config.stations * config.roundsPerStation * 2;
  return perPass * config.fullSessionPasses;
}
