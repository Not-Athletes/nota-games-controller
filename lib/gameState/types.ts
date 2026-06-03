import type { SessionConfig, SessionState } from "@/types/session";

/** Snapshot posted to `/api/game-state` on every session update. */
export type GameStatePayload = {
  timestamp: number;
  state: SessionState;
  config: SessionConfig | null;
};
