import { getSupabaseBrowserClient, syncSupabaseRealtimeAuth } from "@/lib/supabase/browser";
import {
  leaderboardUpdatePayloadSchema,
  presenceUpdatePayloadSchema,
  realtimeEntryToLeaderboardEntry,
  sessionStateChangePayloadSchema,
  type ConnectedPlayer,
  type LeaderboardEntry,
  type SessionStatus,
} from "@/lib/api/dashboard/schemas";
import { sessionStore } from "@/stores/sessionStore";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type SessionRealtimeHandlers = {
  onStatusChange: (status: SessionStatus) => void;
  onLeaderboardUpdate: (entries: LeaderboardEntry[]) => void;
  onPresenceUpdate: (players: ConnectedPlayer[]) => void;
};

import type { ZodType } from "zod";

function parseRealtimePayload<T>(schema: ZodType<T>, payload: unknown, event: string): T | null {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    console.warn(`[realtime] ${event} payload validation failed`, parsed.error.flatten(), payload);
    return null;
  }
  return parsed.data;
}

function subscribeWithStatus(channel: RealtimeChannel, label: string) {
  channel.subscribe((status, err) => {
    if (status === "SUBSCRIBED") {
      console.info(`[realtime] subscribed: ${label}`);
      if (label.includes(":scores")) {
        sessionStore.setRealtimeScoresStatus("subscribed");
      }
      return;
    }

    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      console.error(`[realtime] ${label} ${status}`, err);
      if (label.includes(":scores")) {
        sessionStore.setRealtimeScoresStatus("error");
      }
    }
  });
}

export async function subscribeToSession(
  sessionId: string,
  handlers: SessionRealtimeHandlers
): Promise<() => void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return () => {};
  }

  sessionStore.setRealtimeScoresStatus("connecting");
  await syncSupabaseRealtimeAuth();

  const stateChannel = supabase
    .channel(`session:${sessionId}:state`)
    .on("broadcast", { event: "session_state_change" }, ({ payload }) => {
      const data = parseRealtimePayload(sessionStateChangePayloadSchema, payload, "session_state_change");
      if (data) {
        handlers.onStatusChange(data.status);
      }
    });

  subscribeWithStatus(stateChannel, `session:${sessionId}:state`);

  const scoresChannel = supabase
    .channel(`session:${sessionId}:scores`)
    .on("broadcast", { event: "leaderboard_update" }, ({ payload }) => {
      const data = parseRealtimePayload(leaderboardUpdatePayloadSchema, payload, "leaderboard_update");
      if (data && data.leaderboard.length > 0) {
        handlers.onLeaderboardUpdate(data.leaderboard.map(realtimeEntryToLeaderboardEntry));
      }
    })
    .on("broadcast", { event: "presence_update" }, ({ payload }) => {
      console.info("[realtime] presence_update received", payload);
      const data = parseRealtimePayload(presenceUpdatePayloadSchema, payload, "presence_update");
      if (data) {
        sessionStore.touchPresence();
        console.info("[realtime] presence_update parsed", data.connectedPlayers.length, "players");
        handlers.onPresenceUpdate(data.connectedPlayers);
      }
    });

  subscribeWithStatus(scoresChannel, `session:${sessionId}:scores`);

  return () => {
    sessionStore.setRealtimeScoresStatus("idle");
    void supabase.removeChannel(stateChannel);
    void supabase.removeChannel(scoresChannel);
  };
}
