"use client";

import { QRCodeSVG } from "qrcode.react";
import { encodePlayerLinkPayload } from "@/lib/roster/playerLink";
import type { RosterPlayer } from "@/types/roster";

type PlayerLinkModalProps = {
  player: RosterPlayer;
  onClose: () => void;
};

export function PlayerLinkModal({ player, onClose }: PlayerLinkModalProps) {
  const payload = encodePlayerLinkPayload(player);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-sm bg-white p-6 ring-1 ring-zinc-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-link-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="player-link-title" className="font-display text-xl font-semibold text-zinc-900">
              Link phone
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              Scan so this phone sends scores and movement as{" "}
              <span className="font-medium text-zinc-900">{player.tag}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xl leading-none text-zinc-400 transition hover:text-zinc-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mt-6 flex justify-center rounded-sm bg-white p-4 ring-1 ring-zinc-200">
          <QRCodeSVG value={payload} size={200} level="M" marginSize={0} />
        </div>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-semibold text-zinc-500">Name</dt>
            <dd className="text-zinc-900">{player.tag}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-semibold text-zinc-500">ID</dt>
            <dd className="break-all font-mono text-xs text-zinc-700">{player.id}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs leading-relaxed text-zinc-500">
          The QR encodes this player&apos;s ID and name tag. Wearables will use the same fields when
          registration is added later.
        </p>
      </div>
    </div>
  );
}
