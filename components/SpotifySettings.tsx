"use client";

import Image from "next/image";
import type { SpotifyStatus } from "@/lib/spotify";
import type { SetupInput } from "@/types/session";

type SpotifySettingsProps = {
  status: SpotifyStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  values: Pick<SetupInput, "spotifyEnabled" | "spotifyPlaylistUri">;
  onChange: (values: Pick<SetupInput, "spotifyEnabled" | "spotifyPlaylistUri">) => void;
  errors?: {
    spotifyPlaylistUri?: string;
  };
  disabled?: boolean;
  compact?: boolean;
};

export function SpotifySettings({
  status,
  onConnect,
  onDisconnect,
  values,
  onChange,
  errors = {},
  disabled = false,
  compact = false,
}: SpotifySettingsProps) {
  const isConnected = status.authenticated && status.playerReady;
  const isPending = status.authenticated && !status.playerReady;
  const spotifyIconSrc = isConnected
    ? "/icons/Primary_Logo_Green_RGB.svg"
    : "/icons/Primary_Logo_Black_PMS_C.svg";

  const connectionStatus = isConnected
    ? "Connected and ready"
    : isPending
      ? "Authenticated. Finalizing player connection..."
      : "Not connected";

  return (
    <div className={`flex flex-col ${compact ? "" : "rounded-sm sm:col-span-2 lg:col-span-2"} ${disabled && !compact ? "bg-zinc-100/80" : compact ? "" : "bg-zinc-50"}`}>
      <div
        className={`flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 ${compact ? "pb-4" : "p-5"}`}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-zinc-200 bg-white p-2">
            <Image
              src={spotifyIconSrc}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Spotify</p>
            <p className="mt-1 text-sm text-zinc-700">{connectionStatus}</p>
          </div>
        </div>

        <div className="shrink-0 self-center">
          {status.authenticated ? (
            <button
              type="button"
              onClick={onDisconnect}
              disabled={disabled}
              className="whitespace-nowrap rounded-sm border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={disabled}
              className="whitespace-nowrap rounded-sm bg-[#1DB954] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#18a449] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Connect Spotify
            </button>
          )}
        </div>
      </div>

      {status.error ? (
        <p className={`text-sm text-red-400 ${compact ? "pt-3" : "px-5 pt-3"}`}>{status.error}</p>
      ) : null}

      <div className={`flex flex-col ${compact ? "pt-4" : "p-5"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`text-xs font-semibold uppercase tracking-[0.1em] ${
              disabled ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            Session music
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={values.spotifyEnabled}
              disabled={disabled}
              onClick={() => onChange({ ...values, spotifyEnabled: !values.spotifyEnabled })}
              className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                disabled
                  ? "cursor-not-allowed bg-zinc-200"
                  : values.spotifyEnabled
                    ? "bg-[#1DB954]"
                    : "bg-zinc-300"
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition ${
                  values.spotifyEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${disabled ? "text-zinc-400" : "text-zinc-800"}`}
            >
              {values.spotifyEnabled ? "On" : "Off"}
            </span>
          </div>
        </div>
        <p
          className={`mt-1 text-xs leading-relaxed ${
            disabled ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          {values.spotifyEnabled
            ? "Playlist shuffles during work; volume drops on rest."
            : "No music. Session timers run silently."}
        </p>
        <label className="mt-4 flex flex-col gap-2">
          <span
            className={`text-xs font-semibold uppercase tracking-[0.1em] ${
              disabled || !values.spotifyEnabled ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            Playlist
          </span>
          <input
            name="spotifyPlaylistUri"
            type="text"
            value={values.spotifyPlaylistUri ?? ""}
            disabled={disabled || !values.spotifyEnabled}
            placeholder="https://open.spotify.com/playlist/…"
            onChange={(event) =>
              onChange({ ...values, spotifyPlaylistUri: event.target.value })
            }
            className={`rounded-sm border px-4 py-3 outline-none ring-0 transition ${
              disabled || !values.spotifyEnabled
                ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                : "border-zinc-300 bg-white text-zinc-900 focus:border-zinc-500"
            }`}
          />
          {errors.spotifyPlaylistUri ? (
            <span className="text-xs text-red-400">{errors.spotifyPlaylistUri}</span>
          ) : null}
        </label>
      </div>
    </div>
  );
}
