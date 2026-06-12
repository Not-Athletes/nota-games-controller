"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSessionController } from "@/contexts/SessionControllerContext";
import {
  addPlayers,
  assignPlayerToTeam,
  autoAssignTeams,
  parseNameList,
  removePlayer,
  updatePlayerTag,
} from "@/lib/roster/mutations";
import { readRosterFromStorage, writeRosterToStorage } from "@/lib/roster/storage";
import type { RosterState } from "@/types/roster";

type RosterContextValue = {
  roster: RosterState;
  isRosterLocked: boolean;
  importNames: (raw: string) => void;
  addName: (name: string) => void;
  removePlayer: (playerId: string) => void;
  updateTag: (playerId: string, tag: string) => void;
  assignPlayerToTeam: (playerId: string, teamId: string | null) => void;
  autoAssignTeams: () => void;
  clearRoster: () => void;
};

const RosterContext = createContext<RosterContextValue | null>(null);

function persist(next: RosterState) {
  writeRosterToStorage(next);
  return next;
}

export function RosterProvider({ children }: { children: ReactNode }) {
  const { sessionState } = useSessionController();
  const isRosterLocked = sessionState.phase !== "idle";
  const [roster, setRoster] = useState<RosterState>(() => readRosterFromStorage());

  useEffect(() => {
    writeRosterToStorage(roster);
  }, [roster]);

  const commit = useCallback(
    (updater: (prev: RosterState) => RosterState) => {
      if (sessionState.phase !== "idle") return;
      setRoster((prev) => persist(updater(prev)));
    },
    [sessionState.phase]
  );

  const value = useMemo<RosterContextValue>(
    () => ({
      roster,
      isRosterLocked,
      importNames: (raw) => commit((prev) => addPlayers(prev, parseNameList(raw))),
      addName: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        commit((prev) => addPlayers(prev, [trimmed]));
      },
      removePlayer: (playerId) => commit((prev) => removePlayer(prev, playerId)),
      updateTag: (playerId, tag) => commit((prev) => updatePlayerTag(prev, playerId, tag)),
      assignPlayerToTeam: (playerId, teamId) =>
        commit((prev) => assignPlayerToTeam(prev, playerId, teamId)),
      autoAssignTeams: () => commit((prev) => autoAssignTeams(prev)),
      clearRoster: () =>
        commit((prev) => ({
          ...prev,
          players: [],
        })),
    }),
    [commit, isRosterLocked, roster]
  );

  return <RosterContext.Provider value={value}>{children}</RosterContext.Provider>;
}

export function useRoster() {
  const value = useContext(RosterContext);
  if (!value) {
    throw new Error("useRoster must be used within RosterProvider");
  }
  return value;
}
