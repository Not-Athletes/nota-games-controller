"use client";

import { PlaceholderGameStateProvider } from "@/contexts/PlaceholderGameStateContext";
import { RosterProvider } from "@/contexts/RosterContext";
import { SessionControllerProvider } from "@/contexts/SessionControllerContext";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionControllerProvider>
      <RosterProvider>
        <PlaceholderGameStateProvider>{children}</PlaceholderGameStateProvider>
      </RosterProvider>
    </SessionControllerProvider>
  );
}
