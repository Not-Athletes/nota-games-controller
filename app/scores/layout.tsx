import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scores — Not Athletes Games",
  description: "Read-only scores for NOTA Games players and teams.",
};

export default function ScoresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
