import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { PHASER_SCENE_KEYS } from '../config/featureIds';
import { getGameConfig } from '../game/config';
import { mobileTouch, resetMobileTouch } from '../game/mobileTouchBridge';
import { OverworldScene } from '../game/OverworldScene';
import { getAllMiniGames, getMiniGameById } from '../game/miniGameRegistry';
import { isInteractBridgeScene, isPausableScene } from '../game/sceneContracts';
import { MiniGameType } from '../game/types';

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

  useEffect(() => {
    resetMobileTouch();
  }, [activeMiniGameId]);

  // Update interaction callback when it changes
  useEffect(() => {
    if (gameRef.current) {
      const mainScene = gameRef.current.scene.getScene(PHASER_SCENE_KEYS.main) as OverworldScene | null;
      if (mainScene) {
        mainScene.updateInteractCallback(onInteract);
      }

      const hobbiesScene = gameRef.current.scene.getScene(PHASER_SCENE_KEYS.hobbies);
      if (isInteractBridgeScene(hobbiesScene)) {
        hobbiesScene.updateInteractCallback(onInteract);
      }
    }
  }, [onInteract]);

  // Handle pause state changes
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

  // Handle dynamic scene switching
  useEffect(() => {
    if (gameRef.current && activeMiniGameId) {
      const activeMiniGame = getMiniGameById(activeMiniGameId);
      if (activeMiniGame?.type === MiniGameType.PHASER_SCENE) {
        const sceneKey = activeMiniGame.id;
        
        if (!gameRef.current.scene.isActive(sceneKey)) {
          gameRef.current.scene.stop(PHASER_SCENE_KEYS.main);
          gameRef.current.scene.start(sceneKey, { onClose, onInteract, isPaused });
        }
      }
    } else if (gameRef.current && !activeMiniGameId) {
      // Stop all minigame scenes and restart Overworld
      const scenes = gameRef.current.scene.getScenes(false);
      let resetNeeded = false;
      scenes.forEach(s => {
        if (s.scene.key !== PHASER_SCENE_KEYS.main && gameRef.current?.scene.isActive(s.scene.key)) {
          gameRef.current?.scene.stop(s.scene.key);
          resetNeeded = true;
        }
      });
      
      // Only start MainScene if it's not already active or if we just stopped another scene
      if (resetNeeded || !gameRef.current.scene.isActive(PHASER_SCENE_KEYS.main)) {
        gameRef.current.scene.start(PHASER_SCENE_KEYS.main, { onInteract, isPaused });
      }
    }
  }, [activeMiniGameId, onInteract, isPaused, onClose]);

  // Initialize Phaser game
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

    // Add the main scene
    game.scene.add(PHASER_SCENE_KEYS.main, OverworldScene, true, { onInteract, isPaused });

    // Pre-add all Phaser-based scenes from the registry
    const phaserScenes = getAllMiniGames().filter(g => g.type === MiniGameType.PHASER_SCENE && g.Scene);
    phaserScenes.forEach(s => {
      if (s.Scene) {
        game.scene.add(s.id, s.Scene, false);
      }
    });

    return () => {
      ro?.disconnect();
      game.destroy(true);
      gameRef.current = null;
    };
    // Phaser Game mounts once; callbacks are refreshed by the other effects above.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional single mount
  }, []);

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden rounded-lg border-4 border-neutral-800 bg-[#fbfbf9] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
      <div ref={containerRef} className="absolute inset-0 outline-none" />
      <MobileGameControls visible={!isPaused} />
    </div>
  );
}
