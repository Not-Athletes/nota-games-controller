"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useSessionState } from "@/hooks/useSessionState";
import { encodeSessionLinkPayload } from "@/lib/session/sessionLink";

function CopyIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CopySessionIdButton({
  copied,
  onCopy,
  className = "",
}: {
  copied: boolean;
  onCopy: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? "Session ID copied" : "Copy session ID"}
      title={copied ? "Copied" : "Copy session ID"}
      className={`inline-flex shrink-0 items-center justify-center rounded-sm p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 ${copied ? "text-emerald-600" : ""} ${className}`}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

export function SessionIdDisplay({ compact = false }: { compact?: boolean }) {
  const { sessionId } = useSessionState();
  const [copied, setCopied] = useState(false);

  if (!sessionId) return null;

  const qrPayload = encodeSessionLinkPayload(sessionId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
        <QRCodeSVG value={qrPayload} size={72} level="M" marginSize={0} />
        <div className="min-w-0 flex-1">
          <span className="font-semibold uppercase tracking-[0.1em] text-zinc-500">Session</span>
          <div className="mt-1 flex items-start gap-1 rounded-sm bg-white px-2 py-1.5 ring-1 ring-zinc-200">
            <code className="min-w-0 flex-1 break-all font-mono text-zinc-800">{sessionId}</code>
            <CopySessionIdButton copied={copied} onCopy={() => void handleCopy()} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-sm bg-zinc-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Session ID</p>
      <p className="mt-1 text-sm text-zinc-600">
        Scan the QR code or copy the ID so phones can join the live session.
      </p>

      <div className="mt-4 flex justify-center rounded-sm bg-white p-4 ring-1 ring-zinc-200">
        <QRCodeSVG value={qrPayload} size={200} level="M" marginSize={0} />
      </div>

      <div className="mt-3 flex items-center gap-1 rounded-sm bg-white px-3 py-2 ring-1 ring-zinc-200">
        <code className="min-w-0 flex-1 break-all font-mono text-xs text-zinc-800">{sessionId}</code>
        <CopySessionIdButton copied={copied} onCopy={() => void handleCopy()} />
      </div>
    </section>
  );
}
