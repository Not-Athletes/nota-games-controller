"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { buildPlaceholderGameState } from "@/lib/placeholderGame/buildState";
import type { PlaceholderGameState } from "@/lib/placeholderGame/types";

const PlaceholderGameStateContext = createContext<PlaceholderGameState | null>(null);

/**
 * Shared read-only placeholder game hierarchy (Player → Pair → Major Team).
 * Available on any page under the root layout. Replace `buildPlaceholderGameState`
 * with live ingest/API data when the backend is ready.
 */
export function PlaceholderGameStateProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => buildPlaceholderGameState(), []);

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
