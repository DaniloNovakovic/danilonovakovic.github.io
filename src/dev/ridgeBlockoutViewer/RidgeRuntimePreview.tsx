import { useEffect, useRef } from 'react';
import Game from '@/game/shell/Game';
import { bridgeActions, useBridgeState } from '@/game/bridge/store';
import { RIDGE_SCENE_ID } from '@/game/scenes/sceneIds';
import type { RidgeDevControls } from '@/game/scenes/ridge/runtime/ridgeDevControls';

function ignorePreviewSceneClose(): void {}

export type RidgePreviewInputOwner = 'game' | 'panel';

export function RidgeRuntimePreview({
  inputOwner,
  onClaimGameInput,
  previewZoom,
  ridgeDevControls
}: {
  inputOwner: RidgePreviewInputOwner;
  onClaimGameInput: () => void;
  previewZoom: number;
  ridgeDevControls: RidgeDevControls;
}) {
  const bridge = useBridgeState();
  const previewRef = useRef<HTMLElement | null>(null);
  const isInputPaused = bridge.isPaused || bridge.loadingSceneId !== null || inputOwner === 'panel';
  const pauseReason = inputOwner === 'panel' ? 'Panel focus' : 'Runtime paused';
  const showPausedOverlay = isInputPaused && bridge.loadingSceneId === null;

  useEffect(function bootRidgePreviewScene() {
    bridgeActions.closeOverlay();
    bridgeActions.clearSceneUi();
    bridgeActions.setSceneLoading(null);
    bridgeActions.resetTouch();
    bridgeActions.enterScene(RIDGE_SCENE_ID);

    return () => {
      bridgeActions.resetTouch();
      bridgeActions.closeOverlay();
      bridgeActions.clearSceneUi();
      bridgeActions.returnToOverworld();
    };
  }, []);

  function claimGameInput(): void {
    onClaimGameInput();
    previewRef.current?.focus({ preventScroll: true });
  }

  return (
    <section
      aria-label="Ridge runtime preview game input area"
      className="relative min-h-0 min-w-0 overflow-hidden border-4 border-[#1a1a1a] bg-[#fbfbf9] shadow-[7px_7px_0_rgba(26,26,26,1)]"
      data-testid="ridge-runtime-preview"
      onFocus={(event) => {
        if (event.target === event.currentTarget) {
          onClaimGameInput();
        }
      }}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest('[data-ridge-preview-focus-button]')) return;
        claimGameInput();
      }}
      ref={previewRef}
      tabIndex={0}
    >
      <div className="absolute left-2 top-2 z-20 max-w-[min(16rem,calc(100%-1rem))] border-2 border-[#1a1a1a] bg-[#fbfbf9]/88 px-2 py-1.5 shadow-[3px_3px_0_rgba(26,26,26,1)]">
        <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#5a554f]">
          Live Ridge
        </p>
        <p className="text-[11px] font-black uppercase tracking-wider text-[#1a1a1a]">
          Camera zoom {Math.round(previewZoom * 100)}%
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className={[
              'border-2 border-[#1a1a1a] px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest',
              isInputPaused ? 'bg-[#f3df8b]' : 'bg-[#d7f2d1]'
            ].join(' ')}
            data-testid="ridge-preview-input-status"
          >
            {isInputPaused ? 'Panel focus' : 'Game input'}
          </span>
        </div>
      </div>
      <Game
        activeSceneId={bridge.activeSceneId}
        chrome="bare"
        isPaused={isInputPaused}
        onEnterScene={bridgeActions.enterScene}
        onOpenOverlay={bridgeActions.openOverlay}
        onReturnToOverworld={ignorePreviewSceneClose}
        presentationMode="portrait-cover"
        ridgeDevControls={ridgeDevControls}
      />
      {showPausedOverlay ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-[#fbfbf9]/42 backdrop-blur-[2px]"
          data-testid="ridge-preview-paused-overlay"
        >
          <div className="max-w-[min(17rem,calc(100%-2rem))] border-2 border-[#1a1a1a] bg-[#fbfbf9]/95 px-4 py-3 text-center shadow-[5px_5px_0_rgba(26,26,26,1)]">
            <p className="text-base font-black uppercase tracking-wider text-[#1a1a1a]">
              Paused
            </p>
            <p className="mt-1 font-mono text-[10px] font-black uppercase tracking-widest text-[#5a554f]">
              {pauseReason}
            </p>
            <button
              className="mt-3 min-h-9 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-[#1a1a1a] hover:text-[#fbfbf9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
              data-ridge-preview-focus-button=""
              onClick={claimGameInput}
              type="button"
            >
              Focus game
            </button>
          </div>
        </div>
      ) : null}
      {bridge.loadingSceneId ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1a1a1a]/35">
          <p className="border-2 border-[#1a1a1a] bg-[#fbfbf9] px-4 py-2 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0_rgba(26,26,26,1)]">
            Loading Ridge
          </p>
        </div>
      ) : null}
    </section>
  );
}
