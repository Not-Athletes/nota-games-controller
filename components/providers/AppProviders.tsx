"use client";

import { SessionOrchestrationProvider } from "@/components/providers/SessionOrchestrationProvider";
import { SessionControllerProvider } from "@/contexts/SessionControllerContext";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionControllerProvider>
      <SessionOrchestrationProvider>{children}</SessionOrchestrationProvider>
    </SessionControllerProvider>
  );
}
