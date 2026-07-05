"use client";

import { LiveSession } from "@/components/LiveSession";
import { NotaAppNav } from "@/components/NotaAppNav";
import { NotaSignIn } from "@/components/NotaSignIn";
import { SessionPlayersPanel } from "@/components/roster/SessionPlayersPanel";
import { SessionSpotifyPanel } from "@/components/roster/SessionSpotifyPanel";
import { SessionEndFab } from "@/components/SessionEndFab";
import { SetupForm } from "@/components/SetupForm";
import { useSessionController } from "@/contexts/SessionControllerContext";
import { useNotaAuth } from "@/hooks/useNotaAuth";
import { useSessionOrchestration } from "@/hooks/useSessionOrchestration";
import { setupToSessionConfig } from "@/lib/session/config";
import type { SetupInput } from "@/types/session";
import type { ReactNode } from "react";

export function ControllerPage() {
  const {
    setupValues,
    setSetupValues,
    sessionConfig,
    sessionState,
    startSession,
    resumeNextPass,
    workVolume,
    restVolume,
    defaultSetup,
  } = useSessionController();
  const { sessionId, createSession } = useSessionOrchestration();
  const notaAuth = useNotaAuth();

  const persistSetupValues = (config: SetupInput) => {
    setSetupValues(config);
    localStorage.setItem("nota_class_controller_setup", JSON.stringify(config));
  };

  const sessionOpen = Boolean(sessionId);
  const showSidePanels =
    !notaAuth.loading && (!notaAuth.requiresAuth || notaAuth.authenticated);

  const handleStartSession = async (config: SetupInput) => {
    persistSetupValues(config);
    const resolvedConfig = setupToSessionConfig(config, {
      workVolume,
      restVolume,
    });

    if (!sessionId) {
      await createSession(resolvedConfig);
      return;
    }

    await startSession(resolvedConfig);
  };

  let main: ReactNode;

  if (sessionState.phase === "idle") {
    if (notaAuth.loading) {
      main = (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
          <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
            <header className="flex justify-center">
              <NotaAppNav />
            </header>
            <p className="text-center text-sm text-zinc-500">Checking sign-in status…</p>
          </div>
        </div>
      );
    } else if (notaAuth.requiresAuth && !notaAuth.authenticated) {
      main = (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
          <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
            <header className="flex justify-center">
              <NotaAppNav />
            </header>
            <NotaSignIn auth={notaAuth} />
          </div>
        </div>
      );
    } else {
      main = (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <header className="flex justify-center">
              <NotaAppNav />
            </header>

            <SetupForm
              values={setupValues}
              onValuesChange={persistSetupValues}
              fieldsDisabled={sessionOpen}
              sessionOpen={sessionOpen}
              onStart={handleStartSession}
              startHelperText={
                sessionOpen
                  ? "Session open — scan the QR on the right. Start the workout when ready."
                  : "Create a session so phones can join via the QR panel."
              }
            />

          </div>
        </div>
      );
    }
  } else {
    main = (
      <div className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <LiveSession
            state={sessionState}
            config={
              sessionConfig ??
              setupToSessionConfig(defaultSetup, {
                workVolume,
                restVolume,
              })
            }
            onResumeNextPass={() => void resumeNextPass()}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {main}
      {showSidePanels ? (
        <>
          <SessionSpotifyPanel fieldsDisabled={sessionOpen && sessionState.phase === "idle"} />
          {sessionId ? <SessionPlayersPanel /> : null}
          {sessionId ? <SessionEndFab /> : null}
        </>
      ) : null}
    </>
  );
}
