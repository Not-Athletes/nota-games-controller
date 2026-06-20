import type { Phase } from "@/types/session";
import type { SessionStatus } from "@/types/session-api";

export function phaseToSessionStatus(phase: Phase, isPaused: boolean): SessionStatus {
  if (phase === "idle") return "draft";
  if (phase === "complete") return "ended";
  if (phase === "passBreak") return "pass_break";
  if (isPaused) return "paused";
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
    case "pass_break":
      return "Pass break";
    case "ended":
      return "Ended";
  }
}
