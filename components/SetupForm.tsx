"use client";

import { useState } from "react";
import { setupSchema, type SetupSchema } from "@/lib/validation";
import type { SetupInput } from "@/types/session";

type SetupFormProps = {
  values: SetupInput;
  onValuesChange: (values: SetupInput) => void;
  onStart: (config: SetupInput) => void;
  startDisabled?: boolean;
  startDisabledReason?: string;
  fieldsDisabled?: boolean;
  fieldsDisabledReason?: string;
};

type ErrorMap = Partial<Record<keyof SetupSchema, string>>;

function Field({
  label,
  description,
  name,
  type = "number",
  value,
  onChange,
  error,
  placeholder,
  className,
  disabled = false,
}: {
  label: string;
  description: string;
  name: keyof SetupInput;
  type?: "number" | "text";
  value: string | number;
  onChange: (name: keyof SetupInput, value: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex min-h-36 flex-col rounded-sm p-5 ${
        disabled ? "bg-zinc-100/80" : "bg-zinc-50"
      } ${className ?? ""}`}
    >
      <span
        className={`text-xs font-semibold uppercase tracking-[0.1em] ${
          disabled ? "text-zinc-400" : "text-zinc-500"
        }`}
      >
        {label}
      </span>
      <span
        className={`mt-1 text-xs leading-relaxed ${disabled ? "text-zinc-400" : "text-zinc-500"}`}
      >
        {description}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(name, event.target.value)}
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

export function SetupForm({
  values,
  onValuesChange,
  onStart,
  startDisabled = false,
  startDisabledReason,
  fieldsDisabled = false,
  fieldsDisabledReason,
}: SetupFormProps) {
  const [errors, setErrors] = useState<ErrorMap>({});

  const handleChange = (name: keyof SetupInput, value: string) => {
    if (fieldsDisabled) return;

    const next =
      name === "spotifyPlaylistUri"
        ? { ...values, [name]: value }
        : ({ ...values, [name]: Number(value) } as SetupInput);
    onValuesChange(next);
  };

  const handleSpotifyEnabledChange = (enabled: boolean) => {
    if (fieldsDisabled) return;
    onValuesChange({ ...values, spotifyEnabled: enabled });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = setupSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: ErrorMap = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof SetupSchema;
        nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onStart(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      {fieldsDisabled && fieldsDisabledReason ? (
        <p className="rounded-sm bg-zinc-100 px-4 py-3 text-sm text-zinc-600">{fieldsDisabledReason}</p>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="Work Time"
          description="Seconds of work in each interval."
          name="workTime"
          value={values.workTime}
          onChange={handleChange}
          error={errors.workTime}
          disabled={fieldsDisabled}
        />
        <Field
          label="Rest Between Rounds"
          description="Seconds of recovery between rounds at the same station."
          name="restTime"
          value={values.restTime}
          onChange={handleChange}
          error={errors.restTime}
          disabled={fieldsDisabled}
        />
        <Field
          label="Rest Between Stations"
          description="Seconds of recovery while rotating to the next station."
          name="restBetweenStationsTime"
          value={values.restBetweenStationsTime}
          onChange={handleChange}
          error={errors.restBetweenStationsTime}
          disabled={fieldsDisabled}
        />
        <Field
          label="Rounds Per Station"
          description="Work rounds completed before rotating."
          name="roundsPerStation"
          value={values.roundsPerStation}
          onChange={handleChange}
          error={errors.roundsPerStation}
          disabled={fieldsDisabled}
        />
        <Field
          label="Number of Stations"
          description="Stations to rotate through in one full pass."
          name="stations"
          value={values.stations}
          onChange={handleChange}
          error={errors.stations}
          disabled={fieldsDisabled}
        />
        <Field
          label="Full Session Passes"
          description="Times to repeat all stations & rounds end to end."
          name="fullSessionPasses"
          value={values.fullSessionPasses}
          onChange={handleChange}
          error={errors.fullSessionPasses}
          disabled={fieldsDisabled}
        />
        <Field
          label="Max Song Play Time"
          description="Seconds before a track auto-advances to the next."
          name="maxTrackPlaySeconds"
          value={values.maxTrackPlaySeconds}
          onChange={handleChange}
          error={errors.maxTrackPlaySeconds}
          disabled={fieldsDisabled}
        />
        <div
          className={`flex min-h-36 flex-col rounded-sm p-5 sm:col-span-2 lg:col-span-3 ${
            fieldsDisabled ? "bg-zinc-100/80" : "bg-zinc-50"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={`text-xs font-semibold uppercase tracking-[0.1em] ${
                fieldsDisabled ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              Spotify Music
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={values.spotifyEnabled}
                disabled={fieldsDisabled}
                onClick={() => handleSpotifyEnabledChange(!values.spotifyEnabled)}
                className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                  fieldsDisabled
                    ? "cursor-not-allowed bg-zinc-200"
                    : values.spotifyEnabled
                      ? "bg-[#1DB954]"
                      : "bg-zinc-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition ${
                    values.spotifyEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${fieldsDisabled ? "text-zinc-400" : "text-zinc-800"}`}
              >
                {values.spotifyEnabled ? "On" : "Off"}
              </span>
            </div>
          </div>
          <p
            className={`mt-1 text-xs leading-relaxed ${
              fieldsDisabled ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            {values.spotifyEnabled
              ? "Playlist shuffles during work; volume drops on rest."
              : "No music. Session timers run silently."}
          </p>
          <label className="mt-4 flex flex-col gap-2">
            <span
              className={`text-xs font-semibold uppercase tracking-[0.1em] ${
                fieldsDisabled || !values.spotifyEnabled ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              Playlist
            </span>
            <input
              name="spotifyPlaylistUri"
              type="text"
              value={values.spotifyPlaylistUri ?? ""}
              disabled={fieldsDisabled || !values.spotifyEnabled}
              placeholder="https://open.spotify.com/playlist/…"
              onChange={(event) => handleChange("spotifyPlaylistUri", event.target.value)}
              className={`rounded-sm border px-4 py-3 outline-none ring-0 transition ${
                fieldsDisabled || !values.spotifyEnabled
                  ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                  : "border-zinc-300 bg-white text-zinc-900 focus:border-zinc-500"
              }`}
            />
            {errors.spotifyPlaylistUri ? (
              <span className="text-xs text-red-400">{errors.spotifyPlaylistUri}</span>
            ) : null}
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={startDisabled}
        className="rounded-sm bg-[#1DB954] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#18a449] disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        Start the session
      </button>
      {startDisabled && startDisabledReason ? (
        <p className="text-sm text-zinc-500">{startDisabledReason}</p>
      ) : null}
    </form>
  );
}
