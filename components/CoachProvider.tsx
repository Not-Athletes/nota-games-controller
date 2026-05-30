"use client";

import { ConversationProvider } from "@elevenlabs/react";

/**
 * Provides the ElevenLabs conversation context for the NOTA Coach agent.
 * No session is opened until `startSession` is called, so wrapping the whole
 * app is harmless for routes that don't use the coach.
 */
export function CoachProvider({ children }: { children: React.ReactNode }) {
  return <ConversationProvider>{children}</ConversationProvider>;
}
