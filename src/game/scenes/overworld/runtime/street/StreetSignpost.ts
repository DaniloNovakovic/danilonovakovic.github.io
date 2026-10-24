/**
 * StreetSignpost — hand-drawn START sign that reads out the next step of the
 * street secret chain. Gameplay (which hint, how many secrets) comes from the
 * Game Console `signpost_read` event; this module only draws and types it.
 */
import * as Phaser from 'phaser';
import type { OverworldProgressStage } from '@/game/core/console';
import { getMessages } from '@/shared/i18n';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import {
  startTypewriterEffect,
  type TypewriterEffectHandle
} from '@/game/sharedSceneRuntime/text/typewriterEffect';

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;
const GROUND_Y = 550;
const BOARD_Y = 462;
const BUBBLE_MIN_X = 150;
const BUBBLE_Y = 372;
const BUBBLE_VISIBLE_MS = 4500;
const BUBBLE_DISMISS_DISTANCE_PX = 260;
const TYPEWRITER_CHAR_MS = 22;

/** Survives scene restarts so the "!" only reappears when the hint changes. */
let lastReadStage: OverworldProgressStage | null = null;

export class StreetSignpost {
  private readonly bubble: Phaser.GameObjects.Text;
  private readonly news: Phaser.GameObjects.Text;
  private readonly bubbleFrame: Phaser.GameObjects.Graphics;
  private typewriter?: TypewriterEffectHandle;
  private hideTimer?: Phaser.Time.TimerEvent;
  private readonly scene: Phaser.Scene;
  private readonly x: number;

  constructor(scene: Phaser.Scene, x: number) {
    this.scene = scene;
    this.x = x;
    this.drawSign();
    this.news = createUiText(scene, x + 30, BOARD_Y - 42, '!', {
      fontSize: '24px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    })
      .setOrigin(0.5)
      .setDepth(19);
    this.bubble = createUiText(scene, Math.max(x, BUBBLE_MIN_X), BUBBLE_Y, '', {
      fontSize: '13px',
      color: '#1a1a1a',
      padding: { x: 10, y: 7 },
      wordWrap: { width: 250 },
      align: 'center'
    })
      .setOrigin(0.5, 1)
      .setDepth(30)
      .setVisible(false);
    this.bubbleFrame = scene.add.graphics().setDepth(29);
  }

  /** Called every frame with the current chain stage to drive the unread "!" marker. */
  update(
    stage: OverworldProgressStage,
    tick: number,
    playerX: number,
    promptShowing: boolean,
    motion: boolean
  ): void {
    const unread = stage !== lastReadStage && !promptShowing;
    this.news.setVisible(unread);
    if (unread) {
      const bob = motion && tick % 6 < 3 ? -4 : 0;
      this.news.setY(BOARD_Y - 42 + bob);
    }
    if (this.bubble.visible && Math.abs(playerX - this.x) > BUBBLE_DISMISS_DISTANCE_PX) {
      this.hide();
    }
  }

  read(stage: OverworldProgressStage, found: number, total: number): void {
    const copy = getMessages().scenes.overworld;
    lastReadStage = stage;
    this.clearTimers();
    const text = `${copy.signpostHints[stage]}\n${copy.signpostTally(found, total)}`;
    this.bubble.setText(text);
    this.drawBubbleFrame();
    this.typewriter = startTypewriterEffect(this.scene, this.bubble, text, {
      charDelayMs: TYPEWRITER_CHAR_MS,
      onComplete: () => {
        this.typewriter = undefined;
        this.hideTimer = this.scene.time.delayedCall(BUBBLE_VISIBLE_MS, () => this.hide());
      }
    });
  }

  hide(): void {
    this.clearTimers();
    this.bubble.setVisible(false);
    this.bubbleFrame.clear();
  }

  /** Paper-cutout panel sized to the full hint, with a tail pointing at the board. */
  private drawBubbleFrame(): void {
    const g = this.bubbleFrame;
    const { width, height } = this.bubble;
    const left = this.bubble.x - width / 2;
    const top = this.bubble.y - height;
    const tailX = this.x + 6;
    const bottom = this.bubble.y;
    g.clear();
    g.fillStyle(INK, 1);
    g.fillRect(left + 5, top + 5, width, height);
    g.fillStyle(PAPER, 1);
    g.fillRect(left, top, width, height);
    g.lineStyle(3, INK, 1);
    g.strokeRect(left, top, width, height);
    g.fillTriangle(tailX - 8, bottom - 1, tailX + 8, bottom - 1, tailX - 2, bottom + 14);
    g.lineBetween(tailX - 8, bottom, tailX - 2, bottom + 14);
    g.lineBetween(tailX + 8, bottom, tailX - 2, bottom + 14);
  }

  private clearTimers(): void {
    this.typewriter?.cancel();
    this.typewriter = undefined;
    this.hideTimer?.destroy();
    this.hideTimer = undefined;
  }

  private drawSign(): void {
    const { x } = this;
    const g = this.scene.add.graphics();
    g.lineStyle(4, INK, 1);
    g.lineBetween(x, GROUND_Y, x - 1, BOARD_Y - 16);

    // Arrow-shaped board pointing down the street.
    g.fillStyle(PAPER, 1);
    g.lineStyle(3, INK, 1);
    g.beginPath();
    g.moveTo(x - 30, BOARD_Y - 15);
    g.lineTo(x + 26, BOARD_Y - 16);
    g.lineTo(x + 40, BOARD_Y);
    g.lineTo(x + 26, BOARD_Y + 15);
    g.lineTo(x - 30, BOARD_Y + 14);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.lineStyle(1, INK, 0.35);
    g.lineBetween(x - 26, BOARD_Y + 9, x + 20, BOARD_Y + 10);

    createUiText(this.scene, x + 2, BOARD_Y, getMessages().scenes.overworld.signpostLabel, {
      fontSize: '13px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }
}
