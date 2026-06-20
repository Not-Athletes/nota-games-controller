"use client";

import { useEffect, useMemo, useState } from "react";
import type { SessionParticipant } from "@/lib/api/dashboard/schemas";
import { gameSessionManager } from "@/lib/session/gameSessionManager";
import { participantService } from "@/services/participant.service";
import { useSessionStore } from "@/stores/sessionStore";

export function useSessionParticipants() {
  const sessionId = useSessionStore((state) => state.sessionId);
  const connectedPlayers = useSessionStore((state) => state.connectedPlayers);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId || !gameSessionManager.isEnabled()) {
      setParticipants([]);
      return;
    }

    let cancelled = false;

    async function load() {
      if (!participantService.isParticipantsListSupported()) {
        setParticipants([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const rows = await participantService.fetchParticipants(sessionId!);
        if (!cancelled) {
          setParticipants(rows);
        }
      } catch {
        if (!cancelled) {
          setParticipants([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    const interval = setInterval(() => {
      void load();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);

  const players = useMemo(() => {
    const byId = new Map<string, SessionParticipant>();

    for (const participant of participants) {
      byId.set(participant.playerId, participant);
    }

    for (const connected of connectedPlayers) {
      if (byId.has(connected.playerId)) continue;
      byId.set(connected.playerId, {
        id: connected.playerId,
        playerId: connected.playerId,
        playerName: connected.playerName,
        teamName: null,
        joinedAt: connected.joinedAt ? new Date(connected.joinedAt).toISOString() : null,
      });
    }

    return Array.from(byId.values()).sort((a, b) =>
      a.playerName.localeCompare(b.playerName, undefined, { sensitivity: "base" })
    );
  }, [connectedPlayers, participants]);

  return {
    sessionId,
    players,
    loading,
    hasSession: Boolean(sessionId),
  };
}
