"use client";

import { useState } from "react";
import { ChevronRight, Users } from "lucide-react";
import { SessionPlayersTable } from "@/components/roster/SessionPlayersTable";
import { SessionQrCode } from "@/components/SessionQrCode";
import { useSessionParticipants } from "@/hooks/useSessionParticipants";
import { useSessionStore } from "@/stores/sessionStore";

export function SessionPlayersPanel() {
  const sessionId = useSessionStore((state) => state.sessionId);
  const { players } = useSessionParticipants();
  const [minimized, setMinimized] = useState(false);

  if (!sessionId) {
    return null;
  }

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed right-0 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-1 rounded-l-sm bg-white py-4 pl-3 pr-2 shadow-lg ring-1 ring-zinc-200 transition hover:bg-zinc-50"
        aria-label={`Open players panel, ${players.length} joined`}
      >
        <Users className="h-5 w-5 text-zinc-700" strokeWidth={2} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 [writing-mode:vertical-rl]">
          Players
        </span>
        <span className="mt-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1DB954] px-1.5 text-xs font-bold tabular-nums text-white">
          {players.length}
        </span>
      </button>
    );
  }

  return (
    <aside
      className="fixed right-4 top-4 z-50 flex max-h-[calc(100vh-2rem)] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-sm bg-white shadow-xl ring-1 ring-zinc-200"
      aria-label="Players panel"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-600" strokeWidth={2} />
          <p className="text-sm font-semibold text-zinc-900">Players</p>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-zinc-600">
            {players.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMinimized(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
          aria-label="Minimize players panel"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-4 pt-4">
          <SessionQrCode size={160} compact />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-none">
          <SessionPlayersTable compact />
        </div>
      </div>
    </aside>
  );
}
