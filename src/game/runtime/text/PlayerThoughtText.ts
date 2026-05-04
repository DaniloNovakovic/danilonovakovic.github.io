import * as Phaser from 'phaser';
import { createUiText } from './createUiText';
import { startTypewriterEffect, type TypewriterEffectHandle } from './typewriterEffect';

interface PlayerThoughtTextOptions {
  target: Phaser.GameObjects.Components.Transform;
  offsetY?: number;
  visibleMs?: number;
  charDelayMs?: number;
}

const DEFAULT_OFFSET_Y = -92;
const DEFAULT_VISIBLE_MS = 1800;
const DEFAULT_CHAR_DELAY_MS = 34;

export class PlayerThoughtText {
  private readonly scene: Phaser.Scene;
  private readonly target: Phaser.GameObjects.Components.Transform;
  private readonly offsetY: number;
  private readonly visibleMs: number;
  private readonly charDelayMs: number;
  private readonly text: Phaser.GameObjects.Text;
  private typewriter?: TypewriterEffectHandle;
  private hideTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, options: PlayerThoughtTextOptions) {
    this.scene = scene;
    this.target = options.target;
    this.offsetY = options.offsetY ?? DEFAULT_OFFSET_Y;
    this.visibleMs = options.visibleMs ?? DEFAULT_VISIBLE_MS;
    this.charDelayMs = options.charDelayMs ?? DEFAULT_CHAR_DELAY_MS;
    this.text = createUiText(scene, this.target.x, this.target.y + this.offsetY, '', {
      fontSize: '15px',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 7, y: 3 },
      wordWrap: { width: 260 }
    })
      .setOrigin(0.5)
      .setDepth(150)
      .setVisible(false);
  }

  show(message: string): void {
    this.clearTimers();
    this.update();
    this.typewriter = startTypewriterEffect(this.scene, this.text, message, {
      charDelayMs: this.charDelayMs,
      onComplete: () => {
        this.typewriter = undefined;
        this.hideTimer = this.scene.time.delayedCall(this.visibleMs, () => {
          this.hide();
        });
      }
    });
  }

  update(): void {
    this.text.setPosition(this.target.x, this.target.y + this.offsetY);
  }

  hide(): void {
    this.clearTimers();
    this.text.setVisible(false);
  }

  destroy(): void {
    this.clearTimers();
    this.text.destroy();
  }

  private clearTimers(): void {
    this.typewriter?.cancel();
    this.typewriter = undefined;
    this.hideTimer?.destroy();
    this.hideTimer = undefined;
  }
}
