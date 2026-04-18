import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { getGameConfig } from '../game/config';
import { OverworldScene } from '../game/OverworldScene';

interface GameProps {
  onInteract: (area: string) => void;
  isPaused: boolean;
}

export default function Game({ onInteract, isPaused }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // Update interaction callback when it changes
  useEffect(() => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('MainScene') as OverworldScene;
      if (scene) {
        scene.updateInteractCallback(onInteract);
      }
    }
  }, [onInteract]);

  // Handle pause state changes
  useEffect(() => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('MainScene') as OverworldScene;
      if (scene) {
        scene.setPaused(isPaused);
      }
    }
  }, [isPaused]);

  // Initialize Phaser game
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config = getGameConfig(containerRef.current);
    
    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Add and start the scene manually with initialization data
    game.scene.add('MainScene', OverworldScene, true, { onInteract, isPaused });

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="w-full h-full flex justify-center items-center rounded-lg overflow-hidden border-4 border-neutral-800 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] bg-[#fbfbf9]">
      <div ref={containerRef} className="w-[1000px] h-[600px] outline-none" />
    </div>
  );
}
