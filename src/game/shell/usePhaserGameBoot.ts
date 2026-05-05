import { useEffect, type RefObject } from 'react';
import * as Phaser from 'phaser';
import { bridgeActions } from '@/game/bridge/store';
import { createSceneContexts } from '@/game/sceneContexts/createSceneContexts';
import { OverworldScene } from '@/game/scenes/overworld/runtime';
import { PHASER_SCENE_KEYS, isMiniGameId } from '@/game/registry/featureIds';
import { getPhaserSceneBinding } from '@/game/registry/featureRuntimeBindings';
import { PhaserSceneAdapter } from '@/game/infra/phaser/PhaserSceneAdapter';
import { GameKernel } from '@/game/kernel/GameKernel';
import { SceneManager } from '@/game/kernel/SceneManager';
import { getGameConfig } from '@/game/runtime/config';
import { getSceneStartResume, prepareSceneStart } from '@/game/runtime/sceneResumePolicy';

interface UsePhaserGameBootOptions {
  bridgeRef: RefObject<{
    onInteract: (area: string) => void;
    onClose: () => void;
    isPaused: boolean;
  }>;
  containerRef: RefObject<HTMLDivElement | null>;
  gameRef: RefObject<Phaser.Game | null>;
  stableOnClose: () => void;
  stableOnInteract: (area: string) => void;
}

export function usePhaserGameBoot({
  bridgeRef,
  containerRef,
  gameRef,
  stableOnClose,
  stableOnInteract
}: UsePhaserGameBootOptions) {
  useEffect(function bootPhaserGame() {
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

    // Initial pause comes from ref so this effect does not remount Phaser when pause toggles.
    game.scene.add(PHASER_SCENE_KEYS.main, OverworldScene, false);

    const adapter = new PhaserSceneAdapter({
      getGame: () => gameRef.current
    });
    const sceneManager = new SceneManager(adapter, {
      onSceneLoadingChange: (contextId) => {
        bridgeActions.setSceneLoading(contextId && isMiniGameId(contextId) ? contextId : null);
      }
    });
    const sceneContexts = createSceneContexts({
      onInteract: stableOnInteract,
      onClose: stableOnClose,
      getIsPaused: () => bridgeRef.current.isPaused,
      prepareSceneStart: (sceneKey) => prepareSceneStart(sceneKey),
      getSceneStartResume: (sceneKey) => getSceneStartResume(sceneKey),
      loadPhaserScene: (id) => getPhaserSceneBinding(id)?.loadScene()
    });
    sceneContexts.forEach((context) => sceneManager.registerContext(context));
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
  }, [bridgeRef, containerRef, gameRef, stableOnClose, stableOnInteract]);
}
