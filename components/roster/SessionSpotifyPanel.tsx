"use client";

import { useState } from "react";
import { ChevronLeft, Music2 } from "lucide-react";
import { MaxTrackPlayField } from "@/components/MaxTrackPlayField";
import { SpotifyNowPlaying } from "@/components/SpotifyNowPlaying";
import { SpotifySettings } from "@/components/SpotifySettings";
import { useSessionController } from "@/contexts/SessionControllerContext";
import { setupToSessionConfig } from "@/lib/session/config";

type SessionSpotifyPanelProps = {
  fieldsDisabled?: boolean;
};

export function SessionSpotifyPanel({ fieldsDisabled = false }: SessionSpotifyPanelProps) {
  const {
    setupValues,
    setSetupValues,
    sessionConfig,
    sessionState,
    spotifyStatus,
    nowPlaying,
    handleConnectSpotify,
    handleDisconnectSpotify,
    setSpotifyEnabled,
    workVolume,
    restVolume,
  } = useSessionController();

  const [minimized, setMinimized] = useState(false);
  const isLive = sessionState.phase !== "idle";
  const liveConfig =
    sessionConfig ??
    setupToSessionConfig(setupValues, {
      workVolume,
      restVolume,
    });

  const persistSetup = (next: typeof setupValues) => {
    setSetupValues(next);
    localStorage.setItem("nota_class_controller_setup", JSON.stringify(next));
  };

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed left-0 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-1 rounded-r-sm bg-white py-4 pl-2 pr-3 shadow-lg ring-1 ring-zinc-200 transition hover:bg-zinc-50"
        aria-label="Open Spotify panel"
      >
        <Music2 className="h-5 w-5 text-zinc-700" strokeWidth={2} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 [writing-mode:vertical-rl] rotate-180">
          Spotify
        </span>
        <span
          className={`mt-1 h-2.5 w-2.5 rounded-full ${
            setupValues.spotifyEnabled ? "bg-[#1DB954]" : "bg-zinc-300"
          }`}
        />
      </button>
    );
  }

  return (
    <aside
      className="fixed left-4 top-4 z-50 flex max-h-[calc(100vh-2rem)] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-sm bg-white shadow-xl ring-1 ring-zinc-200"
      aria-label="Spotify panel"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Music2 className="h-4 w-4 text-zinc-600" strokeWidth={2} />
          <p className="text-sm font-semibold text-zinc-900">Spotify</p>
          <span
            className={`h-2 w-2 rounded-full ${
              setupValues.spotifyEnabled ? "bg-[#1DB954]" : "bg-zinc-300"
            }`}
          />
        </div>
        <button
          type="button"
          onClick={() => setMinimized(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
          aria-label="Minimize Spotify panel"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-none">
        {isLive ? (
          <SpotifyNowPlaying
            config={liveConfig}
            spotifyStatus={spotifyStatus}
            nowPlaying={nowPlaying}
            onToggleEnabled={(enabled) => void setSpotifyEnabled(enabled)}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <SpotifySettings
              compact
              status={spotifyStatus}
              onConnect={handleConnectSpotify}
              onDisconnect={handleDisconnectSpotify}
              values={setupValues}
              onChange={(spotify) => persistSetup({ ...setupValues, ...spotify })}
              disabled={fieldsDisabled}
            />
            <MaxTrackPlayField
              compact
              value={setupValues.maxTrackPlaySeconds}
              onChange={(maxTrackPlaySeconds) =>
                persistSetup({ ...setupValues, maxTrackPlaySeconds })
              }
              disabled={fieldsDisabled}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
