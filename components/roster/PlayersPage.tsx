"use client";

import { NotaAppNav } from "@/components/NotaAppNav";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import { SessionJoinStatus } from "@/components/SessionJoinStatus";
import { SessionPlayersTable } from "@/components/roster/SessionPlayersTable";
import { SessionIdDisplay } from "@/components/SessionIdDisplay";

export function PlayersPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex justify-center">
        <NotaAppNav />
      </header>
      <SessionIdDisplay />
      <SessionJoinStatus />
      <PresenceIndicator />
      <SessionPlayersTable />
    </div>
  );
}
