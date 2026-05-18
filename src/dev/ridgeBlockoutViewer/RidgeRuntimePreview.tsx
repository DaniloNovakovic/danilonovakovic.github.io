import { useEffect, useRef } from 'react';
import Game from '@/game/shell/Game';
import { bridgeActions, useBridgeState } from '@/game/bridge/store';
import { OverlayHost } from '@/game/overlays/OverlayHost';
import { SceneUiHost } from '@/game/sceneUi/SceneUiHost';
import { getPhaserScenePresentationMode } from '@/game/sharedSceneRuntime/phaserScenePresentation';
import { RIDGE_SCENE_ID, type SceneId } from '@/game/scenes/sceneIds';
import type { RidgeDevControls } from '@/game/scenes/ridge/runtime/ridgeDevControls';

function ignorePreviewSceneClose(): void {}

export type RidgePreviewInputOwner = 'game' | 'panel';

export function RidgeRuntimePreview({
  inputOwner,
  isActive,
  onClaimGameInput,
  previewZoom,
  ridgeDevControls
}: {
  inputOwner: RidgePreviewInputOwner;
  isActive: boolean;
  onClaimGameInput: () => void;
  previewZoom: number;
  ridgeDevControls: RidgeDevControls;
}) {
  const bridge = useBridgeState();
  const previewRef = useRef<HTMLElement | null>(null);
  const isInputPaused =
    !isActive || bridge.isPaused || bridge.loadingSceneId !== null || inputOwner === 'panel';
  const inputStatusLabel = !isActive
    ? 'Model view'
    : inputOwner === 'panel'
      ? 'Panel focus'
      : bridge.isPaused || bridge.loadingSceneId !== null
        ? 'Runtime paused'
        : 'Game input';
  const pauseReason = !isActive
    ? 'Model view'
    : inputOwner === 'panel'
      ? 'Panel focus'
      : 'Runtime paused';
  const showPausedOverlay =
    isActive && isInputPaused && bridge.loadingSceneId === null && bridge.activeOverlayId === null;
  const presentationMode = getPhaserScenePresentationMode(bridge.activeSceneId);
  const isRidgeSceneActive = bridge.activeSceneId === RIDGE_SCENE_ID;

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
    if (!isActive) return;
    onClaimGameInput();
    previewRef.current?.focus({ preventScroll: true });
  }

  function enterPreviewScene(sceneId: SceneId): void {
    bridgeActions.enterScene(sceneId);
    onClaimGameInput();
    requestAnimationFrame(() => {
      previewRef.current?.focus({ preventScroll: true });
    });
  }

  function returnToRidgePreview(): void {
    enterPreviewScene(RIDGE_SCENE_ID);
  }

  return (
    <section
      aria-label="Ridge runtime preview game input area"
      aria-hidden={!isActive}
      className={[
        'relative h-full min-h-0 min-w-0 overflow-hidden border-4 border-[#1a1a1a] bg-[#fbfbf9] shadow-[7px_7px_0_rgba(26,26,26,1)]',
        isActive ? '' : 'invisible pointer-events-none'
      ].join(' ')}
      data-testid="ridge-runtime-preview"
      onFocus={(event) => {
        if (isActive && event.target === event.currentTarget) {
          onClaimGameInput();
        }
      }}
      onPointerDown={(event) => {
        if (!isActive) return;
        if ((event.target as HTMLElement).closest('[data-ridge-preview-focus-button]')) return;
        claimGameInput();
      }}
      ref={previewRef}
      tabIndex={isActive ? 0 : -1}
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
            {inputStatusLabel}
          </span>
          {!isRidgeSceneActive ? (
            <button
              className="border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-[#1a1a1a] hover:text-[#fbfbf9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
              data-ridge-preview-focus-button=""
              onClick={returnToRidgePreview}
              type="button"
            >
              Back to Ridge
            </button>
          ) : null}
        </div>
      </div>
      <Game
        activeSceneId={bridge.activeSceneId}
        chrome="bare"
        isPaused={isInputPaused}
        onEnterScene={enterPreviewScene}
        onOpenOverlay={bridgeActions.openOverlay}
        onReturnToOverworld={ignorePreviewSceneClose}
        presentationMode={presentationMode}
        ridgeDevControls={ridgeDevControls}
      />
      <div className="pointer-events-none absolute inset-0 z-[15]">
        <div className="pointer-events-auto">
          <SceneUiHost placement="panel" />
        </div>
      </div>
      {bridge.sceneUi.status ? (
        <div className="pointer-events-none absolute bottom-2 left-2 right-2 z-20 flex justify-center">
          <div className="pointer-events-auto w-[min(28rem,100%)]">
            <SceneUiHost placement="status" />
          </div>
        </div>
      ) : null}
      <OverlayHost enterScene={enterPreviewScene} />
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
