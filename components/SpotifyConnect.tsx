"use client";

import type { SpotifyStatus } from "@/lib/spotify";

type SpotifyConnectProps = {
  status: SpotifyStatus;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function SpotifyConnect({
  status,
  onConnect,
  onDisconnect,
}: SpotifyConnectProps) {
  return (
    <div className="rounded-sm border border-zinc-300 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
            Spotify
          </p>
          <p className="text-sm text-zinc-700">
            {status.authenticated
              ? status.playerReady
                ? "Connected"
                : "Authenticated - player not ready yet"
              : "Not connected"}
          </p>
        </div>

        {status.authenticated ? (
          <button
            onClick={onDisconnect}
            className="rounded-sm border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="rounded-sm bg-green-500 px-4 py-2 text-sm font-semibold text-black hover:bg-green-400"
          >
            Connect Spotify
          </button>
        )}
      </div>
      {status.error ? <p className="mt-2 text-sm text-red-400">{status.error}</p> : null}
    </div>
  );
}
