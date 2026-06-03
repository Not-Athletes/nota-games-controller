"use client";

import { PlaceholderGameStateProvider } from "@/contexts/PlaceholderGameStateContext";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return <PlaceholderGameStateProvider>{children}</PlaceholderGameStateProvider>;
}
