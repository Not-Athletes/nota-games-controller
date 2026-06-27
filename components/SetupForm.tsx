"use client";

import { useState } from "react";
import { Copy, Plus, X } from "lucide-react";
import { createDefaultPass } from "@/lib/session/config";
import { setupSchema, type SetupSchema } from "@/lib/validation";
import type { SpotifyStatus } from "@/lib/spotify";
import type { PassConfig, SetupInput } from "@/types/session";
import { MaxTrackPlayField } from "@/components/MaxTrackPlayField";
import {
  PassConfigFields,
  passErrorsFromZodIssues,
  type PassFieldErrors,
} from "@/components/PassConfigFields";
import { PassTabs } from "@/components/PassTabs";
import { SpotifySettings } from "@/components/SpotifySettings";

type SetupFormProps = {
  values: SetupInput;
  onValuesChange: (values: SetupInput) => void;
  onContinue: (config: SetupInput) => void;
  spotifyStatus: SpotifyStatus;
  onConnectSpotify: () => void;
  onDisconnectSpotify: () => void;
  continueDisabled?: boolean;
  continueDisabledReason?: string;
  fieldsDisabled?: boolean;
  fieldsDisabledReason?: string;
};

type GlobalErrorMap = Partial<
  Pick<Record<keyof SetupSchema, string>, "maxTrackPlaySeconds" | "spotifyPlaylistUri">
>;

function reorderPasses(passes: PassConfig[], fromIndex: number, toIndex: number): PassConfig[] {
  const next = [...passes];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function SetupForm({
  values,
  onValuesChange,
  onContinue,
  spotifyStatus,
  onConnectSpotify,
  onDisconnectSpotify,
  continueDisabled = false,
  continueDisabledReason,
  fieldsDisabled = false,
  fieldsDisabledReason,
}: SetupFormProps) {
  const [activePassIndex, setActivePassIndex] = useState(0);
  const [passErrors, setPassErrors] = useState<PassFieldErrors>({});
  const [globalErrors, setGlobalErrors] = useState<GlobalErrorMap>({});

  const multiPass = values.passes.length > 1;
  const activePass = values.passes[activePassIndex] ?? values.passes[0];

  const updatePass = (index: number, pass: PassConfig) => {
    const passes = [...values.passes];
    passes[index] = pass;
    onValuesChange({ ...values, passes });
  };

  const updateGlobals = (
    globals: Pick<SetupInput, "maxTrackPlaySeconds" | "spotifyEnabled" | "spotifyPlaylistUri">
  ) => {
    onValuesChange({ ...values, ...globals });
  };

  const updateSpotify = (
    spotify: Pick<SetupInput, "spotifyEnabled" | "spotifyPlaylistUri">
  ) => {
    onValuesChange({ ...values, ...spotify });
  };

  const handleAddPass = () => {
    if (fieldsDisabled) return;
    const passes = [...values.passes, createDefaultPass()];
    onValuesChange({ ...values, passes });
    setActivePassIndex(passes.length - 1);
  };

  const handleDuplicatePass = () => {
    if (fieldsDisabled) return;
    const passes = [...values.passes, { ...activePass }];
    onValuesChange({ ...values, passes });
    setActivePassIndex(passes.length - 1);
  };

  const handleRemovePass = () => {
    if (fieldsDisabled || values.passes.length <= 1) return;
    const passes = values.passes.filter((_, index) => index !== activePassIndex);
    onValuesChange({ ...values, passes });
    setActivePassIndex(Math.min(activePassIndex, passes.length - 1));
  };

  const handleReorderPasses = (fromIndex: number, toIndex: number) => {
    if (fieldsDisabled) return;
    const passes = reorderPasses(values.passes, fromIndex, toIndex);
    onValuesChange({ ...values, passes });

    if (activePassIndex === fromIndex) {
      setActivePassIndex(toIndex);
    } else if (fromIndex < activePassIndex && toIndex >= activePassIndex) {
      setActivePassIndex(activePassIndex - 1);
    } else if (fromIndex > activePassIndex && toIndex <= activePassIndex) {
      setActivePassIndex(activePassIndex + 1);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = setupSchema.safeParse(values);

    if (!parsed.success) {
      const nextGlobalErrors: GlobalErrorMap = {};
      let nextPassErrors: PassFieldErrors = {};

      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "passes" && typeof issue.path[1] === "number") {
          if (issue.path[1] === activePassIndex) {
            nextPassErrors = passErrorsFromZodIssues(parsed.error.issues, activePassIndex);
          }
          continue;
        }

        const key = issue.path[0] as keyof GlobalErrorMap;
        if (key === "maxTrackPlaySeconds" || key === "spotifyPlaylistUri") {
          nextGlobalErrors[key] = issue.message;
        }
      }

      if (parsed.error.issues.some((issue) => issue.path[0] === "passes")) {
        const firstInvalidPass = parsed.error.issues.find(
          (issue) => issue.path[0] === "passes" && typeof issue.path[1] === "number"
        )?.path[1];

        if (typeof firstInvalidPass === "number" && firstInvalidPass !== activePassIndex) {
          setActivePassIndex(firstInvalidPass);
          nextPassErrors = passErrorsFromZodIssues(parsed.error.issues, firstInvalidPass);
        }
      }

      setGlobalErrors(nextGlobalErrors);
      setPassErrors(nextPassErrors);
      return;
    }

    setGlobalErrors({});
    setPassErrors({});
    onContinue(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      {fieldsDisabled && fieldsDisabledReason ? (
        <p className="rounded-sm bg-zinc-100 px-4 py-3 text-sm text-zinc-600">{fieldsDisabledReason}</p>
      ) : null}

      {multiPass ? (
        <div className="flex flex-col gap-4">
          <PassTabs
            passCount={values.passes.length}
            activeIndex={activePassIndex}
            onSelect={setActivePassIndex}
            onReorder={handleReorderPasses}
            onAddPass={handleAddPass}
            disabled={fieldsDisabled}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDuplicatePass}
              disabled={fieldsDisabled}
              className="inline-flex items-center gap-1.5 rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Copy className="h-4 w-4" strokeWidth={2} />
              Duplicate pass
            </button>
            <button
              type="button"
              onClick={handleRemovePass}
              disabled={fieldsDisabled}
              className="inline-flex items-center gap-1.5 rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" strokeWidth={2} />
              Remove pass
            </button>
          </div>

          <PassConfigFields
            pass={activePass}
            onChange={(pass) => updatePass(activePassIndex, pass)}
            errors={passErrors}
            disabled={fieldsDisabled}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center border-b border-zinc-200 pb-1">
            <button
              type="button"
              onClick={handleAddPass}
              disabled={fieldsDisabled}
              className="inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add another pass
            </button>
          </div>
          <PassConfigFields
            pass={activePass}
            onChange={(pass) => updatePass(0, pass)}
            errors={passErrors}
            disabled={fieldsDisabled}
          />
        </div>
      )}

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
          Session settings
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SpotifySettings
            status={spotifyStatus}
            onConnect={onConnectSpotify}
            onDisconnect={onDisconnectSpotify}
            values={values}
            onChange={updateSpotify}
            errors={{ spotifyPlaylistUri: globalErrors.spotifyPlaylistUri }}
            disabled={fieldsDisabled}
          />
          <MaxTrackPlayField
            value={values.maxTrackPlaySeconds}
            onChange={(maxTrackPlaySeconds) => updateGlobals({ ...values, maxTrackPlaySeconds })}
            error={globalErrors.maxTrackPlaySeconds}
            disabled={fieldsDisabled}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={continueDisabled}
        className="rounded-sm bg-[#1DB954] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#18a449] disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        Continue to review
      </button>
      {continueDisabled && continueDisabledReason ? (
        <p className="text-sm text-zinc-500">{continueDisabledReason}</p>
      ) : null}
    </form>
  );
}
