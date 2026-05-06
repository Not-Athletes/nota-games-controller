import type { Phase, SessionConfig } from "@/types/session";

export const GET_READY_SECONDS = 5;
export const ROTATE_SECONDS = 5;

export function adjustRestTime(baseRestTime: number, attendees: number) {
  if (attendees >= 17) {
    return {
      adjustedRestTime: baseRestTime + 10,
      warning: "Consider splitting into waves",
    };
  }

  if (attendees >= 15) {
    return {
      adjustedRestTime: baseRestTime + 5,
    };
  }

  if (attendees >= 13) {
    return {
      adjustedRestTime: baseRestTime + 3,
    };
  }

  return {
    adjustedRestTime: baseRestTime,
  };
}

export function getPhaseDuration(phase: Phase, config: SessionConfig) {
  switch (phase) {
    case "get_ready":
      return GET_READY_SECONDS;
    case "work":
      return config.workTime;
    case "rest":
      return config.adjustedRestTime;
    case "rotate":
      return ROTATE_SECONDS;
    default:
      return 0;
  }
}

export function getTotalIntervals(config: SessionConfig) {
  const workAndRestIntervals = config.stations * config.roundsPerStation * 2;
  const rotateIntervals = Math.max(config.stations - 1, 0);
  return workAndRestIntervals + rotateIntervals;
}

export function getTotalSessionSeconds(config: SessionConfig) {
  const getReady = GET_READY_SECONDS;
  const workAndRest =
    config.stations * config.roundsPerStation * (config.workTime + config.adjustedRestTime);
  const rotate = Math.max(config.stations - 1, 0) * ROTATE_SECONDS;
  return getReady + workAndRest + rotate;
}
