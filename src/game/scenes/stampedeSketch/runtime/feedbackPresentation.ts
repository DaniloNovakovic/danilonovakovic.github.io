import * as Phaser from 'phaser';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
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
  reset(): void;
}

export function createStampedeFeedbackRuntime(
  options: StampedeFeedbackRuntimeOptions
): StampedeFeedbackRuntime {
  return new PhaserStampedeFeedbackRuntime(options.scene);
}

const PECK_LINES = ['peck!', 'mine!', 'ooh!'] as const;

class PhaserStampedeFeedbackRuntime implements StampedeFeedbackRuntime {
  private readonly scene: Phaser.Scene;
  private readonly peeps: Phaser.GameObjects.Text[];
  private peepCursor = 0;
  private lastAnnouncedPhase?: StampedeSessionPhase;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.peeps = PECK_LINES.map(() =>
      createUiText(scene, 0, 0, '', {
        fontSize: '14px',
        color: '#1a1a1a',
        backgroundColor: '#fbfbf9',
        padding: { x: 4, y: 1 }
      }).setOrigin(0.5).setDepth(40).setVisible(false)
    );
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
    this.popPeep(player.x, player.y - 28);
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

  reset(): void {
    this.lastAnnouncedPhase = undefined;
    this.peeps.forEach((peep) => {
      this.scene.tweens.killTweensOf(peep);
      peep.setVisible(false);
    });
  }

  private popPeep(x: number, y: number): void {
    const peep = this.peeps[this.peepCursor];
    if (!peep) return;
    this.scene.tweens.killTweensOf(peep);
    peep.setText(PECK_LINES[this.peepCursor] ?? 'peck!').setPosition(x, y).setAlpha(1).setVisible(true);
    this.peepCursor = (this.peepCursor + 1) % this.peeps.length;
    this.scene.tweens.add({
      targets: peep,
      y: y - 18,
      alpha: 0,
      duration: 420,
      ease: 'Sine.easeOut',
      onComplete: () => peep.setVisible(false)
    });
  }
}
