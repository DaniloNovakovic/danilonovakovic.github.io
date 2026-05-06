import { useRef } from 'react';
import * as Phaser from 'phaser';
import { useGameBridgeCallbacks } from './useGameBridgeCallbacks';
import { useGameTouchControls } from './useGameTouchControls';
import { usePhaserGameBoot } from './usePhaserGameBoot';
import { usePhaserScaleRefresh } from './usePhaserScaleRefresh';
import type { PhaserScenePresentationMode } from '@/game/sharedSceneRuntime/phaserScenePresentation';
import type { SceneId } from '@/game/scenes/sceneIds';
import type { OverlayId } from '@/game/overlays/overlayIds';
import type { OpenOverlayOptions } from '@/game/bridge/store';

interface GameProps {
  onEnterScene: (sceneId: SceneId) => void;
  onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  isPaused: boolean;
  activeSceneId: SceneId;
  presentationMode: PhaserScenePresentationMode;
  onReturnToOverworld: () => void;
}

export default function Game({
  onEnterScene,
  onOpenOverlay,
  isPaused,
  activeSceneId,
  presentationMode,
  onReturnToOverworld
}: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const shouldUseGestureOverlay = presentationMode === 'portrait-cover';
  const {
    bridgeRef,
    stableOnEnterScene,
    stableOnOpenOverlay,
    stableOnReturnToOverworld
  } = useGameBridgeCallbacks({
    onEnterScene,
    onOpenOverlay,
    onReturnToOverworld,
    isPaused
  });

  const touchHandlers = useGameTouchControls({ isPaused });
  usePhaserScaleRefresh({ activeSceneId, gameRef, presentationMode });
  usePhaserGameBoot({
    bridgeRef,
    containerRef,
    gameRef,
    stableOnEnterScene,
    stableOnOpenOverlay,
    stableOnReturnToOverworld
  });

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden rounded-lg border-4 border-neutral-800 bg-[#fbfbf9] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
      <div ref={containerRef} className="absolute inset-0 outline-none" />
      {shouldUseGestureOverlay && (
        <div
          className="absolute inset-0 z-10 touch-none md:hidden"
          {...touchHandlers}
        />
      )}
    </div>
  );
}
