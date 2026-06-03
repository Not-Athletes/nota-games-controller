"use client";

import { PlaceholderGameStateProvider } from "@/contexts/PlaceholderGameStateContext";
import { SessionControllerProvider } from "@/contexts/SessionControllerContext";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionControllerProvider>
      <PlaceholderGameStateProvider>{children}</PlaceholderGameStateProvider>
    </SessionControllerProvider>
  );
}
