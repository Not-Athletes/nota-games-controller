"use client";

import { useState } from "react";
import { LiveSession } from "@/components/LiveSession";
import { NotaAppNav } from "@/components/NotaAppNav";
import { NotaSignIn } from "@/components/NotaSignIn";
import { SessionConnect } from "@/components/SessionConnect";
import { SetupForm } from "@/components/SetupForm";
import { SetupReview } from "@/components/SetupReview";
import { useSessionController } from "@/contexts/SessionControllerContext";
import { useNotaAuth } from "@/hooks/useNotaAuth";
import { useSessionOrchestration } from "@/hooks/useSessionOrchestration";
import { setupToSessionConfig } from "@/lib/session/config";
import type { SetupInput } from "@/types/session";

export function ControllerPage() {
  const {
    setupValues,
    setSetupValues,
    sessionConfig,
    sessionState,
    spotifyStatus,
    nowPlaying,
    startSession,
    endSession,
    goHome,
    resumeNextPass,
    handleConnectSpotify,
    handleDisconnectSpotify,
    setSpotifyEnabled,
    workVolume,
    restVolume,
    defaultSetup,
  } = useSessionController();
  const { sessionId, backendEnabled } = useSessionOrchestration();
  const notaAuth = useNotaAuth();
  const [setupStep, setSetupStep] = useState<"setup" | "review">("setup");

  const persistSetupValues = (config: SetupInput) => {
    setSetupValues(config);
    localStorage.setItem("nota_class_controller_setup", JSON.stringify(config));
  };

  const sessionOpen = backendEnabled && Boolean(sessionId);
  const startDisabled = backendEnabled && !sessionId;
  const startDisabledReason = "Create a session first so phones can join before you start the session.";

  const handleStartSession = (config: SetupInput) => {
    persistSetupValues(config);
    void startSession(
      setupToSessionConfig(config, {
        workVolume,
        restVolume,
      })
    );
  };

  if (sessionState.phase === "idle") {
    if (notaAuth.requiresAuth && !notaAuth.loading && !notaAuth.authenticated) {
      return (
        <div className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
          <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
            <header className="flex justify-center">
              <NotaAppNav />
            </header>
            <NotaSignIn auth={notaAuth} />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <header className="flex justify-center">
            <NotaAppNav />
          </header>

          {backendEnabled && setupStep === "setup" ? (
            <SessionConnect
              setupValues={setupValues}
              workVolume={workVolume}
              restVolume={restVolume}
              enabled={backendEnabled}
            />
          ) : null}

          {setupStep === "setup" ? (
            <SetupForm
              values={setupValues}
              onValuesChange={persistSetupValues}
              spotifyStatus={spotifyStatus}
              onConnectSpotify={handleConnectSpotify}
              onDisconnectSpotify={handleDisconnectSpotify}
              fieldsDisabled={sessionOpen}
              fieldsDisabledReason={
                sessionOpen
                  ? "Workout settings are locked while a session is open. End the session to change them."
                  : undefined
              }
              continueDisabled={startDisabled}
              continueDisabledReason={startDisabled ? startDisabledReason : undefined}
              onContinue={(config) => {
                persistSetupValues(config);
                setSetupStep("review");
              }}
            />
          ) : (
            <SetupReview
              values={setupValues}
              onBack={() => setSetupStep("setup")}
              onStart={() => handleStartSession(setupValues)}
              startDisabled={startDisabled}
              startDisabledReason={startDisabled ? startDisabledReason : undefined}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <LiveSession
        state={sessionState}
        config={
          sessionConfig ??
          setupToSessionConfig(defaultSetup, {
            workVolume,
            restVolume,
          })
        }
        spotifyStatus={spotifyStatus}
        nowPlaying={nowPlaying}
        onEndSession={endSession}
        onResumeNextPass={() => void resumeNextPass()}
        onGoHome={() => {
          setSetupStep("setup");
          goHome();
        }}
        onToggleSpotifyEnabled={(enabled) => void setSpotifyEnabled(enabled)}
      />
    </div>
  );
}
