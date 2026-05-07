import type { Phase, SessionConfig } from "@/types/session";

export const GET_READY_SECONDS = 10;
export const ROTATE_SECONDS = 0;

export function getPhaseDuration(phase: Phase, config: SessionConfig) {
  switch (phase) {
    case "get_ready":
      return GET_READY_SECONDS;
    case "work":
      return config.workTime;
    case "rest":
      return config.restTime;
    case "rotate":
      return ROTATE_SECONDS;
    default:
      return 0;
  }
}

export function getTotalIntervals(config: SessionConfig) {
  return config.stations * config.roundsPerStation * 2;
}

export function getTotalSessionSeconds(config: SessionConfig) {
  const getReady = GET_READY_SECONDS;
  const workAndRest =
    config.stations * config.roundsPerStation * (config.workTime + config.restTime);
  return getReady + workAndRest;
}
