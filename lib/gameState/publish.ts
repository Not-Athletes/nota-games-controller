import type { GameStatePayload } from "@/lib/gameState/types";
import { gameSessionManager } from "@/lib/session/gameSessionManager";

const ENDPOINT = "/api/game-state";
const MIN_INTERVAL_MS = 750;

let lastPublishAt = 0;
let lastCriticalKey = "";
let inFlight = false;
let pending: GameStatePayload | null = null;

function criticalKey(payload: GameStatePayload) {
  const { state } = payload;
  return [
    state.phase,
    state.currentStation,
    state.currentRound,
    state.currentPass,
    state.isRunning,
    state.isPaused,
    state.completedIntervals,
    state.totalIntervals,
    payload.config?.workTime ?? "",
    payload.config?.stations ?? "",
  ].join("|");
}

function shouldPublishNow(payload: GameStatePayload, now: number) {
  const key = criticalKey(payload);
  if (key !== lastCriticalKey) {
    return true;
  }
  return now - lastPublishAt >= MIN_INTERVAL_MS;
}

async function sendPayload(payload: GameStatePayload) {
  await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  });
}

async function flush() {
  if (inFlight || !pending) return;
  const payload = pending;
  pending = null;
  inFlight = true;

  try {
    await sendPayload(payload);
    lastPublishAt = Date.now();
    lastCriticalKey = criticalKey(payload);
  } catch (error) {
    console.warn("Failed to publish game state", error);
  } finally {
    inFlight = false;
    if (pending) {
      void flush();
    }
  }
}

/**
 * POST the current game state to `/api/game-state`.
 * Critical changes (phase, station, round, pass, etc.) publish immediately;
 * timer-only updates are throttled (~750ms) to avoid flooding.
 *
 * Backend PATCH (phone sensor activation) always runs — it must not be gated
 * by the local publish throttle.
 */
export function publishGameState(payload: GameStatePayload) {
  const now = Date.now();
  if (shouldPublishNow(payload, now)) {
    pending = payload;
    void flush();
  }

  gameSessionManager.syncGameState(payload);
}
