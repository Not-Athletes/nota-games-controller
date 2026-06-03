import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results — Not Athletes Games",
  description: "Read-only results for NOTA Games player, pair, and team scores.",
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
