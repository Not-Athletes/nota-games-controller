import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game State — Not Athletes Games",
  description: "Read-only placeholder dashboard for NOTA Games player, pair, and team structure.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
