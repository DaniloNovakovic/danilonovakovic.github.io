import { useRef } from 'react';
import * as Phaser from 'phaser';
import { useGameBridgeCallbacks } from './useGameBridgeCallbacks';
import { useGameTouchControls } from './useGameTouchControls';
import { usePhaserGameBoot } from './usePhaserGameBoot';
import { usePhaserScaleRefresh } from './usePhaserScaleRefresh';
import type { PhaserScenePresentationMode } from '@game/runtime/phaserScenePresentation';

interface GameProps {
  onInteract: (area: string) => void;
  isPaused: boolean;
  activeMiniGameId: string | null;
  presentationMode: PhaserScenePresentationMode;
  onClose: () => void;
}

export default function Game({
  onInteract,
  isPaused,
  activeMiniGameId,
  presentationMode,
  onClose
}: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const shouldUseGestureOverlay = presentationMode === 'portrait-cover';
  const { bridgeRef, stableOnInteract, stableOnClose } = useGameBridgeCallbacks({
    onInteract,
    onClose,
    isPaused
  });

  const touchHandlers = useGameTouchControls({ isPaused });
  usePhaserScaleRefresh({ activeMiniGameId, gameRef, presentationMode });
  usePhaserGameBoot({ bridgeRef, containerRef, gameRef, stableOnClose, stableOnInteract });

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
