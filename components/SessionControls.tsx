"use client";

type SessionControlsProps = {
  canPause: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onRestartPhase: () => void;
  onEndSession: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  disableVolumeButtons?: boolean;
};

function ControlButton({
  label,
  onClick,
  tone = "default",
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-h-14 rounded-sm px-4 py-3 text-sm font-semibold transition ${
        tone === "danger"
          ? "bg-red-500 text-white hover:bg-red-400"
          : "bg-zinc-900 text-white hover:bg-zinc-800"
      } disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500`}
    >
      {label}
    </button>
  );
}

export function SessionControls({
  canPause,
  isPaused,
  onPause,
  onResume,
  onSkip,
  onRestartPhase,
  onEndSession,
  onVolumeUp,
  onVolumeDown,
  disableVolumeButtons,
}: SessionControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <ControlButton
        label={isPaused ? "Resume Session" : "Pause Session"}
        onClick={isPaused ? onResume : onPause}
        disabled={!canPause && !isPaused}
      />
      <ControlButton label="Skip To Next Phase" onClick={onSkip} />
      <ControlButton label="Restart Current Phase" onClick={onRestartPhase} />
      <ControlButton label="End Session" tone="danger" onClick={onEndSession} />
      <ControlButton
        label="Music Volume Up"
        onClick={onVolumeUp}
        disabled={disableVolumeButtons}
      />
      <ControlButton
        label="Music Volume Down"
        onClick={onVolumeDown}
        disabled={disableVolumeButtons}
      />
    </div>
  );
}
