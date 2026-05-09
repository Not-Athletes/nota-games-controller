declare module "canvas-confetti" {
  export type ConfettiOptions = {
    particleCount?: number;
    spread?: number;
    startVelocity?: number;
    scalar?: number;
    origin?: {
      x?: number;
      y?: number;
    };
  };

  export default function confetti(
    options?: ConfettiOptions
  ): Promise<undefined> | null;
}
