import type { SessionConfig, SessionState } from "@/types/session";

/**
 * Snapshot published on every session update.
 * Runtime schema (for subscribers): `lib/gameState/game-state.schema.json`
 * Ingest: POST `/api/game-state` · Latest: GET `/api/game-state` · Webhook: `GAME_STATE_WEBHOOK_URL`
 */
export type GameStatePayload = {
  timestamp: number;
  state: SessionState;
  config: SessionConfig | null;
};
