import { useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import * as Phaser from 'phaser';
import { isMiniGameId, PHASER_SCENE_KEYS } from '../config/featureIds';
import { getPhaserSceneBinding } from '../config/featureRuntimeBindings';
import { getGameConfig } from '../runtime/config';
import { OverworldScene } from '../runtime/OverworldScene';
import { getSceneStartResume, prepareSceneStart } from '../runtime/sceneResumePolicy';
import { bridgeActions } from '../shared/bridge/store';
import { SceneManager } from '../core/kernel/SceneManager';
import { PhaserSceneAdapter } from '../infra/phaser/PhaserSceneAdapter';
import { GameKernel } from '../core/kernel/GameKernel';
import { createContextPlugins } from '../contextPlugins/createContextPlugins';
import { useTouchGestures } from './useTouchGestures';
import type { PhaserScenePresentationMode } from '../runtime/phaserScenePresentation';

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
  const bridgeRef = useRef({ onInteract, onClose, isPaused });
  const shouldUseGestureOverlay = presentationMode === 'portrait-cover';

  useLayoutEffect(() => {
    bridgeRef.current = { onInteract, onClose, isPaused };
  }, [onInteract, onClose, isPaused]);

  const stableOnInteract = useCallback((area: string) => {
    bridgeRef.current.onInteract(area);
  }, []);

  const stableOnClose = useCallback(() => {
    bridgeRef.current.onClose();
  }, []);

  const touchHandlers = useTouchGestures({
    onSwipeLeft: (intensity) => {
      if (isPaused) return;
      bridgeActions.setTouchDirectional('left', intensity);
      bridgeActions.setTouchDirectional('right', 0);
    },
    onSwipeRight: (intensity) => {
      if (isPaused) return;
      bridgeActions.setTouchDirectional('right', intensity);
      bridgeActions.setTouchDirectional('left', 0);
    },
    onSwipeUp: () => {
      if (isPaused) return;
      bridgeActions.queueJump();
    },
    onSwipeEnd: () => {
      bridgeActions.setTouchDirectional('left', 0);
      bridgeActions.setTouchDirectional('right', 0);
    },
    onTap: () => {
      if (isPaused) return;
      bridgeActions.tapInteract();
    },
  });

  useEffect(() => {
    bridgeActions.resetTouch();
  }, [activeMiniGameId]);

  useEffect(() => {
    bridgeActions.resetTouch();
    const game = gameRef.current;
    if (!game) return;

    let secondFrameId: number | undefined;
    const firstFrameId = requestAnimationFrame(() => {
      game.scale.refresh();
      secondFrameId = requestAnimationFrame(() => {
        game.scale.refresh();
      });
    });

    return () => {
      cancelAnimationFrame(firstFrameId);
      if (secondFrameId !== undefined) {
        cancelAnimationFrame(secondFrameId);
      }
    };
  }, [presentationMode]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config = getGameConfig(containerRef.current);

    const game = new Phaser.Game(config);
    gameRef.current = game;

    const el = containerRef.current;
    const refresh = () => {
      // During fast remount/HMR teardown, Phaser can lose its canvas parent briefly.
      if (gameRef.current !== game) return;
      if (!game.canvas || !game.canvas.parentElement) return;
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
    game.scene.add(PHASER_SCENE_KEYS.main, OverworldScene, false);

    const adapter = new PhaserSceneAdapter({
      getGame: () => gameRef.current
    });
    const sceneManager = new SceneManager(adapter, {
      onSceneLoadingChange: (contextId) => {
        bridgeActions.setSceneLoading(contextId && isMiniGameId(contextId) ? contextId : null);
      }
    });
    const contextPlugins = createContextPlugins({
      onInteract: stableOnInteract,
      onClose: stableOnClose,
      getIsPaused: () => bridgeRef.current.isPaused,
      prepareSceneStart: (sceneKey) => prepareSceneStart(sceneKey),
      getSceneStartResume: (sceneKey) => getSceneStartResume(sceneKey),
      loadPhaserScene: (id) => getPhaserSceneBinding(id)?.loadScene()
    });
    contextPlugins.forEach((plugin) => sceneManager.registerContext(plugin));
    const kernel = new GameKernel(sceneManager);
    kernel.start();

    // Dev-only helper: `?startScene=<miniGameId>` (e.g. `potassium`, `hobbies`, `basement`).
    // Useful for fast iteration without walking to a trigger each reload.
    if (import.meta.env.DEV) {
      const startScene = new URLSearchParams(window.location.search).get('startScene');
      if (startScene && isMiniGameId(startScene)) {
        bridgeActions.requestInteraction(startScene);
        const url = new URL(window.location.href);
        url.searchParams.delete('startScene');
        window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
      }
    }

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
      {shouldUseGestureOverlay && (
        <div
          className="absolute inset-0 z-10 touch-none md:hidden"
          {...touchHandlers}
        />
      )}
    </div>
  );
}
