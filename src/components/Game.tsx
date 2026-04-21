import { useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import * as Phaser from 'phaser';
import { PHASER_SCENE_KEYS } from '../config/featureIds';
import { getGameConfig } from '../runtime/config';
import { OverworldScene } from '../runtime/OverworldScene';
import { getAllMiniGames } from '../runtime/miniGameRegistry';
import { MiniGameType } from '../runtime/types';
import { peekResumePosition } from '../runtime/sceneResumeStore';
import { bridgeActions } from '../shared/bridge/store';
import { SceneManager } from '../core/kernel/SceneManager';
import { PhaserSceneAdapter } from '../infra/phaser/PhaserSceneAdapter';
import { GameKernel } from '../core/kernel/GameKernel';
import { createStreetPlugin } from '../contextPlugins/plugins/StreetPlugin';
import { createHobbiesPlugin } from '../contextPlugins/plugins/HobbiesPlugin';

interface GameProps {
  onInteract: (area: string) => void;
  isPaused: boolean;
  activeMiniGameId: string | null;
  onClose: () => void;
}

function MobileGameControls({ visible }: { visible: boolean }) {
  useEffect(() => {
    if (!visible) bridgeActions.resetTouch();
  }, [visible]);

  if (!visible) return null;

  const btn =
    'pointer-events-auto select-none touch-manipulation rounded-md border-2 border-[#1a1a1a] bg-[#fbfbf9]/95 px-2 py-2 text-xs font-bold text-[#1a1a1a] shadow-[3px_3px_0_0_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:rounded-lg sm:px-3 sm:py-2.5 sm:text-sm';

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-1 z-20 flex flex-wrap justify-center gap-1.5 px-1 md:hidden">
      <button
        type="button"
        className={`${btn} min-w-[2.75rem]`}
        aria-label="Move left"
        onPointerDown={(e) => {
          e.preventDefault();
          bridgeActions.setTouchDirectional('left', true);
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          bridgeActions.setTouchDirectional('left', false);
        }}
        onPointerLeave={() => {
          bridgeActions.setTouchDirectional('left', false);
        }}
        onPointerCancel={() => {
          bridgeActions.setTouchDirectional('left', false);
        }}
      >
        ←
      </button>
      <button
        type="button"
        className={`${btn} min-w-[2.75rem]`}
        aria-label="Jump"
        onPointerDown={(e) => {
          e.preventDefault();
          bridgeActions.queueJump();
        }}
      >
        ↑
      </button>
      <button
        type="button"
        className={`${btn} min-w-[2.75rem]`}
        aria-label="Move right"
        onPointerDown={(e) => {
          e.preventDefault();
          bridgeActions.setTouchDirectional('right', true);
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          bridgeActions.setTouchDirectional('right', false);
        }}
        onPointerLeave={() => {
          bridgeActions.setTouchDirectional('right', false);
        }}
        onPointerCancel={() => {
          bridgeActions.setTouchDirectional('right', false);
        }}
      >
        →
      </button>
      <button
        type="button"
        className={`${btn} min-w-[2.75rem]`}
        aria-label="Interact"
        onPointerDown={(e) => {
          e.preventDefault();
          bridgeActions.tapInteract();
        }}
      >
        E
      </button>
    </div>
  );
}

export default function Game({ onInteract, isPaused, activeMiniGameId, onClose }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const bridgeRef = useRef({ onInteract, onClose, isPaused });

  useLayoutEffect(() => {
    bridgeRef.current = { onInteract, onClose, isPaused };
  }, [onInteract, onClose, isPaused]);

  const stableOnInteract = useCallback((area: string) => {
    bridgeRef.current.onInteract(area);
  }, []);

  const stableOnClose = useCallback(() => {
    bridgeRef.current.onClose();
  }, []);

  useEffect(() => {
    bridgeActions.resetTouch();
  }, [activeMiniGameId]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config = getGameConfig(containerRef.current);

    const game = new Phaser.Game(config);
    gameRef.current = game;

    const el = containerRef.current;
    const refresh = () => {
      game.scale.refresh();
    };
    const ro = el ? new ResizeObserver(() => refresh()) : null;
    if (el && ro) {
      ro.observe(el);
      refresh();
      requestAnimationFrame(() => {
        refresh();
        requestAnimationFrame(refresh);
      });
    }

    // Initial pause comes from ref (updated in useLayoutEffect) so this effect
    // does not close over `isPaused` — avoids remounting Phaser when pause toggles.
    game.scene.add(PHASER_SCENE_KEYS.main, OverworldScene, true, {
      onInteract: stableOnInteract,
      isPaused: bridgeRef.current.isPaused,
      resumePosition: peekResumePosition(PHASER_SCENE_KEYS.main)
    });

    const phaserScenes = getAllMiniGames().filter((g) => g.type === MiniGameType.PHASER_SCENE && g.Scene);
    phaserScenes.forEach((s) => {
      if (s.Scene) {
        game.scene.add(s.id, s.Scene, false);
      }
    });

    const adapter = new PhaserSceneAdapter({
      getGame: () => gameRef.current,
      onInteract: stableOnInteract
    });
    const sceneManager = new SceneManager(adapter, PHASER_SCENE_KEYS.main);
    sceneManager.registerContext(
      createStreetPlugin({
        onInteract: stableOnInteract,
        getResumePosition: () => peekResumePosition(PHASER_SCENE_KEYS.main)
      })
    );
    sceneManager.registerContext(
      createHobbiesPlugin({
        onClose: stableOnClose,
        onInteract: stableOnInteract,
        getResumePosition: () => peekResumePosition(PHASER_SCENE_KEYS.hobbies)
      })
    );
    const kernel = new GameKernel(sceneManager);
    kernel.start();

    return () => {
      ro?.disconnect();
      kernel.stop();
      game.destroy(true);
      gameRef.current = null;
    };
  }, [stableOnClose, stableOnInteract]);

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden rounded-lg border-4 border-neutral-800 bg-[#fbfbf9] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
      <div ref={containerRef} className="absolute inset-0 outline-none" />
      <MobileGameControls visible={!isPaused} />
    </div>
  );
}
