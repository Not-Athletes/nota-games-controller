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
}) {
  return (
    <label className={`flex min-h-36 flex-col rounded-sm bg-zinc-50 p-5 ${className ?? ""}`}>
      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
        {label}
      </span>
      <span className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</span>
      <input
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-auto rounded-sm border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none ring-0 transition focus:border-zinc-500"
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
        <Field
          label="Spotify Playlist"
          description="Paste a playlist link (open.spotify.com/playlist/…) or URI (spotify:playlist:…) to shuffle during the session. Leave blank to skip Spotify."
          name="spotifyPlaylistUri"
          type="text"
          value={formValues.spotifyPlaylistUri ?? ""}
          onChange={handleChange}
          error={errors.spotifyPlaylistUri}
          placeholder="https://open.spotify.com/playlist/…"
          className="sm:col-span-2 lg:col-span-3"
        />
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
