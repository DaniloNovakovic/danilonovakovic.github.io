import * as Phaser from 'phaser';
import { clampStampedePosition } from './movement';
import type { StampedeSessionPhase } from './session';

interface StampedeFeedbackRuntimeOptions {
  scene: Phaser.Scene;
}

export interface StampedeFeedbackRuntime {
  showContact(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    candidate: { x: number; y: number } | null
  ): void;
  announceTerminal(
    phase: StampedeSessionPhase,
    player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ): void;
}

export function createStampedeFeedbackRuntime(
  options: StampedeFeedbackRuntimeOptions
): StampedeFeedbackRuntime {
  return new PhaserStampedeFeedbackRuntime(options.scene);
}

class PhaserStampedeFeedbackRuntime implements StampedeFeedbackRuntime {
  private readonly scene: Phaser.Scene;
  private lastAnnouncedPhase?: StampedeSessionPhase;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  showContact(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    candidate: { x: number; y: number } | null
  ): void {
    if (candidate) {
      const dx = player.x - candidate.x;
      const dy = player.y - candidate.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const clamped = clampStampedePosition({
        x: player.x + (dx / distance) * 14,
        y: player.y + (dy / distance) * 14
      });
      player.setPosition(clamped.x, clamped.y);
    }

    this.scene.cameras.main.shake(90, 0.0025);
    this.scene.tweens.killTweensOf(player);
    player.setAlpha(0.52);
    this.scene.tweens.add({
      targets: player,
      alpha: 1,
      duration: 220,
      ease: 'Sine.easeOut'
    });
  }

  announceTerminal(
    phase: StampedeSessionPhase,
    player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ): void {
    if (phase === 'playing') return;
    if (this.lastAnnouncedPhase === phase) return;

    this.lastAnnouncedPhase = phase;
    if (phase === 'failed') {
      this.scene.cameras.main.shake(140, 0.003);
      return;
    }

    if (!player) return;
    this.scene.tweens.add({
      targets: player,
      scale: 0.9,
      yoyo: true,
      duration: 120,
      ease: 'Sine.easeOut'
    });
  }
}
