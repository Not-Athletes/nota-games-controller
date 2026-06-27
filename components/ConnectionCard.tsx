"use client";

import type { ReactNode } from "react";

type ConnectionCardProps = {
  title: string;
  status: string;
  detail?: string;
  icon: ReactNode;
  connected: boolean;
  connectLabel: string;
  disconnectLabel: string;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting?: boolean;
  disconnecting?: boolean;
  connectingLabel?: string;
  disconnectingLabel?: string;
  disconnectDisabled?: boolean;
  footer?: string;
  error?: string | null;
};

export function ConnectionCard({
  title,
  status,
  detail,
  icon,
  connected,
  connectLabel,
  disconnectLabel,
  onConnect,
  onDisconnect,
  connecting = false,
  disconnecting = false,
  connectingLabel = "Connecting…",
  disconnectingLabel = "Disconnecting…",
  disconnectDisabled = false,
  footer,
  error,
}: ConnectionCardProps) {
  return (
    <div className="flex h-full flex-col rounded-sm bg-zinc-50 p-5">
      <div className="flex flex-1 flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-zinc-200 bg-white p-2">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-[0.08em] text-zinc-900">{title}</p>
            <p className="mt-0.5 text-sm text-zinc-600">{status}</p>
            {detail ? (
              <p className="mt-0.5 truncate font-mono text-xs text-zinc-500">{detail}</p>
            ) : (
              <p className="mt-0.5 font-mono text-xs text-transparent" aria-hidden>
                —
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 self-center">
          {connected ? (
            <button
              type="button"
              onClick={onDisconnect}
              disabled={disconnecting || disconnectDisabled}
              className="whitespace-nowrap rounded-sm border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {disconnecting ? disconnectingLabel : disconnectLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={connecting}
              className="whitespace-nowrap rounded-sm bg-[#1DB954] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#18a449] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {connecting ? connectingLabel : connectLabel}
            </button>
          )}
        </div>
      </div>

      {footer ? <p className="mt-3 text-sm text-zinc-500">{footer}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
