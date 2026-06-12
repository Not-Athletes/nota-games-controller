"use client";

import { useEffect, useState } from "react";

type SessionControlsProps = {
  onEndSession: () => void;
  onResumeNextPass?: () => void;
  showResumeNextPass?: boolean;
  sessionComplete?: boolean;
  onGoHome?: () => void;
};

function ControlButton({
  label,
  onClick,
  tone = "default",
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger" | "primary" | "muted";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-h-14 rounded-sm px-4 py-3 text-sm font-semibold transition ${
        tone === "danger"
          ? "bg-red-500 text-white hover:bg-red-400"
          : tone === "primary"
            ? "bg-[#1DB954] text-white hover:bg-[#18a449]"
            : tone === "muted"
              ? "bg-zinc-200 text-zinc-900 hover:bg-zinc-300"
              : "bg-zinc-900 text-white hover:bg-zinc-800"
      } disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500`}
    >
      {label}
    </button>
  );
}

export function SessionControls({
  onEndSession,
  onResumeNextPass,
  showResumeNextPass = false,
  sessionComplete = false,
  onGoHome,
}: SessionControlsProps) {
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  useEffect(() => {
    if (!confirmingEnd) return;
    const timeout = setTimeout(() => setConfirmingEnd(false), 5000);
    return () => clearTimeout(timeout);
  }, [confirmingEnd]);

  if (sessionComplete && onGoHome) {
    return (
      <div className="grid grid-cols-1 gap-3">
        <ControlButton label="Back to setup" tone="primary" onClick={onGoHome} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {showResumeNextPass && onResumeNextPass ? (
        <ControlButton
          label="Start Next Pass"
          tone="primary"
          onClick={onResumeNextPass}
        />
      ) : null}
      {confirmingEnd ? (
        <div className="grid grid-cols-2 gap-3">
          <ControlButton
            label="Cancel"
            tone="muted"
            onClick={() => setConfirmingEnd(false)}
          />
          <ControlButton
            label="Confirm End"
            tone="danger"
            onClick={() => {
              setConfirmingEnd(false);
              onEndSession();
            }}
          />
        </div>
      ) : (
        <ControlButton
          label="End Session"
          tone="danger"
          onClick={() => setConfirmingEnd(true)}
        />
      )}
    </div>
  );
}
