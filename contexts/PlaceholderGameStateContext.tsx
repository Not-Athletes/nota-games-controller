"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useRoster } from "@/contexts/RosterContext";
import { useSessionController } from "@/contexts/SessionControllerContext";
import { buildPlaceholderGameState } from "@/lib/placeholderGame/buildState";
import type { PlaceholderGameState, SessionContext } from "@/lib/placeholderGame/types";
import { rosterToGameState } from "@/lib/roster/toGameState";

const PlaceholderGameStateContext = createContext<PlaceholderGameState | null>(null);

export function PlaceholderGameStateProvider({ children }: { children: ReactNode }) {
  const { roster } = useRoster();
  const { sessionState, sessionConfig } = useSessionController();

  const value = useMemo(() => {
    const session: SessionContext =
      sessionConfig && sessionState.phase !== "idle"
        ? {
            station: sessionState.currentStation,
            round: sessionState.currentRound,
            pass: sessionState.currentPass,
            totalStations: sessionConfig.stations,
            roundsPerStation: sessionConfig.roundsPerStation,
            totalPasses: sessionConfig.fullSessionPasses,
          }
        : buildPlaceholderGameState().session;

    if (roster.players.length > 0) {
      return rosterToGameState(roster, session);
    }

    return buildPlaceholderGameState();
  }, [roster, sessionConfig, sessionState]);

  return (
    <PlaceholderGameStateContext.Provider value={value}>
      {children}
    </PlaceholderGameStateContext.Provider>
  );
}

export function usePlaceholderGameState(): PlaceholderGameState {
  const value = useContext(PlaceholderGameStateContext);
  if (!value) {
    throw new Error("usePlaceholderGameState must be used within PlaceholderGameStateProvider");
  }
  return value;
}
