"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { useSessionController } from "@/contexts/SessionControllerContext";
import { useSessionOrchestration } from "@/hooks/useSessionOrchestration";
import { useSessionStore } from "@/stores/sessionStore";

export function SessionEndFab() {
  const sessionId = useSessionStore((state) => state.sessionId);
  const { sessionState, endSession, goHome } = useSessionController();
  const { disconnectSession } = useSessionOrchestration();
  const [confirming, setConfirming] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLobby = sessionState.phase === "idle";
  const isComplete = sessionState.phase === "complete";

  useEffect(() => {
    if (!confirming) return;
    const timeout = setTimeout(() => setConfirming(false), 5000);
    return () => clearTimeout(timeout);
  }, [confirming]);

  if (!sessionId) {
    return null;
  }

  const handleConfirm = async () => {
    setConfirming(false);
    setError(null);
    setEnding(true);

    try {
      if (isLobby) {
        await disconnectSession();
      } else {
        endSession();
      }
    } catch (endError) {
      const message = endError instanceof Error ? endError.message : "Could not end session";
      setError(message);
    } finally {
      setEnding(false);
    }
  };

  if (isComplete) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={goHome}
          className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[#1DB954]/25 transition hover:bg-[#18a449]"
          aria-label="Back to setup"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          Back to setup
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {error ? (
        <p className="max-w-xs rounded-sm bg-red-50 px-3 py-2 text-right text-sm text-red-600 ring-1 ring-red-200">
          {error}
        </p>
      ) : null}

      {confirming ? (
        <div className="flex items-center gap-2 rounded-full bg-white p-1.5 shadow-xl ring-1 ring-zinc-200">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={ending}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={ending}
            className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ending ? "Ending…" : "Confirm end"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={ending}
          className="inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={isLobby ? "End session" : "End workout"}
        >
          <LogOut className="h-5 w-5" strokeWidth={2} />
          End session
        </button>
      )}
    </div>
  );
}
