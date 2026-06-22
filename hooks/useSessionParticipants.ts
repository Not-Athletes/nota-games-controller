"use client";

import { useMemo } from "react";
import type { SessionParticipant } from "@/lib/api/dashboard/schemas";
import { useSessionStore } from "@/stores/sessionStore";

/**
 * Players joined to the live session — sourced only from Realtime `presence_update`
 * on `session:{id}:scores` (handoff: no REST polling during a session).
 */
export function useSessionParticipants() {
  const sessionId = useSessionStore((state) => state.sessionId);
  const connectedPlayers = useSessionStore((state) => state.connectedPlayers);

  const players = useMemo((): SessionParticipant[] => {
    return [...connectedPlayers]
      .map((player) => ({
        id: player.playerId,
        playerId: player.playerId,
        playerName: player.playerName,
        teamName: null,
        joinedAt: player.joinedAt ? new Date(player.joinedAt).toISOString() : null,
      }))
      .sort((a, b) =>
        a.playerName.localeCompare(b.playerName, undefined, { sensitivity: "base" })
      );
  }, [connectedPlayers]);

  return {
    sessionId,
    players,
    hasSession: Boolean(sessionId),
  };
}
