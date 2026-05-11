"use client";

import confetti from "canvas-confetti";
import Link from "next/link";
import { useMemo, useState } from "react";

type PrizeConfig = {
  id: string;
  name: string;
};

type RaffleConfig = {
  prizes: PrizeConfig[];
  maxSpins: number;
};

type SpinRecord = {
  id: string;
  isWinner: boolean;
  prizeId?: string;
  prizeName?: string;
  wonAt: string;
};

/** Prize wheel segments — theme primary + chart palette */
const WHEEL_SEGMENT_FILLS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
];

const DEFAULT_RAFFLE_CONFIG: RaffleConfig = {
  prizes: [],
  maxSpins: 20,
};

function weightedPick(
  prizes: PrizeConfig[],
  weightsByPrizeId: Map<string, number>
): PrizeConfig | null {
  const weightedPrizes = prizes
    .map((prize) => ({
      prize,
      weight: weightsByPrizeId.get(prize.id) ?? 0,
    }))
    .filter((item) => item.weight > 0);

  const totalWeight = weightedPrizes.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return null;

  let cursor = Math.random() * totalWeight;
  for (const item of weightedPrizes) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item.prize;
    }
  }

  return weightedPrizes[weightedPrizes.length - 1]?.prize ?? null;
}

function safeNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cloneDefaultConfig(): RaffleConfig {
  return {
    ...DEFAULT_RAFFLE_CONFIG,
    prizes: DEFAULT_RAFFLE_CONFIG.prizes.map((prize) => ({ ...prize })),
  };
}

export default function RafflePage() {
  const [config, setConfig] = useState<RaffleConfig>(() => cloneDefaultConfig());
  const [spins, setSpins] = useState<SpinRecord[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [lastSpinResult, setLastSpinResult] = useState<SpinRecord | null>(null);

  const winsByPrize = useMemo(() => {
    const map = new Map<string, number>();
    for (const spin of spins) {
      if (!spin.isWinner || !spin.prizeId) continue;
      map.set(spin.prizeId, (map.get(spin.prizeId) ?? 0) + 1);
    }
    return map;
  }, [spins]);

  const prizeStats = useMemo(
    () =>
      config.prizes.map((prize) => {
        const wonCount = winsByPrize.get(prize.id) ?? 0;
        const remaining = wonCount > 0 ? 0 : 1;

        return {
          ...prize,
          wonCount,
          remaining,
        };
      }),
    [config.prizes, winsByPrize]
  );

  const totalRemainingPrizes = useMemo(
    () => prizeStats.reduce((sum, prize) => sum + prize.remaining, 0),
    [prizeStats]
  );

  const prizeCount = config.prizes.length;

  const totalWinnersSoFar = useMemo(
    () => spins.filter((spin) => spin.isWinner).length,
    [spins]
  );
  const spinsUsed = spins.length;
  const winnersLimitReached = prizeCount > 0 && totalWinnersSoFar >= prizeCount;
  const maxSpinsReached = spinsUsed >= config.maxSpins;
  const allPrizesGone = totalRemainingPrizes <= 0;
  const canSpin = !isSpinning && !winnersLimitReached && !maxSpinsReached && !allPrizesGone;

  /** Hub count: once the draw is closed by limits, show 0 even if some prizes were never hit */
  const remainingDisplayCount =
    winnersLimitReached || maxSpinsReached ? 0 : totalRemainingPrizes;

  const wheelPrizes = useMemo(() => {
    const available = prizeStats.filter((prize) => prize.remaining > 0);
    return available.length > 0 ? available : prizeStats;
  }, [prizeStats]);

  const wheelStyle = useMemo(() => {
    if (wheelPrizes.length === 0) {
      return { background: "hsl(var(--muted))" };
    }

    const segmentSize = 360 / wheelPrizes.length;
    const stops = wheelPrizes.map((prize, index) => {
      const start = index * segmentSize;
      const end = (index + 1) * segmentSize;
      const color = WHEEL_SEGMENT_FILLS[index % WHEEL_SEGMENT_FILLS.length];
      return `${color} ${start}deg ${end}deg`;
    });

    return {
      background: `conic-gradient(${stops.join(", ")})`,
    };
  }, [wheelPrizes]);

  const spinWheel = () => {
    if (!canSpin || wheelPrizes.length === 0) return;

    const weights = new Map<string, number>();
    for (const prize of prizeStats) {
      weights.set(prize.id, prize.remaining);
    }

    const winnersRemaining = Math.max(
      0,
      Math.min(prizeCount - totalWinnersSoFar, totalRemainingPrizes)
    );
    const spinsRemaining = Math.max(1, config.maxSpins - spinsUsed);
    const winProbability = Math.min(1, winnersRemaining / spinsRemaining);
    const isWinningSpin = Math.random() < winProbability;

    const selectedPrize = isWinningSpin ? weightedPick(prizeStats, weights) : null;
    const selectedIndex = selectedPrize
      ? wheelPrizes.findIndex((prize) => prize.id === selectedPrize.id)
      : Math.floor(Math.random() * wheelPrizes.length);
    if (selectedIndex < 0) return;

    setIsSpinning(true);
    const segmentAngle = 360 / wheelPrizes.length;
    const segmentCenter = selectedIndex * segmentAngle + segmentAngle / 2;
    const extraTurns = 7 + Math.floor(Math.random() * 4);
    const finalRotation = wheelRotation + extraTurns * 360 + (270 - segmentCenter);
    setWheelRotation(finalRotation);

    window.setTimeout(() => {
      const spinResult: SpinRecord = {
        id: crypto.randomUUID(),
        isWinner: Boolean(selectedPrize),
        prizeId: selectedPrize?.id,
        prizeName: selectedPrize?.name,
        wonAt: new Date().toISOString(),
      };

      setSpins((prev) => [...prev, spinResult]);
      setLastSpinResult(spinResult);
      setIsSpinning(false);

      if (spinResult.isWinner) {
        confetti({
          particleCount: 80,
          spread: 70,
          startVelocity: 45,
          origin: { y: 0.7 },
        });
        confetti({
          particleCount: 50,
          spread: 110,
          startVelocity: 35,
          scalar: 0.8,
          origin: { y: 0.7 },
        });
      }
    }, 5000);
  };

  const updatePrize = (id: string, patch: Partial<PrizeConfig>) => {
    setConfig((prev) => ({
      ...prev,
      prizes: prev.prizes.map((prize) => (prize.id === id ? { ...prize, ...patch } : prize)),
    }));
  };

  const addPrize = () => {
    setConfig((prev) => {
      const nextIndex = prev.prizes.length + 1;
      return {
        ...prev,
        prizes: [
          ...prev.prizes,
          {
            id: `p-${Date.now()}`,
            name: `Prize ${nextIndex}`,
          },
        ],
      };
    });
  };

  const removePrize = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      prizes: prev.prizes.filter((prize) => prize.id !== id),
    }));
  };

  const resetEvent = () => {
    setSpins([]);
    setLastSpinResult(null);
    setWheelRotation(0);
    setIsSpinning(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900 md:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-2 text-center">
          <Link
            href="/"
            className="inline-block font-brand text-lg font-bold tracking-[0.06em] text-zinc-600 transition hover:text-zinc-900 md:text-xl"
          >
            Not Athletes Games
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-sm bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col items-center">
              <div className="relative mx-auto mt-2 px-6 py-10 md:px-10 md:py-12">
                <div className="absolute -top-7 left-1/2 z-20 h-0 w-0 -translate-x-1/2 border-x-[14px] border-t-[24px] border-b-0 border-x-transparent border-t-primary" />
                <div className="relative h-[320px] w-[320px] md:h-[380px] md:w-[380px]">
                  <div
                    className="absolute inset-0 rounded-full border-[10px] border-primary shadow-xl transition-transform duration-[5000ms] [transition-timing-function:cubic-bezier(0.12,0.77,0,1)]"
                    style={{
                      ...wheelStyle,
                      transform: `rotate(${wheelRotation}deg)`,
                    }}
                  />
                  <button
                    type="button"
                    onClick={spinWheel}
                    disabled={!canSpin}
                    className="absolute inset-[26%] z-10 flex flex-col items-center justify-center rounded-full border-4 border-primary bg-background p-3 text-center shadow-inner transition-transform duration-200 ease-out hover:shadow-md enabled:hover:scale-[1.06] enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  >
                    <span className="font-display text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
                      {isSpinning ? "Spinning" : "Spin"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-4 grid w-full gap-2 text-center text-sm text-zinc-600 sm:grid-cols-3">
                <p>
                  Remaining:{" "}
                  <span className="font-semibold text-zinc-900">{remainingDisplayCount}</span>
                </p>
                <p>
                  Winners:{" "}
                  <span className="font-semibold text-zinc-900">
                    {totalWinnersSoFar}/{prizeCount}
                  </span>
                </p>
                <p>
                  Spins:{" "}
                  <span className="font-semibold text-zinc-900">
                    {spinsUsed}/{config.maxSpins}
                  </span>
                </p>
              </div>

              {lastSpinResult ? (
                lastSpinResult.isWinner ? (
                  <div className="mt-5 w-full rounded-sm border border-emerald-200 bg-emerald-50 p-4 text-center">
                    <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                      Latest result
                    </p>
                    <p className="mt-1 font-display text-2xl text-emerald-900">
                      {lastSpinResult.prizeName}
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 w-full rounded-sm border border-amber-200 bg-amber-50 p-4 text-center">
                    <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase">
                      Latest result
                    </p>
                    <p className="mt-1 font-display text-2xl text-amber-900">Better luck next time</p>
                  </div>
                )
              ) : (
                <div className="mt-5 w-full rounded-sm border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-600">
                  No winners yet. Spin to draw the first prize.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-sm bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl text-zinc-900">Admin controls</h2>
              <button
                type="button"
                onClick={resetEvent}
                className="rounded-sm border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                Reset results
              </button>
            </div>

            <label className="mt-3 flex flex-col gap-3 text-sm text-zinc-700">
              Maximum spins
              <input
                type="number"
                min={1}
                value={config.maxSpins}
                onChange={(event) =>
                  setConfig((prev) => ({
                    ...prev,
                    maxSpins: safeNumber(event.target.value, prev.maxSpins),
                  }))
                }
                className="w-full max-w-xs rounded-sm border border-zinc-300 px-3 py-2"
              />
            </label>

            <p className="mt-3 text-xs text-zinc-500">
              One winner per prize — the draw finishes when every prize has been won or you hit max spins.
            </p>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-800">Prize pool ({config.prizes.length})</p>
                <button
                  type="button"
                  onClick={addPrize}
                  className="rounded-sm bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700"
                >
                  Add prize
                </button>
              </div>

              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {config.prizes.map((prize) => {
                  const wonCount = winsByPrize.get(prize.id) ?? 0;
                  const isAwarded = wonCount > 0;
                  return (
                    <div
                      key={prize.id}
                      className={`grid grid-cols-[1fr_auto] items-center gap-2 rounded-sm border border-zinc-200 p-3 ${isAwarded ? "bg-zinc-50" : ""}`}
                    >
                      <input
                        type="text"
                        value={prize.name}
                        disabled={isAwarded}
                        onChange={(event) => updatePrize(prize.id, { name: event.target.value })}
                        className="rounded-sm border border-zinc-300 px-2 py-2 text-sm disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-600"
                      />
                      <button
                        type="button"
                        disabled={isAwarded}
                        onClick={() => removePrize(prize.id)}
                        className="rounded-sm bg-zinc-900 px-2 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:hover:bg-zinc-400"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
