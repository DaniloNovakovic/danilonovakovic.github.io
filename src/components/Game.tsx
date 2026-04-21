import { useEffect, useRef, useCallback, useLayoutEffect, useState } from 'react';
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

export default function Game({ onInteract, isPaused, activeMiniGameId, onClose }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const bridgeRef = useRef({ onInteract, onClose, isPaused });
  const [dragStart, setDragStart] = useState<number | null>(null);

  useLayoutEffect(() => {
    bridgeRef.current = { onInteract, onClose, isPaused };
  }, [onInteract, onClose, isPaused]);

  const stableOnInteract = useCallback((area: string) => {
    bridgeRef.current.onInteract(area);
  }, []);

  const stableOnClose = useCallback(() => {
    bridgeRef.current.onClose();
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPaused) return;
    setDragStart(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStart === null || isPaused) return;
    const delta = e.clientX - dragStart;
    const threshold = 15; // px

    if (delta > threshold) {
      bridgeActions.setTouchDirectional('right', true);
      bridgeActions.setTouchDirectional('left', false);
    } else if (delta < -threshold) {
      bridgeActions.setTouchDirectional('left', true);
      bridgeActions.setTouchDirectional('right', false);
    } else {
      bridgeActions.setTouchDirectional('left', false);
      bridgeActions.setTouchDirectional('right', false);
    }
  };

  const handlePointerUp = () => {
    setDragStart(null);
    bridgeActions.setTouchDirectional('left', false);
    bridgeActions.setTouchDirectional('right', false);
  };

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
      {/* Touch surface for swipe movement */}
      <div
        className="absolute inset-0 z-10 touch-none md:hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
