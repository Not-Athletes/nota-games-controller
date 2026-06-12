import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Players — Not Athletes Games",
  description: "Configure player name tags and teams for NOTA Games.",
};

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
