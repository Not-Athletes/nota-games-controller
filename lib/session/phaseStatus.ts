import type { Phase } from "@/types/session";
import type { SessionStatus } from "@/types/session-api";

/** Maps local workout phase to dashboard session status for store display. */
export function phaseToSessionStatus(phase: Phase, isPaused: boolean): SessionStatus {
  if (phase === "idle") return "draft";
  if (phase === "complete") return "ended";
  if (phase === "passBreak" || isPaused) return "paused";
  return "active";
}

export function sessionStatusLabel(status: SessionStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "active":
      return "Active";
    case "paused":
      return "Paused";
    case "ended":
      return "Ended";
  }
}
