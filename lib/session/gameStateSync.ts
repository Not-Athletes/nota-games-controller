import type { SessionStatePatch } from "@/lib/api/dashboard/schemas";
import type { GameStatePayload } from "@/lib/gameState/types";
import { toBackendStatePatch } from "@/lib/session/backendGameState";

const MIN_INTERVAL_MS = 750;

let lastSyncAt = 0;
let lastCriticalKey = "";
let inFlight = false;
let pending: { sessionId: string; patch: SessionStatePatch } | null = null;
let sendPatch: ((sessionId: string, patch: SessionStatePatch) => Promise<void>) | null = null;

function criticalKey(patch: SessionStatePatch) {
  return [
    patch.status ?? "",
    patch.phase ?? "",
    patch.currentStation ?? "",
    patch.currentRound ?? "",
    patch.currentPass ?? "",
    patch.isRunning ?? "",
    patch.isPaused ?? "",
    patch.completedIntervals ?? "",
    patch.totalIntervals ?? "",
  ].join("|");
}

function shouldSyncNow(patch: SessionStatePatch, now: number) {
  const key = criticalKey(patch);
  if (key !== lastCriticalKey) {
    return true;
  }
  return now - lastSyncAt >= MIN_INTERVAL_MS;
}

async function flush() {
  if (inFlight || !pending || !sendPatch) return;

  const { sessionId, patch } = pending;
  pending = null;
  inFlight = true;

  try {
    await sendPatch(sessionId, patch);
    lastSyncAt = Date.now();
    lastCriticalKey = criticalKey(patch);
  } catch (error) {
    console.warn("Failed to sync game state to backend", error);
  } finally {
    inFlight = false;
    if (pending) {
      void flush();
    }
  }
}

export function configureGameStateSync(
  sender: (sessionId: string, patch: SessionStatePatch) => Promise<void>
) {
  sendPatch = sender;
}

export function queueGameStateSync(sessionId: string, payload: GameStatePayload) {
  if (!sendPatch) return;

  const patch = toBackendStatePatch(payload);
  if (!patch) return;

  const now = Date.now();
  if (!shouldSyncNow(patch, now)) {
    return;
  }

  pending = { sessionId, patch };
  void flush();
}

/** Bypass throttling for lifecycle transitions (end session, etc.). */
export async function syncGameStateImmediate(sessionId: string, payload: GameStatePayload) {
  if (!sendPatch) return;

  const patch = toBackendStatePatch(payload);
  if (!patch) return;

  pending = null;
  inFlight = false;

  try {
    await sendPatch(sessionId, patch);
    lastSyncAt = Date.now();
    lastCriticalKey = criticalKey(patch);
  } catch (error) {
    console.warn("Failed to sync game state to backend", error);
    throw error;
  }
}

export function resetGameStateSync() {
  pending = null;
  inFlight = false;
  lastCriticalKey = "";
}
