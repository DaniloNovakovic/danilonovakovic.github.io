import { useRef } from 'react';
import * as Phaser from 'phaser';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Circle, Hand } from 'lucide-react';
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
  chrome?: 'framed' | 'bare';
}

export default function Game({
  onEnterScene,
  onOpenOverlay,
  isPaused,
  activeSceneId,
  presentationMode,
  onReturnToOverworld,
  chrome = 'framed'
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

  const frameClassName = chrome === 'framed'
    ? 'relative h-full w-full min-h-0 overflow-hidden rounded-lg border-4 border-neutral-800 bg-[#fbfbf9] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]'
    : 'relative h-full w-full min-h-0 overflow-hidden bg-[#fbfbf9]';

  return (
    <div className={frameClassName}>
      <div ref={containerRef} className="absolute inset-0 outline-none" />
      {shouldUseGestureOverlay && (
        <>
          <div
            className="absolute inset-0 z-10 touch-none md:hidden"
            {...touchControls.gestureHandlers}
          />
          <ExplorationTouchControls controls={touchControls} />
        </>
      )}
    </div>
  );
}

function ExplorationTouchControls({
  controls
}: {
  controls: ReturnType<typeof useGameTouchControls>;
}) {
  const buttonClassName = [
    'pointer-events-auto flex h-12 w-12 items-center justify-center rounded border-2 border-[#1a1a1a]',
    'bg-[#fbfbf9]/88 text-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(26,26,26,0.92)]',
    'touch-none active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(26,26,26,0.92)]'
  ].join(' ');

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex items-end justify-between px-4 md:hidden">
      <div className="grid grid-cols-3 grid-rows-3 gap-1">
        <button
          type="button"
          aria-label="Move up"
          className={`${buttonClassName} col-start-2 row-start-1`}
          {...controls.getDirectionalButtonHandlers('up')}
        >
          <ArrowUp className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Move left"
          className={`${buttonClassName} col-start-1 row-start-2`}
          {...controls.getDirectionalButtonHandlers('left')}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Move right"
          className={`${buttonClassName} col-start-3 row-start-2`}
          {...controls.getDirectionalButtonHandlers('right')}
        >
          <ArrowRight className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Move down"
          className={`${buttonClassName} col-start-2 row-start-3`}
          {...controls.getDirectionalButtonHandlers('down')}
        >
          <ArrowDown className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Jump"
          className={buttonClassName}
          {...controls.jumpButtonHandlers}
        >
          <Circle className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Interact"
          className={buttonClassName}
          {...controls.interactButtonHandlers}
        >
          <Hand className="h-5 w-5" strokeWidth={2.4} aria-hidden />
        </button>
      </div>
    </div>
  );
}
