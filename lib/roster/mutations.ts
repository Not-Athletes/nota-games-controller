import { DEFAULT_TEAMS, EMPTY_ROSTER } from "@/lib/roster/constants";
import { createPlayerId } from "@/lib/roster/ids";
import type { RosterPlayer, RosterState } from "@/types/roster";

export function parseNameList(raw: string) {
  return raw
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function createPlayer(tag: string): RosterPlayer {
  return {
    id: createPlayerId(),
    tag,
    teamId: null,
  };
}

export function addPlayers(state: RosterState, names: string[]): RosterState {
  const existingTags = new Set(state.players.map((player) => player.tag.toLowerCase()));
  const newPlayers = names
    .filter((name) => !existingTags.has(name.toLowerCase()))
    .map((name) => createPlayer(name));

  return {
    ...state,
    players: [...state.players, ...newPlayers],
  };
}

export function removePlayer(state: RosterState, playerId: string): RosterState {
  return {
    ...state,
    players: state.players.filter((player) => player.id !== playerId),
  };
}

export function updatePlayerTag(state: RosterState, playerId: string, tag: string): RosterState {
  const trimmed = tag.trim();
  if (!trimmed) return state;

  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId ? { ...player, tag: trimmed } : player
    ),
  };
}

export function assignPlayerToTeam(
  state: RosterState,
  playerId: string,
  teamId: string | null
): RosterState {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId ? { ...player, teamId } : player
    ),
  };
}

export function autoAssignTeams(state: RosterState, shuffle = true): RosterState {
  if (state.teams.length === 0 || state.players.length === 0) return state;

  const pool = [...state.players];
  if (shuffle) {
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }

  const assignments = new Map(
    pool.map((player, index) => [player.id, state.teams[index % state.teams.length].id])
  );

  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      teamId: assignments.get(player.id) ?? player.teamId,
    })),
  };
}

type LegacyStoredPlayer = {
  id: string;
  tag: string;
  teamId?: string | null;
  majorTeamId?: string | null;
  duoId?: string | null;
};

export function normalizeRosterState(raw: unknown): RosterState {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_ROSTER, teams: [...DEFAULT_TEAMS] };
  }

  const value = raw as Partial<RosterState> & { duos?: unknown[] };
  const players = Array.isArray(value.players)
    ? value.players.map((player) => {
        const legacy = player as LegacyStoredPlayer;
        return {
          id: legacy.id,
          tag: legacy.tag,
          teamId: legacy.teamId ?? legacy.majorTeamId ?? null,
        };
      })
    : [];

  return {
    teams: Array.isArray(value.teams) && value.teams.length > 0 ? value.teams : [...DEFAULT_TEAMS],
    players,
  };
}

export function getUnassignedPlayers(state: RosterState) {
  return state.players.filter((player) => !player.teamId);
}

export function getPlayersForTeam(state: RosterState, teamId: string) {
  return state.players.filter((player) => player.teamId === teamId);
}
