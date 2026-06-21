"use client";

import { QRCodeSVG } from "qrcode.react";
import { useSessionState } from "@/hooks/useSessionState";
import { encodeSessionLinkPayload } from "@/lib/session/sessionLink";

export function SessionQrCode() {
  const { sessionId } = useSessionState();

  if (!sessionId) return null;

  const qrPayload = encodeSessionLinkPayload(sessionId);

  return (
    <section className="rounded-sm bg-zinc-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Join session</p>
      <p className="mt-1 text-sm text-zinc-600">Scan the QR code so phones can join the live session.</p>

      <div className="mt-4 flex justify-center rounded-sm bg-white p-4 ring-1 ring-zinc-200">
        <QRCodeSVG value={qrPayload} size={200} level="M" marginSize={0} />
      </div>
    </section>
  );
}
