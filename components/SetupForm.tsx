"use client";

import { useMemo, useState } from "react";
import { adjustRestTime } from "@/lib/session";
import { setupSchema, type SetupSchema } from "@/lib/validation";
import type { SessionConfig, SetupInput } from "@/types/session";

type SetupFormProps = {
  initialValues: SetupInput;
  onStart: (config: SessionConfig) => void;
};

type ErrorMap = Partial<Record<keyof SetupSchema, string>>;

function Field({
  label,
  name,
  type = "number",
  value,
  onChange,
  error,
}: {
  label: string;
  name: keyof SetupInput;
  type?: "number" | "text";
  value: string | number;
  onChange: (name: keyof SetupInput, value: string) => void;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm text-zinc-600">{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        className="rounded-sm border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none ring-0 transition focus:border-zinc-500"
      />
      {error ? <span className="text-xs text-red-400">{error}</span> : null}
    </label>
  );
}

export function SetupForm({ initialValues, onStart }: SetupFormProps) {
  const [formValues, setFormValues] = useState<SetupInput>(initialValues);
  const [errors, setErrors] = useState<ErrorMap>({});

  const adjustment = useMemo(
    () => adjustRestTime(Number(formValues.restTime), Number(formValues.attendees)),
    [formValues.attendees, formValues.restTime]
  );

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

    const { adjustedRestTime } = adjustRestTime(
      parsed.data.restTime,
      parsed.data.attendees
    );

    onStart({
      ...parsed.data,
      adjustedRestTime,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Attendees"
          name="attendees"
          value={formValues.attendees}
          onChange={handleChange}
          error={errors.attendees}
        />
        <Field
          label="Work Time (seconds)"
          name="workTime"
          value={formValues.workTime}
          onChange={handleChange}
          error={errors.workTime}
        />
        <Field
          label="Rest Time (seconds)"
          name="restTime"
          value={formValues.restTime}
          onChange={handleChange}
          error={errors.restTime}
        />
        <Field
          label="Rounds Per Station"
          name="roundsPerStation"
          value={formValues.roundsPerStation}
          onChange={handleChange}
          error={errors.roundsPerStation}
        />
        <Field
          label="Number of Stations"
          name="stations"
          value={formValues.stations}
          onChange={handleChange}
          error={errors.stations}
        />
        <Field
          label="Spotify Playlist URI or URL"
          name="spotifyPlaylistUri"
          type="text"
          value={formValues.spotifyPlaylistUri ?? ""}
          onChange={handleChange}
          error={errors.spotifyPlaylistUri}
        />
        <Field
          label="Work Volume"
          name="workVolume"
          value={formValues.workVolume}
          onChange={handleChange}
          error={errors.workVolume}
        />
        <Field
          label="Rest Volume"
          name="restVolume"
          value={formValues.restVolume}
          onChange={handleChange}
          error={errors.restVolume}
        />
        <Field
          label="Cue Volume"
          name="cueVolume"
          value={formValues.cueVolume}
          onChange={handleChange}
          error={errors.cueVolume}
        />
      </div>

      <div className="rounded-sm border border-zinc-300 bg-white p-4">
        <p className="text-zinc-700">
          Adjusted rest time:{" "}
          <span className="font-semibold text-zinc-900">
            {adjustment.adjustedRestTime} seconds
          </span>
        </p>
        {adjustment.warning ? (
          <p className="mt-1 text-sm text-amber-300">{adjustment.warning}</p>
        ) : null}
      </div>

      <button
        type="submit"
        className="rounded-sm bg-white px-6 py-4 text-lg font-semibold text-black transition hover:bg-zinc-200"
      >
        Start Session
      </button>
    </form>
  );
}
