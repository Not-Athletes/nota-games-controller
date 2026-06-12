"use client";

import { NotaAppNav } from "@/components/NotaAppNav";
import { RosterSetup } from "@/components/roster/RosterSetup";

export function PlayersPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex justify-center">
        <NotaAppNav />
      </header>
      <RosterSetup />
    </div>
  );
}
