"use client";

import Image from "next/image";
import { ConnectionCard } from "@/components/ConnectionCard";
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
    <ConnectionCard
      title="Spotify"
      status={
        isConnected
          ? "Connected and ready"
          : isPending
            ? "Authenticated. Finalizing player connection..."
            : "Not connected"
      }
      icon={
        <Image
          src={spotifyIconSrc}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8"
          priority
        />
      }
      connected={status.authenticated}
      connectLabel="Connect Spotify"
      disconnectLabel="Disconnect"
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      error={status.error}
    />
  );
}
