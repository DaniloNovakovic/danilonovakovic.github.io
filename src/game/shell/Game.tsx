import { useRef } from 'react';
import * as Phaser from 'phaser';
import { ControlMatDragIndicator } from '@/shared/ui';
import { useGameBridgeCallbacks } from './useGameBridgeCallbacks';
import { useGameTouchControls } from './useGameTouchControls';
import { usePhaserGameBoot } from './usePhaserGameBoot';
import { usePhaserGamePauseSync } from './usePhaserGamePauseSync';
import { usePhaserScaleRefresh } from './usePhaserScaleRefresh';
import type { PhaserScenePresentationMode } from '@/game/sharedSceneRuntime/phaserScenePresentation';
import type { SceneId } from '@/game/scenes/sceneIds';
import type { OverlayId } from '@/game/overlays/overlayIds';
import type { OpenOverlayOptions } from '@/game/bridge/store';
import type { RidgeDevControls } from '@/game/scenes/ridge/runtime/ridgeDevControls';

interface GameProps {
  onEnterScene: (sceneId: SceneId) => void;
  onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  isPaused: boolean;
  activeSceneId: SceneId;
  presentationMode: PhaserScenePresentationMode;
  onReturnToOverworld: () => void;
  /** `unframed`: the framed box, with its ink gone (the Out of Bounds card has fallen away). */
  chrome?: 'framed' | 'bare' | 'unframed';
  ridgeDevControls?: RidgeDevControls;
  /** A scene UI surface needs raw canvas pointer input (e.g. drawing), so the swipe mat stands aside. */
  isScenePointerCaptured?: boolean;
}

export default function Game({
  onEnterScene,
  onOpenOverlay,
  isPaused,
  activeSceneId,
  presentationMode,
  onReturnToOverworld,
  chrome = 'framed',
  ridgeDevControls,
  isScenePointerCaptured = false
}: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const shouldUsePortraitCoverTouch = presentationMode === 'portrait-cover' && !isScenePointerCaptured;
  const { bridgeRef, stableOnEnterScene, stableOnOpenOverlay, stableOnReturnToOverworld } = useGameBridgeCallbacks({
    onEnterScene,
    onOpenOverlay,
    onReturnToOverworld,
    isPaused,
    ridgeDevControls
  });

  const touchControls = useGameTouchControls({ isPaused });
  usePhaserScaleRefresh({ activeSceneId, gameRef, presentationMode });
  usePhaserGameBoot({
    bridgeRef,
    containerRef,
    gameRef,
    stableOnEnterScene,
    stableOnOpenOverlay,
    stableOnReturnToOverworld
  });
  usePhaserGamePauseSync({ activeSceneId, gameRef, isPaused });

  const frameClassName = {
    framed:
      'relative h-full w-full min-h-0 overflow-hidden rounded-lg border-4 border-neutral-800 bg-[#fbfbf9] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]',
    unframed: 'relative h-full w-full min-h-0 overflow-hidden border-4 border-transparent bg-[#f4f1ea]',
    bare: 'relative h-full w-full min-h-0 overflow-hidden bg-[#fbfbf9]'
  }[chrome];

  return (
    <div className={frameClassName}>
      <div ref={containerRef} className="absolute inset-0 outline-none" />
      {shouldUsePortraitCoverTouch && (
        <>
          <div
            aria-label="Move and interact"
            className="absolute inset-0 z-10 touch-none md:hidden"
            role="application"
            onPointerCancel={touchControls.onPointerCancel}
            onPointerDown={touchControls.onPointerDown}
            onPointerLeave={touchControls.onPointerLeave}
            onPointerMove={touchControls.onPointerMove}
            onPointerUp={touchControls.onPointerUp}
          />
          <ControlMatDragIndicator className="z-20 md:hidden" state={touchControls.dragIndicator} />
        </>
      )}
    </div>
  );
}
