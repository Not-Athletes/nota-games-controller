"use client";

import { NotaAppNav } from "@/components/NotaAppNav";
import { SessionPlayersTable } from "@/components/roster/SessionPlayersTable";
import { SessionQrCode } from "@/components/SessionQrCode";

export function PlayersPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex justify-center">
        <NotaAppNav />
      </header>
      <SessionQrCode />
      <SessionPlayersTable />
    </div>
  );
}
