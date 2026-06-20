"use client";

import { useSessionState } from "@/hooks/useSessionState";
import { gameSessionManager } from "@/lib/session/gameSessionManager";
import { useSessionStore } from "@/stores/sessionStore";

export function SessionJoinStatus() {
  const { sessionId, connectedCount } = useSessionState();
  const realtimeScoresStatus = useSessionStore((state) => state.realtimeScoresStatus);
  const lastPresenceAt = useSessionStore((state) => state.lastPresenceAt);

  if (!sessionId || !gameSessionManager.isEnabled()) {
    return null;
  }

  const realtimeLabel =
    realtimeScoresStatus === "subscribed"
      ? "Live channel connected"
      : realtimeScoresStatus === "connecting"
        ? "Connecting to live channel…"
        : realtimeScoresStatus === "error"
          ? "Live channel error — check sign-in and Supabase config"
          : "Live channel idle";

  return (
    <section className="rounded-sm bg-zinc-50 p-5 text-sm text-zinc-600">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Join status</p>
      <ul className="mt-2 space-y-1">
        <li>
          Session open: <span className="font-medium text-zinc-900">yes</span>
        </li>
        <li>
          Realtime:{" "}
          <span
            className={
              realtimeScoresStatus === "subscribed"
                ? "font-medium text-emerald-700"
                : realtimeScoresStatus === "error"
                  ? "font-medium text-red-600"
                  : "font-medium text-zinc-900"
            }
          >
            {realtimeLabel}
          </span>
        </li>
        <li>
          Connected phones:{" "}
          <span className="font-medium tabular-nums text-zinc-900">{connectedCount}</span>
        </li>
        {lastPresenceAt ? (
          <li className="text-xs text-zinc-500">
            Last presence event: {new Date(lastPresenceAt).toLocaleTimeString()}
          </li>
        ) : null}
      </ul>
      {connectedCount === 0 && realtimeScoresStatus === "subscribed" ? (
        <p className="mt-3 text-zinc-500">
          The UI is listening on{" "}
          <code className="font-mono text-xs text-zinc-700">session:&lt;id&gt;:scores</code>. If a
          phone joined but nothing appears, the backend may not be broadcasting{" "}
          <code className="font-mono text-xs text-zinc-700">presence_update</code> yet — check
          server logs for that event.
        </p>
      ) : null}
    </section>
  );
}
