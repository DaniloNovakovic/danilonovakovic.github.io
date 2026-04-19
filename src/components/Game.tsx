import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { PHASER_SCENE_KEYS } from '../config/featureIds';
import { getGameConfig } from '../game/config';
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

export default function Game({ onInteract, isPaused, activeMiniGameId, onClose }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

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
      game.destroy(true);
      gameRef.current = null;
    };
    // Phaser Game mounts once; callbacks are refreshed by the other effects above.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional single mount
  }, []);

  return (
    <div className="w-full h-full flex justify-center items-center rounded-lg overflow-hidden border-4 border-neutral-800 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] bg-[#fbfbf9]">
      <div ref={containerRef} className="w-[1000px] h-[600px] outline-none" />
    </div>
  );
}
