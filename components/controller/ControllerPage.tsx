"use client";

import { LiveSession } from "@/components/LiveSession";
import { NotaAppNav } from "@/components/NotaAppNav";
import { SetupForm } from "@/components/SetupForm";
import { SpotifyConnect } from "@/components/SpotifyConnect";
import { useSessionController } from "@/contexts/SessionControllerContext";

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

  if (sessionState.phase === "idle") {
    return (
      <div className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <header className="flex justify-center">
            <NotaAppNav />
          </header>

          <SpotifyConnect
            status={spotifyStatus}
            onConnect={handleConnectSpotify}
            onDisconnect={handleDisconnectSpotify}
          />

          <SetupForm
            initialValues={setupValues}
            onStart={(config) => {
              setSetupValues(config);
              localStorage.setItem("nota_class_controller_setup", JSON.stringify(config));
              void startSession({
                ...config,
                workVolume,
                restVolume,
              });
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
