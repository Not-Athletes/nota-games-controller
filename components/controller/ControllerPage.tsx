"use client";

import { LiveSession } from "@/components/LiveSession";
import { NotaAppNav } from "@/components/NotaAppNav";
import { NotaSignIn } from "@/components/NotaSignIn";
import { SessionConnect } from "@/components/SessionConnect";
import { SetupForm } from "@/components/SetupForm";
import { SpotifyConnect } from "@/components/SpotifyConnect";
import { useSessionController } from "@/contexts/SessionControllerContext";
import { useNotaAuth } from "@/hooks/useNotaAuth";
import { useSessionOrchestration } from "@/hooks/useSessionOrchestration";

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

          <div
            className={
              backendEnabled
                ? "grid grid-cols-1 gap-4 md:grid-cols-2"
                : "grid grid-cols-1 gap-4"
            }
          >
            <SpotifyConnect
              status={spotifyStatus}
              onConnect={handleConnectSpotify}
              onDisconnect={handleDisconnectSpotify}
            />

            {backendEnabled ? (
              <SessionConnect
                setupValues={setupValues}
                workVolume={workVolume}
                restVolume={restVolume}
                enabled={backendEnabled}
              />
            ) : null}
          </div>

          <SetupForm
            initialValues={setupValues}
            startDisabled={backendEnabled && !sessionId}
            startDisabledReason="Create a session first so phones can join before you start the workout."
            onStart={(config) => {
              setSetupValues(config);
              localStorage.setItem("nota_class_controller_setup", JSON.stringify(config));
              const sessionConfig = {
                ...config,
                workVolume,
                restVolume,
              };
              void startSession(sessionConfig);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
      <LiveSession
        state={sessionState}
        config={
          sessionConfig ?? {
            ...defaultSetup,
            workVolume,
            restVolume,
          }
        }
        spotifyStatus={spotifyStatus}
        nowPlaying={nowPlaying}
        onEndSession={endSession}
        onResumeNextPass={() => void resumeNextPass()}
        onGoHome={goHome}
        onToggleSpotifyEnabled={(enabled) => void setSpotifyEnabled(enabled)}
      />
    </div>
  );
}
