import { useEffect, type RefObject } from 'react';
import * as Phaser from 'phaser';
import { bridgeActions, type OpenOverlayOptions } from '@/game/bridge/store';
import { createSceneContexts } from '@/game/sceneLifecycle/contexts/createSceneContexts';
import { OverworldScene } from '@/game/scenes/overworld/runtime';
import { PHASER_SCENE_KEYS, isSceneId, type SceneId } from '@/game/scenes/sceneIds';
import { getLoadableScene } from '@/game/scenes/sceneRegistry';
import type { OverlayId } from '@/game/overlays/overlayIds';
import { PhaserSceneAdapter } from '@/game/adapters/phaser/PhaserSceneAdapter';
import { SceneLifecycleController } from '@/game/sceneLifecycle/SceneLifecycleController';
import { SceneManager } from '@/game/sceneLifecycle/SceneManager';
import { getGameConfig } from '@/game/sharedSceneRuntime/config';
import { getSceneStartResume, prepareSceneStart } from '@/game/sharedSceneRuntime/sceneResumePolicy';
import type { RidgeDevControls } from '@/game/scenes/ridge/runtime/ridgeDevControls';
import { getDevRidgeProgressSeed } from './devRidgeProgressParams';

interface UsePhaserGameBootOptions {
  bridgeRef: RefObject<{
    isPaused: boolean;
    onEnterScene: (sceneId: SceneId) => void;
    onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
    onReturnToOverworld: () => void;
    ridgeDevControls?: RidgeDevControls;
  }>;
  containerRef: RefObject<HTMLDivElement | null>;
  gameRef: RefObject<Phaser.Game | null>;
  stableOnEnterScene: (sceneId: SceneId) => void;
  stableOnOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  stableOnReturnToOverworld: () => void;
}

export function usePhaserGameBoot({
  bridgeRef,
  containerRef,
  gameRef,
  stableOnEnterScene,
  stableOnOpenOverlay,
  stableOnReturnToOverworld
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
    game.scene.add(PHASER_SCENE_KEYS.overworld, OverworldScene, false);

    const adapter = new PhaserSceneAdapter({
      getGame: () => gameRef.current
    });
    const sceneManager = new SceneManager(adapter, {
      onSceneLoadingChange: (contextId) => {
        bridgeActions.setSceneLoading(contextId && isSceneId(contextId) ? contextId : null);
      }
    });
    const sceneContexts = createSceneContexts({
      onEnterScene: stableOnEnterScene,
      onOpenOverlay: stableOnOpenOverlay,
      onReturnToOverworld: stableOnReturnToOverworld,
      getIsPaused: () => bridgeRef.current.isPaused,
      prepareSceneStart: (sceneKey) => prepareSceneStart(sceneKey),
      getSceneStartResume: (sceneKey) => getSceneStartResume(sceneKey),
      getRidgeDevControls: () => bridgeRef.current.ridgeDevControls,
      loadPhaserScene: (id) => getLoadableScene(id)?.loadScene?.()
    });
    sceneContexts.forEach((context) => sceneManager.registerContext(context));
    const sceneLifecycle = new SceneLifecycleController(sceneManager);
    sceneLifecycle.start();

    // Dev-only helpers: seed progress and/or start scenes without walking to triggers.
    if (import.meta.env.DEV) {
      const url = new URL(window.location.href);
      let shouldReplaceUrl = false;

      const ridgeProgressSeed = getDevRidgeProgressSeed(url.searchParams);
      ridgeProgressSeed.stampIds.forEach((stampId) => {
        bridgeActions.awardRidgeStamp(stampId);
      });
      ridgeProgressSeed.consumedParams.forEach((param) => {
        url.searchParams.delete(param);
        shouldReplaceUrl = true;
      });

      const startScene = url.searchParams.get('startScene');
      if (startScene && isSceneId(startScene)) {
        bridgeActions.enterScene(startScene);
        url.searchParams.delete('startScene');
        shouldReplaceUrl = true;
      }

      if (shouldReplaceUrl) {
        window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
      }
    }

    return () => {
      ro?.disconnect();
      sceneLifecycle.stop();
      game.destroy(true);
      gameRef.current = null;
    };
  }, [
    bridgeRef,
    containerRef,
    gameRef,
    stableOnEnterScene,
    stableOnOpenOverlay,
    stableOnReturnToOverworld
  ]);
}
