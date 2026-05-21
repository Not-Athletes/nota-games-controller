"use client";

type SessionControlsProps = {
  onEndSession: () => void;
  onResumeNextPass?: () => void;
  showResumeNextPass?: boolean;
};

function ControlButton({
  label,
  onClick,
  tone = "default",
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger" | "primary";
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
}: SessionControlsProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {showResumeNextPass && onResumeNextPass ? (
        <ControlButton
          label="Start Next Pass"
          tone="primary"
          onClick={onResumeNextPass}
        />
      ) : null}
      <ControlButton label="End Session" tone="danger" onClick={onEndSession} />
    </div>
  );
}
