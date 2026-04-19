import { useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import * as Phaser from 'phaser';
import { PHASER_SCENE_KEYS } from '../config/featureIds';
import { getGameConfig } from '../game/config';
import { mobileTouch, resetMobileTouch } from '../game/mobileTouchBridge';
import { OverworldScene } from '../game/OverworldScene';
import { getAllMiniGames, getMiniGameById } from '../game/miniGameRegistry';
import {
  isInteractBridgeScene,
  isPausableScene,
  isResumeCaptureScene
} from '../game/sceneContracts';
import { rememberResumePosition, peekResumePosition } from '../game/sceneResumeStore';
import { MiniGameType } from '../game/types';

function rememberSceneExitIfSupported(scene: Phaser.Scene): void {
  if (isResumeCaptureScene(scene)) {
    const p = scene.getResumeCapturePosition();
    if (p) rememberResumePosition(scene.scene.key, p);
  }
}

interface GameProps {
  onInteract: (area: string) => void;
  isPaused: boolean;
  activeMiniGameId: string | null;
  onClose: () => void;
}

function MobileGameControls({ visible }: { visible: boolean }) {
  useEffect(() => {
    if (!visible) resetMobileTouch();
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
          mobileTouch.left = true;
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          mobileTouch.left = false;
        }}
        onPointerLeave={() => {
          mobileTouch.left = false;
        }}
        onPointerCancel={() => {
          mobileTouch.left = false;
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
          mobileTouch.jumpQueued = true;
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
          mobileTouch.right = true;
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          mobileTouch.right = false;
        }}
        onPointerLeave={() => {
          mobileTouch.right = false;
        }}
        onPointerCancel={() => {
          mobileTouch.right = false;
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
          mobileTouch.interactTap = true;
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
    resetMobileTouch();
  }, [activeMiniGameId]);

  // Keep Phaser scenes wired to latest callbacks without re-mounting the game.
  useEffect(() => {
    if (!gameRef.current) return;
    const mainScene = gameRef.current.scene.getScene(PHASER_SCENE_KEYS.main) as OverworldScene | null;
    if (mainScene) {
      mainScene.updateInteractCallback(stableOnInteract);
    }

    const hobbiesScene = gameRef.current.scene.getScene(PHASER_SCENE_KEYS.hobbies);
    if (isInteractBridgeScene(hobbiesScene)) {
      hobbiesScene.updateInteractCallback(stableOnInteract);
    }
  }, [stableOnInteract]);

  useEffect(() => {
    if (gameRef.current) {
      const scenes = gameRef.current.scene.getScenes(true);
      scenes.forEach((scene) => {
        if (isPausableScene(scene)) {
          scene.setPaused(isPaused);
        }
      });
    }
  }, [isPaused]);

  useEffect(() => {
    if (gameRef.current && activeMiniGameId) {
      const activeMiniGame = getMiniGameById(activeMiniGameId);
      if (activeMiniGame?.type === MiniGameType.PHASER_SCENE) {
        const sceneKey = activeMiniGame.id;

        if (!gameRef.current.scene.isActive(sceneKey)) {
          const mainScene = gameRef.current.scene.getScene(PHASER_SCENE_KEYS.main);
          if (mainScene && gameRef.current.scene.isActive(PHASER_SCENE_KEYS.main)) {
            rememberSceneExitIfSupported(mainScene);
          }
          gameRef.current.scene.stop(PHASER_SCENE_KEYS.main);
          const resumeInterior = peekResumePosition(sceneKey);
          gameRef.current.scene.start(sceneKey, {
            onClose: stableOnClose,
            onInteract: stableOnInteract,
            isPaused,
            ...(resumeInterior ? { resumePosition: resumeInterior } : {})
          });
        }
      }
    } else if (gameRef.current && !activeMiniGameId) {
      const scenes = gameRef.current.scene.getScenes(false);
      let resetNeeded = false;
      for (const s of scenes) {
        if (s.scene.key === PHASER_SCENE_KEYS.main) continue;
        if (gameRef.current.scene.isActive(s.scene.key)) {
          rememberSceneExitIfSupported(s);
          gameRef.current.scene.stop(s.scene.key);
          resetNeeded = true;
        }
      }

      if (resetNeeded || !gameRef.current.scene.isActive(PHASER_SCENE_KEYS.main)) {
        const resumeMain = peekResumePosition(PHASER_SCENE_KEYS.main);
        gameRef.current.scene.start(PHASER_SCENE_KEYS.main, {
          onInteract: stableOnInteract,
          isPaused,
          ...(resumeMain ? { resumePosition: resumeMain } : {})
        });
      }
    }
  }, [activeMiniGameId, stableOnInteract, stableOnClose, isPaused]);

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

    return () => {
      ro?.disconnect();
      game.destroy(true);
      gameRef.current = null;
    };
  }, [stableOnInteract]);

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden rounded-lg border-4 border-neutral-800 bg-[#fbfbf9] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
      <div ref={containerRef} className="absolute inset-0 outline-none" />
      <MobileGameControls visible={!isPaused} />
    </div>
  );
}
