"use client";

import { useMemo } from "react";
import type { SessionParticipant } from "@/lib/api/dashboard/schemas";
import { resolvePlayerTeam } from "@/lib/session/playerTeams";
import { useSessionStore } from "@/stores/sessionStore";

/**
 * Players joined to the live session — live list from Realtime `presence_update`,
 * team names from GET /participants (handoff: teams.name e.g. Red/Blue).
 */
export function useSessionParticipants() {
  const sessionId = useSessionStore((state) => state.sessionId);
  const connectedPlayers = useSessionStore((state) => state.connectedPlayers);
  const playerTeams = useSessionStore((state) => state.playerTeams);

  const players = useMemo((): SessionParticipant[] => {
    return [...connectedPlayers]
      .map((player) => {
        const team = resolvePlayerTeam(player, playerTeams);
        return {
          id: player.playerId,
          playerId: player.playerId,
          playerName: player.playerName,
          teamId: team.teamId,
          teamName: team.teamName,
          joinedAt: player.joinedAt ? new Date(player.joinedAt).toISOString() : null,
        };
      })
      .sort((a, b) =>
        a.playerName.localeCompare(b.playerName, undefined, { sensitivity: "base" })
      );
  }, [connectedPlayers, playerTeams]);

  return {
    sessionId,
    players,
    hasSession: Boolean(sessionId),
  };
}
