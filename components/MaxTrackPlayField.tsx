"use client";

type MaxTrackPlayFieldProps = {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
};

export function MaxTrackPlayField({
  value,
  onChange,
  error,
  disabled = false,
}: MaxTrackPlayFieldProps) {
  return (
    <label
      className={`flex min-h-36 flex-col rounded-sm p-5 sm:col-span-1 ${
        disabled ? "bg-zinc-100/80" : "bg-zinc-50"
      }`}
    >
      <span
        className={`text-xs font-semibold uppercase tracking-[0.1em] ${
          disabled ? "text-zinc-400" : "text-zinc-500"
        }`}
      >
        Max Song Play Time
      </span>
      <span
        className={`mt-1 text-xs leading-relaxed ${disabled ? "text-zinc-400" : "text-zinc-500"}`}
      >
        Seconds before a track auto-advances to the next.
      </span>
      <input
        name="maxTrackPlaySeconds"
        type="number"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`mt-auto rounded-sm border px-4 py-3 outline-none ring-0 transition ${
          disabled
            ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
            : "border-zinc-300 bg-white text-zinc-900 focus:border-zinc-500"
        }`}
      />
      {error ? <span className="mt-2 text-xs text-red-400">{error}</span> : null}
    </label>
  );
}
