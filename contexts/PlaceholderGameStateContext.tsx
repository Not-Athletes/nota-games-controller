"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSessionController } from "@/contexts/SessionControllerContext";
import { buildPlaceholderGameState } from "@/lib/placeholderGame/buildState";
import type { PlaceholderGameState, SessionContext } from "@/lib/placeholderGame/types";

const PlaceholderGameStateContext = createContext<PlaceholderGameState | null>(null);

export function PlaceholderGameStateProvider({ children }: { children: ReactNode }) {
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

    return {
      ...buildPlaceholderGameState(),
      session,
    };
  }, [sessionConfig, sessionState]);

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
