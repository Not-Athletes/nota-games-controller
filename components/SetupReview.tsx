"use client";

import {
  estimatePassDurationSeconds,
  estimateSessionDurationSeconds,
  getIntervalsForPass,
  getTotalIntervalsFromPasses,
} from "@/lib/session/config";
import type { SetupInput } from "@/types/session";

type SetupReviewProps = {
  values: SetupInput;
  onBack: () => void;
  onStart: () => void;
  startDisabled?: boolean;
  startDisabledReason?: string;
};

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

function PassSummary({ pass, index }: { pass: SetupInput["passes"][number]; index: number }) {
  return (
    <div className="rounded-sm bg-zinc-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
        Pass {index + 1}
      </p>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-zinc-700 sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Stations</dt>
          <dd className="font-medium text-zinc-900">{pass.stations}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Rounds per station</dt>
          <dd className="font-medium text-zinc-900">{pass.roundsPerStation}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Work time</dt>
          <dd className="font-medium text-zinc-900">{pass.workTime}s</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Rest between rounds</dt>
          <dd className="font-medium text-zinc-900">{pass.restTime}s</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Rest between stations</dt>
          <dd className="font-medium text-zinc-900">{pass.restBetweenStationsTime}s</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Est. duration</dt>
          <dd className="font-medium text-zinc-900">{formatDuration(estimatePassDurationSeconds(pass))}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Intervals</dt>
          <dd className="font-medium text-zinc-900">{getIntervalsForPass(pass)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function SetupReview({
  values,
  onBack,
  onStart,
  startDisabled = false,
  startDisabledReason,
}: SetupReviewProps) {
  const totalIntervals = getTotalIntervalsFromPasses(values.passes);
  const totalDuration = estimateSessionDurationSeconds(values.passes);
  const multiPass = values.passes.length > 1;

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Review session</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Confirm your settings before starting. Use Back to make changes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-sm bg-zinc-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Passes</p>
          <p className="mt-auto font-display text-3xl font-bold text-zinc-900">{values.passes.length}</p>
        </div>
        <div className="rounded-sm bg-zinc-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
            Total intervals
          </p>
          <p className="mt-auto font-display text-3xl font-bold text-zinc-900">{totalIntervals}</p>
        </div>
        <div className="rounded-sm bg-zinc-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
            Est. duration
          </p>
          <p className="mt-auto font-display text-3xl font-bold text-zinc-900">
            {formatDuration(totalDuration)}
          </p>
        </div>
      </div>

      {multiPass ? (
        <div className="flex flex-col gap-4">
          {values.passes.map((pass, index) => (
            <PassSummary key={`review-pass-${index}`} pass={pass} index={index} />
          ))}
        </div>
      ) : (
        <PassSummary pass={values.passes[0]} index={0} />
      )}

      <div className="rounded-sm bg-zinc-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
          Global settings
        </p>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-zinc-700 sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Spotify music</dt>
            <dd className="font-medium text-zinc-900">{values.spotifyEnabled ? "On" : "Off"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Max song play time</dt>
            <dd className="font-medium text-zinc-900">{values.maxTrackPlaySeconds}s</dd>
          </div>
          {values.spotifyEnabled && values.spotifyPlaylistUri ? (
            <div className="sm:col-span-2">
              <dt className="text-zinc-500">Playlist</dt>
              <dd className="truncate font-medium text-zinc-900">{values.spotifyPlaylistUri}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="rounded-sm border border-zinc-300 bg-white px-6 py-4 text-lg font-semibold text-zinc-800 transition hover:bg-zinc-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onStart}
          disabled={startDisabled}
          className="rounded-sm bg-[#1DB954] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#18a449] disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Start the session
        </button>
      </div>
      {startDisabled && startDisabledReason ? (
        <p className="text-sm text-zinc-500">{startDisabledReason}</p>
      ) : null}
    </div>
  );
}
