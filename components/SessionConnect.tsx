"use client";

import { useState } from "react";
import { Gamepad2 } from "lucide-react";
import { ConnectionCard } from "@/components/ConnectionCard";
import { useSessionOrchestration } from "@/hooks/useSessionOrchestration";
import { useSessionState } from "@/hooks/useSessionState";
import { setupSchema } from "@/lib/validation";
import type { SetupInput } from "@/types/session";

type SessionConnectProps = {
  setupValues: SetupInput;
  workVolume: number;
  restVolume: number;
  enabled: boolean;
};

function truncateSessionId(sessionId: string) {
  if (sessionId.length <= 12) return sessionId;
  return `${sessionId.slice(0, 8)}…${sessionId.slice(-4)}`;
}

export function SessionConnect({
  setupValues,
  workVolume,
  restVolume,
  enabled,
}: SessionConnectProps) {
  const { sessionId, statusLabel } = useSessionState();
  const { createSession, disconnectSession } = useSessionOrchestration();
  const [creating, setCreating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!enabled) {
    return null;
  }

  const isOpen = Boolean(sessionId);
  const isActive = statusLabel === "Active";

  const handleCreate = async () => {
    setError(null);
    const parsed = setupSchema.safeParse(setupValues);
    if (!parsed.success) {
      setError("Fix the workout setup fields before creating a session.");
      return;
    }

    setCreating(true);
    try {
      await createSession({
        ...(parsed.data as SetupInput),
        workVolume,
        restVolume,
      });
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : "Could not create session";
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    setDisconnecting(true);
    try {
      await disconnectSession();
    } catch (disconnectError) {
      const message =
        disconnectError instanceof Error ? disconnectError.message : "Could not end session";
      setError(message);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <ConnectionCard
      title="Session"
      status={
        isOpen
          ? isActive
            ? "Live — workout in progress"
            : "Open — phones can join on the Players tab"
          : "Not connected"
      }
      detail={sessionId ? truncateSessionId(sessionId) : undefined}
      icon={<Gamepad2 className="h-8 w-8 text-zinc-600" strokeWidth={1.75} />}
      connected={isOpen}
      connectLabel="Create session"
      disconnectLabel="End session"
      onConnect={() => void handleCreate()}
      onDisconnect={() => void handleDisconnect()}
      connecting={creating}
      connectingLabel="Creating…"
      disconnecting={disconnecting}
      disconnectingLabel="Ending…"
      disconnectDisabled={isActive}
      footer={isActive ? "End the workout before closing the session." : undefined}
      error={error}
    />
  );
}
