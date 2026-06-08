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
  chrome?: 'framed' | 'bare';
  ridgeDevControls?: RidgeDevControls;
}

export default function Game({
  onEnterScene,
  onOpenOverlay,
  isPaused,
  activeSceneId,
  presentationMode,
  onReturnToOverworld,
  chrome = 'framed',
  ridgeDevControls
}: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const shouldUsePortraitCoverTouch = presentationMode === 'portrait-cover';
  const {
    bridgeRef,
    stableOnEnterScene,
    stableOnOpenOverlay,
    stableOnReturnToOverworld
  } = useGameBridgeCallbacks({
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

  const frameClassName = chrome === 'framed'
    ? 'relative h-full w-full min-h-0 overflow-hidden rounded-lg border-4 border-neutral-800 bg-[#fbfbf9] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]'
    : 'relative h-full w-full min-h-0 overflow-hidden bg-[#fbfbf9]';

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
          <ControlMatDragIndicator
            className="z-20 md:hidden"
            state={touchControls.dragIndicator}
          />
        </>
      )}
    </div>
  );
}
