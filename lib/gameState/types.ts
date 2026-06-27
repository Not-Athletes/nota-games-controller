import type { SessionState } from "@/types/session";

/** Flat config published to subscribers — active pass values only (BAU field names). */
export type PublishedSessionConfig = {
  workTime: number;
  restTime: number;
  restBetweenStationsTime: number;
  roundsPerStation: number;
  stations: number;
  fullSessionPasses: number;
  maxTrackPlaySeconds: number;
  workVolume: number;
  restVolume: number;
  spotifyEnabled: boolean;
  spotifyPlaylistUri?: string;
};

/**
 * Snapshot published on every session update.
 * Runtime schema (for subscribers): `lib/gameState/game-state.schema.json`
 * Ingest: POST `/api/game-state` · Latest: GET `/api/game-state` · Webhook: `GAME_STATE_WEBHOOK_URL`
 */
export type GameStatePayload = {
  timestamp: number;
  state: SessionState;
  config: PublishedSessionConfig | null;
};
