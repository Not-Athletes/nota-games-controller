"use client";

import { QRCodeSVG } from "qrcode.react";
import { useSessionState } from "@/hooks/useSessionState";
import { encodeSessionLinkPayload } from "@/lib/session/sessionLink";

type SessionQrCodeProps = {
  size?: number;
  compact?: boolean;
};

export function SessionQrCode({ size = 200, compact = false }: SessionQrCodeProps) {
  const { sessionId } = useSessionState();

  if (!sessionId) return null;

  const qrPayload = encodeSessionLinkPayload(sessionId);

  return (
    <section className={compact ? "" : "rounded-sm bg-zinc-50 p-5"}>
      <div
        className={`flex justify-center rounded-sm bg-white p-3 ring-1 ring-zinc-200 ${compact ? "" : "p-4"}`}
      >
        <QRCodeSVG value={qrPayload} size={size} level="M" marginSize={0} />
      </div>
    </section>
  );
}
