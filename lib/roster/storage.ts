import { EMPTY_ROSTER, ROSTER_STORAGE_KEY } from "@/lib/roster/constants";
import { normalizeRosterState } from "@/lib/roster/mutations";
import type { RosterState } from "@/types/roster";

export function readRosterFromStorage(): RosterState {
  if (typeof window === "undefined") {
    return { ...EMPTY_ROSTER, teams: [...EMPTY_ROSTER.teams] };
  }

  try {
    const raw = localStorage.getItem(ROSTER_STORAGE_KEY);
    if (!raw) {
      return { ...EMPTY_ROSTER, teams: [...EMPTY_ROSTER.teams] };
    }
    return normalizeRosterState(JSON.parse(raw));
  } catch {
    return { ...EMPTY_ROSTER, teams: [...EMPTY_ROSTER.teams] };
  }
}

export function writeRosterToStorage(state: RosterState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROSTER_STORAGE_KEY, JSON.stringify(state));
}
