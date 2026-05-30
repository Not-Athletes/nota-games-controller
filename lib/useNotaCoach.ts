"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus,
} from "@elevenlabs/react";
import type { AudioCues } from "@/lib/audio";
import { buildAnnouncement, type GameEvent } from "@/lib/announcer";

const COACH_ENABLED_KEY = "nota_coach_enabled";
const PUBLIC_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

export type CoachConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export type NotaCoach = {
  /** User preference: should the coach be used at all. */
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  /** Whether the coach is configured/reachable (false => always use cues). */
  available: boolean;
  status: CoachConnectionStatus;
  isSpeaking: boolean;
  /** Open a live session (no-op if disabled/unavailable). Provide game context to prime the host. */
  connect: (primer?: string) => void;
  /** Tear down the live session. */
  disconnect: () => void;
  /**
   * Announce a game event. Resolves immediately when the agent handles it
   * (fire-and-forget so the app keeps owning timing); awaits the fallback
   * cue(s) when the agent is unavailable so the experience matches the old
   * pre-recorded flow.
   */
  announce: (event: GameEvent) => Promise<void>;
};

export function useNotaCoach(audioCuesRef: RefObject<AudioCues | null>): NotaCoach {
  const controls = useConversationControls();
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  const { setMuted } = useConversationInput();

  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const raw = localStorage.getItem(COACH_ENABLED_KEY);
      return raw === null ? true : raw === "true";
    } catch {
      return true;
    }
  });
  const [available, setAvailable] = useState(true);

  // Refs mirror reactive values so the action callbacks below stay stable
  // (the controls from the SDK are already stable references).
  const enabledRef = useRef(enabled);
  const availableRef = useRef(true);
  const statusRef = useRef<CoachConnectionStatus>("disconnected");
  const primedRef = useRef(false);
  const connectingRef = useRef(false);
  const pendingPrimerRef = useRef<string | null>(null);
  const setMutedRef = useRef(setMuted);

  useEffect(() => {
    statusRef.current = status as CoachConnectionStatus;
  }, [status]);

  useEffect(() => {
    setMutedRef.current = setMuted;
  }, [setMuted]);

  const setAvailableBoth = useCallback((value: boolean) => {
    availableRef.current = value;
    setAvailable(value);
  }, []);

  // On connect: mute the mic (one-way host, not a chat) and prime with game
  // context. On disconnect/error: reset so the next session re-primes.
  useEffect(() => {
    if (status === "connected" && !primedRef.current) {
      primedRef.current = true;
      try {
        setMutedRef.current(true);
      } catch {
        // ignore
      }
      const primer = pendingPrimerRef.current;
      pendingPrimerRef.current = null;
      if (primer) {
        try {
          controls.sendContextualUpdate(primer);
        } catch {
          // ignore
        }
      }
    }
    if (status === "disconnected" || status === "error") {
      primedRef.current = false;
    }
  }, [status, controls]);

  const setEnabled = useCallback((value: boolean) => {
    enabledRef.current = value;
    setEnabledState(value);
    try {
      localStorage.setItem(COACH_ENABLED_KEY, String(value));
    } catch {
      // ignore
    }
    if (!value) {
      try {
        controls.endSession();
      } catch {
        // ignore
      }
    }
  }, [controls]);

  const connect = useCallback(
    (primer?: string) => {
      if (!enabledRef.current) return;
      if (connectingRef.current) return;
      if (statusRef.current === "connected" || statusRef.current === "connecting") return;

      connectingRef.current = true;
      pendingPrimerRef.current = primer ?? null;

      void (async () => {
        try {
          const res = await fetch("/api/convai/token");
          if (res.ok) {
            const data = (await res.json()) as { token?: string };
            if (data.token) {
              setAvailableBoth(true);
              controls.startSession({
                conversationToken: data.token,
                connectionType: "webrtc",
              });
              return;
            }
          }
          if (PUBLIC_AGENT_ID) {
            setAvailableBoth(true);
            controls.startSession({ agentId: PUBLIC_AGENT_ID });
            return;
          }
          // Not configured anywhere: the coach is unavailable, cues take over.
          setAvailableBoth(false);
          pendingPrimerRef.current = null;
        } catch {
          setAvailableBoth(false);
          pendingPrimerRef.current = null;
        } finally {
          connectingRef.current = false;
        }
      })();
    },
    [controls, setAvailableBoth]
  );

  const disconnect = useCallback(() => {
    connectingRef.current = false;
    primedRef.current = false;
    pendingPrimerRef.current = null;
    try {
      controls.endSession();
    } catch {
      // ignore
    }
  }, [controls]);

  const announce = useCallback(
    async (event: GameEvent): Promise<void> => {
      const plan = buildAnnouncement(event);
      const canUseAgent =
        enabledRef.current && availableRef.current && statusRef.current === "connected";

      if (canUseAgent) {
        try {
          if (plan.mode === "speak") {
            controls.sendUserMessage(plan.message);
          } else {
            controls.sendContextualUpdate(plan.message);
          }
          return;
        } catch {
          // fall through to cue fallback below
        }
      }

      const cues = audioCuesRef.current;
      if (!cues || plan.fallbackCues.length === 0) return;
      for (let i = 0; i < plan.fallbackCues.length; i += 1) {
        const cue = plan.fallbackCues[i];
        if (i === plan.fallbackCues.length - 1) {
          await cues.playAndWait(cue);
        } else {
          cues.play(cue);
        }
      }
    },
    [audioCuesRef, controls]
  );

  return {
    enabled,
    setEnabled,
    available,
    status: status as CoachConnectionStatus,
    isSpeaking,
    connect,
    disconnect,
    announce,
  };
}
