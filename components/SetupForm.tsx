"use client";

import { useState } from "react";
import { setupSchema, type SetupSchema } from "@/lib/validation";
import type { SetupInput } from "@/types/session";

type SetupFormProps = {
  initialValues: SetupInput;
  onStart: (config: SetupInput) => void;
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

export function SetupForm({ initialValues, onStart }: SetupFormProps) {
  const [formValues, setFormValues] = useState<SetupInput>(initialValues);
  const [errors, setErrors] = useState<ErrorMap>({});

  const handleChange = (name: keyof SetupInput, value: string) => {
    setFormValues((prev) => {
      if (name === "spotifyPlaylistUri") {
        return { ...prev, [name]: value };
      }

      return {
        ...prev,
        [name]: Number(value),
      } as SetupInput;
    });
  };

  const handleSpotifyEnabledChange = (enabled: boolean) => {
    setFormValues((prev) => ({ ...prev, spotifyEnabled: enabled }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = setupSchema.safeParse(formValues);

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="Work Time"
          description="Seconds of work in each interval."
          name="workTime"
          value={formValues.workTime}
          onChange={handleChange}
          error={errors.workTime}
        />
        <Field
          label="Rest Between Rounds"
          description="Seconds of recovery between rounds at the same station."
          name="restTime"
          value={formValues.restTime}
          onChange={handleChange}
          error={errors.restTime}
        />
        <Field
          label="Rest Between Stations"
          description="Seconds of recovery while rotating to the next station."
          name="restBetweenStationsTime"
          value={formValues.restBetweenStationsTime}
          onChange={handleChange}
          error={errors.restBetweenStationsTime}
        />
        <Field
          label="Rounds Per Station"
          description="Work rounds completed before rotating."
          name="roundsPerStation"
          value={formValues.roundsPerStation}
          onChange={handleChange}
          error={errors.roundsPerStation}
        />
        <Field
          label="Number of Stations"
          description="Stations to rotate through in one full pass."
          name="stations"
          value={formValues.stations}
          onChange={handleChange}
          error={errors.stations}
        />
        <Field
          label="Full Session Passes"
          description="Times to repeat all stations & rounds end to end."
          name="fullSessionPasses"
          value={formValues.fullSessionPasses}
          onChange={handleChange}
          error={errors.fullSessionPasses}
        />
        <Field
          label="Max Song Play Time"
          description="Seconds before a track auto-advances to the next."
          name="maxTrackPlaySeconds"
          value={formValues.maxTrackPlaySeconds}
          onChange={handleChange}
          error={errors.maxTrackPlaySeconds}
        />
        <div className="flex min-h-36 flex-col rounded-sm bg-zinc-50 p-5 sm:col-span-2 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
              Spotify Music
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={formValues.spotifyEnabled}
                onClick={() => handleSpotifyEnabledChange(!formValues.spotifyEnabled)}
                className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                  formValues.spotifyEnabled ? "bg-[#1DB954]" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition ${
                    formValues.spotifyEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-zinc-800">
                {formValues.spotifyEnabled ? "On" : "Off"}
              </span>
            </div>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            {formValues.spotifyEnabled
              ? "Playlist shuffles during work; volume drops on rest and cues."
              : "No music. Timers, air horn, rest cues, and buzzers still run."}
          </p>
          <label className="mt-4 flex flex-col gap-2">
            <span
              className={`text-xs font-semibold uppercase tracking-[0.1em] ${
                formValues.spotifyEnabled ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              Playlist
            </span>
            <input
              name="spotifyPlaylistUri"
              type="text"
              value={formValues.spotifyPlaylistUri ?? ""}
              disabled={!formValues.spotifyEnabled}
              placeholder="https://open.spotify.com/playlist/…"
              onChange={(event) => handleChange("spotifyPlaylistUri", event.target.value)}
              className={`rounded-sm border px-4 py-3 outline-none ring-0 transition ${
                formValues.spotifyEnabled
                  ? "border-zinc-300 bg-white text-zinc-900 focus:border-zinc-500"
                  : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
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
        className="rounded-sm bg-[#1DB954] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#18a449]"
      >
        Start Session
      </button>
    </form>
  );
}
