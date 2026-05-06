"use client";

import Image from "next/image";
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
  const isConnected = status.authenticated && status.playerReady;
  const isPending = status.authenticated && !status.playerReady;
  const spotifyIconSrc = isConnected
    ? "/icons/Primary_Logo_Green_RGB.svg"
    : "/icons/Primary_Logo_Black_PMS_C.svg";

  return (
    <div className="rounded-sm bg-white p-5 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-sm border border-zinc-200 bg-zinc-50 p-2">
            <Image
              src={spotifyIconSrc}
              alt="Spotify"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.08em] text-zinc-900">
              Spotify
            </p>
            <p className="text-sm text-zinc-600">
              {isConnected
                ? "Connected and ready"
                : isPending
                  ? "Authenticated. Finalizing player connection..."
                  : "Not connected"}
            </p>
          </div>
        </div>

        {status.authenticated ? (
          <button
            onClick={onDisconnect}
            className="rounded-sm border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="rounded-sm bg-[#1DB954] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#18a449]"
          >
            Connect Spotify
          </button>
        )}
      </div>
      {status.error ? <p className="mt-2 text-sm text-red-400">{status.error}</p> : null}
    </div>
  );
}
