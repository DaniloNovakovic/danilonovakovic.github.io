import { useRef } from 'react';
import * as Phaser from 'phaser';
import { Circle, Hand } from 'lucide-react';
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
  /**
   * Temporary Ridge exploration touch UI.
   *
   * Longer term, mobile controls should use one shared scene-control system instead of each
   * mode inventing its own overlay. The target shape is closer to Stampede Sketch: a large
   * touch/control mat around the game card with controls that appear under touch or fade when
   * idle, so movement has more usable area and buttons do not permanently block the playfield.
   */
  const actionButtonClassName = [
    'pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#1a1a1a]/70',
    'bg-[#fbfbf9]/50 text-[#1a1a1a]/82 shadow-[3px_3px_0px_0px_rgba(26,26,26,0.32)] backdrop-blur-[2px]',
    'touch-none active:scale-95 active:bg-[#f3df8b]/62'
  ].join(' ');

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-end justify-between px-5 md:hidden">
      <div
        aria-label="Move"
        role="application"
        className="pointer-events-auto relative h-28 w-28 rounded-full border-2 border-[#1a1a1a]/48 bg-[#fbfbf9]/32 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.24)] backdrop-blur-[2px] touch-none"
        {...controls.joystickHandlers}
      >
        <div className="absolute left-1/2 top-1/2 h-[2px] w-16 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a]/18" />
        <div className="absolute left-1/2 top-1/2 h-16 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a]/18" />
        <div
          className="absolute h-12 w-12 rounded-full border-2 border-[#1a1a1a]/64 bg-[#f3df8b]/58 shadow-[2px_2px_0px_0px_rgba(26,26,26,0.24)]"
          style={{
            left: `calc(50% - 24px + ${controls.joystickOffset.x}px)`,
            top: `calc(50% - 24px + ${controls.joystickOffset.y}px)`
          }}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Jump"
          className={actionButtonClassName}
          {...controls.jumpButtonHandlers}
        >
          <Circle className="h-6 w-6" strokeWidth={2.4} aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Interact"
          className={actionButtonClassName}
          {...controls.interactButtonHandlers}
        >
          <Hand className="h-6 w-6" strokeWidth={2.4} aria-hidden />
        </button>
      </div>
    </div>
  );
}
