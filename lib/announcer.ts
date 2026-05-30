import type { CueName } from "@/lib/audio";

/**
 * Announcement layer between the game state machine and the NOTA Coach
 * (ElevenLabs Conversational AI agent).
 *
 * The application stays the single source of truth for all game state and
 * timing. We only ever describe *what just happened* as structured data and
 * let the agent decide what to say. This means changing the host's wording or
 * the game "format" is a prompt change in the ElevenLabs dashboard, not a code
 * change here.
 *
 * Each event maps to:
 *   - mode: "speak"  -> sent as a user message, eliciting exactly one spoken turn.
 *           "context" -> sent as a non-eliciting contextual update (silent).
 *   - fallbackCues: pre-recorded cues to play when the agent is unavailable.
 *
 * The agent-side contract for these events lives in
 * `prompts/nota-coach-system-prompt.md`. If you change the event schema below,
 * update that prompt in the same commit so the host keeps interpreting events
 * correctly.
 */

export type CoachDispatchMode = "speak" | "context";

export type GameSnapshot = {
  pass: number;
  totalPasses: number;
  station: number;
  totalStations: number;
  round: number;
  roundsPerStation: number;
  workSeconds: number;
  restSeconds: number;
  restBetweenStationsSeconds: number;
};

export type WorkStartReason = "first" | "next_round" | "next_station" | "next_pass";

export type GameEvent =
  | { type: "session_start"; snapshot: GameSnapshot }
  | { type: "work_start"; reason: WorkStartReason; snapshot: GameSnapshot }
  | { type: "ten_seconds_left"; snapshot: GameSnapshot }
  | { type: "rest_start"; betweenStations: boolean; snapshot: GameSnapshot }
  | { type: "pass_complete"; snapshot: GameSnapshot }
  | { type: "session_complete"; snapshot: GameSnapshot }
  // Generic, format-agnostic hooks for future use (scores, schedule changes,
  // ad-hoc host banter). "announcement" speaks; "context" stays silent.
  | { type: "announcement"; text: string; data?: Record<string, unknown> }
  | { type: "context"; text: string; data?: Record<string, unknown> };

export type AnnouncementPlan = {
  mode: CoachDispatchMode;
  /** Structured message handed to the agent. */
  message: string;
  /** Pre-recorded cues to play (in order) when the agent can't be used. */
  fallbackCues: CueName[];
};

function serialize(payload: Record<string, unknown>): string {
  return JSON.stringify(payload);
}

function snapshotFields(snapshot: GameSnapshot) {
  return {
    pass: snapshot.pass,
    totalPasses: snapshot.totalPasses,
    station: snapshot.station,
    totalStations: snapshot.totalStations,
    round: snapshot.round,
    roundsPerStation: snapshot.roundsPerStation,
    workSeconds: snapshot.workSeconds,
    restSeconds: snapshot.restSeconds,
    restBetweenStationsSeconds: snapshot.restBetweenStationsSeconds,
  };
}

export function buildAnnouncement(event: GameEvent): AnnouncementPlan {
  switch (event.type) {
    case "session_start":
      return {
        mode: "speak",
        message: serialize({ event: "session_start", ...snapshotFields(event.snapshot) }),
        fallbackCues: ["airHorn"],
      };

    case "work_start": {
      const fallbackByReason: Record<WorkStartReason, CueName[]> = {
        first: ["airHorn"],
        next_round: ["nextRound", "airHorn"],
        next_station: ["rotateStations", "workStart", "airHorn"],
        next_pass: ["airHorn"],
      };
      return {
        mode: "speak",
        message: serialize({
          event: "work_start",
          reason: event.reason,
          ...snapshotFields(event.snapshot),
        }),
        fallbackCues: fallbackByReason[event.reason],
      };
    }

    case "ten_seconds_left":
      return {
        mode: "speak",
        message: serialize({ event: "ten_seconds_left", ...snapshotFields(event.snapshot) }),
        fallbackCues: ["tenSecondsLeft"],
      };

    case "rest_start":
      return {
        mode: "speak",
        message: serialize({
          event: "rest_start",
          betweenStations: event.betweenStations,
          ...snapshotFields(event.snapshot),
        }),
        fallbackCues: event.betweenStations ? ["switchStation"] : ["rest"],
      };

    case "pass_complete":
      return {
        mode: "speak",
        message: serialize({ event: "pass_complete", ...snapshotFields(event.snapshot) }),
        fallbackCues: ["passTransition"],
      };

    case "session_complete":
      return {
        mode: "speak",
        message: serialize({ event: "session_complete", ...snapshotFields(event.snapshot) }),
        fallbackCues: ["sessionComplete"],
      };

    case "announcement":
      return {
        mode: "speak",
        message: serialize({ event: "announcement", text: event.text, ...(event.data ?? {}) }),
        fallbackCues: [],
      };

    case "context":
      return {
        mode: "context",
        message: serialize({ event: "context", text: event.text, ...(event.data ?? {}) }),
        fallbackCues: [],
      };
  }
}
