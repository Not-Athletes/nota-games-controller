"use client";

import { useMemo, useState, type DragEvent } from "react";
import { PlayerLinkModal } from "@/components/roster/PlayerLinkModal";
import { useRoster } from "@/contexts/RosterContext";
import { getPlayersForTeam, getUnassignedPlayers } from "@/lib/roster/mutations";
import type { RosterPlayer } from "@/types/roster";

const TEAM_THEMES: Record<
  string,
  { header: string; zone: string; chip: string; zoneActive: string }
> = {
  "team-red": {
    header: "text-red-900",
    zone: "border-red-200/80 bg-red-50/40",
    zoneActive: "border-red-400 bg-red-50 ring-2 ring-red-200",
    chip: "bg-white ring-1 ring-red-200/80",
  },
  "team-blue": {
    header: "text-blue-900",
    zone: "border-blue-200/80 bg-blue-50/40",
    zoneActive: "border-blue-400 bg-blue-50 ring-2 ring-blue-200",
    chip: "bg-white ring-1 ring-blue-200/80",
  },
};

const UNASSIGNED_THEME = {
  header: "text-zinc-700",
  zone: "border-zinc-200 bg-zinc-50/80",
  zoneActive: "border-zinc-400 bg-zinc-100 ring-2 ring-zinc-200",
  chip: "bg-white ring-1 ring-zinc-200",
};

const DRAG_PLAYER_KEY = "application/x-nota-player-id";

function QrLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2zM16 16h2v2h-2z" />
    </svg>
  );
}

function DragHandleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="9" cy="7" r="1.25" />
      <circle cx="15" cy="7" r="1.25" />
      <circle cx="9" cy="12" r="1.25" />
      <circle cx="15" cy="12" r="1.25" />
      <circle cx="9" cy="17" r="1.25" />
      <circle cx="15" cy="17" r="1.25" />
    </svg>
  );
}

function PlayerChipFace({
  tag,
  chipClassName,
  className = "",
}: {
  tag: string;
  chipClassName: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center justify-between gap-3 rounded-sm px-3 py-2.5 ${chipClassName} ${className}`}
    >
      <span className="truncate text-sm font-semibold text-zinc-900">{tag}</span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-zinc-100 text-zinc-500">
        <QrLinkIcon className="h-4 w-4" />
      </span>
    </div>
  );
}

function PlayerChip({
  player,
  chipClassName,
  readOnly,
  onShowLink,
}: {
  player: RosterPlayer;
  chipClassName: string;
  readOnly: boolean;
  onShowLink: (player: RosterPlayer) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-no-drag]")) {
      event.preventDefault();
      return;
    }

    setIsDragging(true);
    event.dataTransfer.setData(DRAG_PLAYER_KEY, player.id);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable={!readOnly}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`flex items-stretch gap-1.5 transition-opacity duration-150 ${
        isDragging ? "opacity-35" : "opacity-100"
      } ${readOnly ? "" : "cursor-grab active:cursor-grabbing"}`}
    >
      {!readOnly ? (
        <div className="flex items-center px-0.5 text-zinc-300" aria-hidden>
          <DragHandleIcon className="h-4 w-4" />
        </div>
      ) : null}

      <button
        type="button"
        data-no-drag
        onClick={() => onShowLink(player)}
        className={`min-w-0 flex-1 text-left transition hover:brightness-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 ${readOnly ? "" : "cursor-pointer"}`}
      >
        <PlayerChipFace tag={player.tag} chipClassName={chipClassName} />
      </button>
    </div>
  );
}

function TeamDropZone({
  title,
  teamId,
  players,
  theme,
  readOnly,
  onDropPlayer,
  onShowLink,
}: {
  title: string;
  teamId: string | null;
  players: RosterPlayer[];
  theme: typeof UNASSIGNED_THEME;
  readOnly: boolean;
  onDropPlayer: (playerId: string, teamId: string | null) => void;
  onShowLink: (player: RosterPlayer) => void;
}) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (readOnly) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsOver(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (readOnly) return;
    event.preventDefault();
    setIsOver(false);
    const playerId = event.dataTransfer.getData(DRAG_PLAYER_KEY);
    if (playerId) {
      onDropPlayer(playerId, teamId);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className={`font-display text-lg font-semibold ${theme.header}`}>{title}</h3>
        <span className="text-xs tabular-nums text-zinc-500">{players.length}</span>
      </div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`min-h-48 flex-1 space-y-2 rounded-sm border p-3 transition-all duration-200 ${
          readOnly
            ? `${theme.zone} border-solid`
            : `border-dashed ${isOver ? `${theme.zoneActive} scale-[1.01]` : theme.zone}`
        }`}
      >
        {players.length === 0 ? (
          <p
            className={`py-8 text-center text-sm transition-colors ${
              isOver ? "font-medium text-zinc-700" : "text-zinc-500"
            }`}
          >
            {readOnly ? "No players" : isOver ? "Release to drop" : "Drop players here"}
          </p>
        ) : (
          players.map((player) => (
            <PlayerChip
              key={player.id}
              player={player}
              chipClassName={theme.chip}
              readOnly={readOnly}
              onShowLink={onShowLink}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function RosterSetup() {
  const {
    roster,
    isRosterLocked,
    importNames,
    addName,
    removePlayer,
    assignPlayerToTeam,
    autoAssignTeams,
    clearRoster,
  } = useRoster();

  const [bulkNames, setBulkNames] = useState("");
  const [singleName, setSingleName] = useState("");
  const [linkPlayer, setLinkPlayer] = useState<RosterPlayer | null>(null);

  const unassigned = useMemo(() => getUnassignedPlayers(roster), [roster]);
  const redTeam = roster.teams.find((team) => team.id === "team-red");
  const blueTeam = roster.teams.find((team) => team.id === "team-blue");
  const redPlayers = useMemo(
    () => (redTeam ? getPlayersForTeam(roster, redTeam.id) : []),
    [redTeam, roster]
  );
  const bluePlayers = useMemo(
    () => (blueTeam ? getPlayersForTeam(roster, blueTeam.id) : []),
    [blueTeam, roster]
  );

  const handleAddSingle = () => {
    addName(singleName);
    setSingleName("");
  };

  const handleImport = () => {
    importNames(bulkNames);
    setBulkNames("");
  };

  const handleDrop = (playerId: string, teamId: string | null) => {
    assignPlayerToTeam(playerId, teamId);
  };

  return (
    <section className="flex flex-col gap-5 rounded-sm bg-white p-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-zinc-900">Players</h2>
        <p className="mt-1 text-sm text-zinc-600">
          {isRosterLocked
            ? "Tap a player to show a QR code for phone linking."
            : "Add name tags, assign teams, then tap a player to link a phone via QR."}
        </p>
      </div>

      {linkPlayer ? (
        <PlayerLinkModal player={linkPlayer} onClose={() => setLinkPlayer(null)} />
      ) : null}

      {!isRosterLocked ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
              Add one player
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={singleName}
                placeholder="Name tag"
                onChange={(event) => setSingleName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddSingle();
                  }
                }}
                className="min-w-0 flex-1 rounded-sm border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-zinc-500"
              />
              <button
                type="button"
                onClick={handleAddSingle}
                className="shrink-0 rounded-sm border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
              >
                Add
              </button>
            </div>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
              Import list
            </span>
            <textarea
              value={bulkNames}
              placeholder="One name per line, or comma-separated"
              rows={3}
              onChange={(event) => setBulkNames(event.target.value)}
              className="rounded-sm border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-500"
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={!bulkNames.trim()}
              className="self-start rounded-sm border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Import names
            </button>
          </label>
        </div>
      ) : null}

      {roster.players.length > 0 ? (
        <>
          {!isRosterLocked ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={autoAssignTeams}
                className="rounded-sm bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Auto-assign teams
              </button>
              <button
                type="button"
                onClick={clearRoster}
                className="ml-auto rounded-sm px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Clear all
              </button>
            </div>
          ) : null}

          {!isRosterLocked && unassigned.length > 0 ? (
            <div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {unassigned.length} player{unassigned.length === 1 ? "" : "s"} not on a team yet.
            </div>
          ) : null}

          <div
            className={`grid gap-4 ${isRosterLocked ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}
          >
            {!isRosterLocked || unassigned.length > 0 ? (
              <TeamDropZone
                title="Unassigned"
                teamId={null}
                players={unassigned}
                theme={UNASSIGNED_THEME}
                readOnly={isRosterLocked}
                onDropPlayer={handleDrop}
                onShowLink={setLinkPlayer}
              />
            ) : null}
            {redTeam ? (
              <TeamDropZone
                title={redTeam.name}
                teamId={redTeam.id}
                players={redPlayers}
                theme={TEAM_THEMES[redTeam.id] ?? UNASSIGNED_THEME}
                readOnly={isRosterLocked}
                onDropPlayer={handleDrop}
                onShowLink={setLinkPlayer}
              />
            ) : null}
            {blueTeam ? (
              <TeamDropZone
                title={blueTeam.name}
                teamId={blueTeam.id}
                players={bluePlayers}
                theme={TEAM_THEMES[blueTeam.id] ?? UNASSIGNED_THEME}
                readOnly={isRosterLocked}
                onDropPlayer={handleDrop}
                onShowLink={setLinkPlayer}
              />
            ) : null}
          </div>

          <div className="overflow-x-auto rounded-sm ring-1 ring-zinc-200">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Team</th>
                  {!isRosterLocked ? <th className="w-20 px-4 py-3" /> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {roster.players.map((player) => {
                  const team = roster.teams.find((entry) => entry.id === player.teamId);
                  return (
                    <tr key={player.id}>
                      <td className="px-4 py-3 font-medium text-zinc-900">{player.tag}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{player.id}</td>
                      <td className="px-4 py-3 text-zinc-700">{team?.name ?? "Unassigned"}</td>
                      {!isRosterLocked ? (
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => removePlayer(player.id)}
                            className="text-xs font-semibold text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="rounded-sm bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
          {isRosterLocked
            ? "No players were configured for this session."
            : "No players yet. Add names above to configure the roster."}
        </p>
      )}
    </section>
  );
}
