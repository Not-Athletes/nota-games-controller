"use client";

import type { ZodIssue } from "zod";
import type { PassConfig } from "@/types/session";

type PassFieldName = keyof PassConfig;

type PassConfigFieldsProps = {
  pass: PassConfig;
  onChange: (pass: PassConfig) => void;
  errors?: Partial<Record<PassFieldName, string>>;
  disabled?: boolean;
};

function Field({
  label,
  description,
  name,
  value,
  onChange,
  error,
  disabled = false,
}: {
  label: string;
  description: string;
  name: PassFieldName;
  value: number;
  onChange: (name: PassFieldName, value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex min-h-36 flex-col rounded-sm p-5 ${
        disabled ? "bg-zinc-100/80" : "bg-zinc-50"
      }`}
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
        type="number"
        value={value}
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

export function PassConfigFields({
  pass,
  onChange,
  errors = {},
  disabled = false,
}: PassConfigFieldsProps) {
  const handleChange = (name: PassFieldName, value: string) => {
    onChange({ ...pass, [name]: Number(value) });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field
        label="Work Time"
        description="Seconds of work in each interval."
        name="workTime"
        value={pass.workTime}
        onChange={handleChange}
        error={errors.workTime}
        disabled={disabled}
      />
      <Field
        label="Rest Between Rounds"
        description="Seconds of recovery between rounds at the same station."
        name="restTime"
        value={pass.restTime}
        onChange={handleChange}
        error={errors.restTime}
        disabled={disabled}
      />
      <Field
        label="Rest Between Stations"
        description="Seconds of recovery while rotating to the next station."
        name="restBetweenStationsTime"
        value={pass.restBetweenStationsTime}
        onChange={handleChange}
        error={errors.restBetweenStationsTime}
        disabled={disabled}
      />
      <Field
        label="Rounds Per Station"
        description="Work rounds completed before rotating."
        name="roundsPerStation"
        value={pass.roundsPerStation}
        onChange={handleChange}
        error={errors.roundsPerStation}
        disabled={disabled}
      />
      <Field
        label="Number of Stations"
        description="Stations to rotate through in one full pass."
        name="stations"
        value={pass.stations}
        onChange={handleChange}
        error={errors.stations}
        disabled={disabled}
      />
    </div>
  );
}

export type PassFieldErrors = Partial<Record<PassFieldName, string>>;

export function passErrorsFromZodIssues(issues: ZodIssue[], passIndex: number): PassFieldErrors {
  const errors: PassFieldErrors = {};
  for (const issue of issues) {
    if (issue.path[0] !== "passes" || issue.path[1] !== passIndex) continue;
    const field = issue.path[2] as PassFieldName | undefined;
    if (field) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
