/**
 * StreetSignpost — hand-drawn START sign with an unread "!" marker. The hint
 * itself is read out in the street conversation box; gameplay (which hint, how
 * many secrets) comes from the Game Console `signpost_read` event.
 */
import * as Phaser from 'phaser';
import type { OverworldProgressStage } from '@/game/core/console';
import { getMessages } from '@/shared/i18n';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;
const GROUND_Y = 550;
const BOARD_Y = 462;

/** Survives scene restarts so the "!" only reappears when the hint changes. */
let lastReadStage: OverworldProgressStage | null = null;

export class StreetSignpost {
  private readonly news: Phaser.GameObjects.Text;
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
  }

  /** Called every frame with the current chain stage to drive the unread "!" marker. */
  update(
    stage: OverworldProgressStage,
    tick: number,
    promptShowing: boolean,
    motion: boolean
  ): void {
    const unread = stage !== lastReadStage && !promptShowing;
    this.news.setVisible(unread);
    if (unread) {
      const bob = motion && tick % 6 < 3 ? -4 : 0;
      this.news.setY(BOARD_Y - 42 + bob);
    }
  }

  /** The hint was read; the "!" waits for the next stage. */
  markRead(stage: OverworldProgressStage): void {
    lastReadStage = stage;
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
