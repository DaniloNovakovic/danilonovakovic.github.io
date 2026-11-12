import * as Phaser from 'phaser';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { STAMPEDE_JOKE_BUBBLE_MS } from './dadJoke';

export interface StampedeJokeLook {
  tell(line: string, origin: { x: number; y: number }, radius: number): void;
  stamp(text: string, at: { x: number; y: number }): void;
  follow(player: { x: number; y: number }): void;
  reset(): void;
}

const INK = 0x1a1a1a;
const RING_MS = 420;
const RING_SEGMENTS = 22;

export function createStampedeJokeLook(scene: Phaser.Scene): StampedeJokeLook {
  return new PhaserStampedeJokeLook(scene);
}

class PhaserStampedeJokeLook implements StampedeJokeLook {
  private readonly scene: Phaser.Scene;
  private readonly bubble: Phaser.GameObjects.Text;
  private readonly ring: Phaser.GameObjects.Graphics;
  private readonly stampText: Phaser.GameObjects.Text;
  private bubbleUntilMs = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bubble = createUiText(scene, 0, 0, '', {
      fontSize: '14px',
      color: '#1a1a1a',
      fontStyle: 'bold',
      backgroundColor: '#fbfbf9',
      padding: { x: 7, y: 4 },
      align: 'center',
      wordWrap: { width: 220 }
    }).setOrigin(0.5, 1).setDepth(34).setVisible(false);
    this.ring = scene.add.graphics().setDepth(18).setVisible(false);
    this.stampText = createUiText(scene, 0, 0, '', {
      fontSize: '26px',
      color: '#c0263b',
      fontStyle: 'bold',
      backgroundColor: '#fbfbf9',
      padding: { x: 8, y: 2 }
    }).setOrigin(0.5).setDepth(35).setVisible(false);
  }

  tell(line: string, origin: { x: number; y: number }, radius: number): void {
    this.bubble.setText(line).setVisible(true).setAlpha(1);
    this.bubbleUntilMs = this.scene.time.now + STAMPEDE_JOKE_BUBBLE_MS;
    this.follow(origin);

    this.scene.tweens.killTweensOf(this.ring);
    const progress = { value: 0 };
    this.ring.setVisible(true).setAlpha(1);
    this.scene.tweens.add({
      targets: progress,
      value: 1,
      duration: RING_MS,
      ease: 'Sine.easeOut',
      onUpdate: () => this.drawRing(origin, radius * progress.value, 1 - progress.value * 0.7),
      onComplete: () => this.ring.clear().setVisible(false)
    });
  }

  stamp(text: string, at: { x: number; y: number }): void {
    this.scene.tweens.killTweensOf(this.stampText);
    this.stampText
      .setText(text)
      .setPosition(at.x, at.y - 96)
      .setVisible(true)
      .setAlpha(1)
      .setScale(0.4)
      .setAngle(-8);
    this.scene.tweens.add({
      targets: this.stampText,
      scale: 1,
      angle: -4,
      duration: 220,
      ease: 'Back.easeOut'
    });
    this.scene.tweens.add({
      targets: this.stampText,
      alpha: 0,
      delay: 900,
      duration: 360,
      onComplete: () => this.stampText.setVisible(false)
    });
  }

  follow(player: { x: number; y: number }): void {
    if (!this.bubble.visible) return;
    if (this.scene.time.now >= this.bubbleUntilMs) {
      this.bubble.setVisible(false);
      return;
    }
    this.bubble.setPosition(player.x, player.y - 46);
  }

  reset(): void {
    [this.ring, this.stampText].forEach((item) => this.scene.tweens.killTweensOf(item));
    this.ring.clear().setVisible(false);
    this.stampText.setVisible(false);
    this.bubble.setVisible(false);
    this.bubbleUntilMs = 0;
  }

  private drawRing(origin: { x: number; y: number }, radius: number, alpha: number): void {
    const g = this.ring.clear();
    g.lineStyle(3, INK, alpha);
    const span = (Math.PI * 2) / RING_SEGMENTS;
    for (let index = 0; index < RING_SEGMENTS; index += 1) {
      g.beginPath();
      g.arc(origin.x, origin.y, radius, index * span, index * span + span * 0.6, false);
      g.strokePath();
    }
  }
}
