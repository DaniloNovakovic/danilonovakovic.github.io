import type * as Phaser from 'phaser';
import type { RidgeEmotion } from '@/game/core/ridge';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { DEPTH, INK, INK_CSS, PAPER } from './palette';

/** Comic marks that pop over a speaker's head; neutral lines get none. */
const EMOTE_GLYPH: Partial<Record<RidgeEmotion, string>> = {
  surprised: '!',
  curious: '?',
  thoughtful: '…',
  playful: '♪',
  sleepy: 'z',
  determined: '!!'
};

export function emoteGlyphFor(emotion: RidgeEmotion | null | undefined): string | null {
  return (emotion && EMOTE_GLYPH[emotion]) ?? null;
}

const POP_MS = 260;
const RADIUS = 15;

/**
 * One reusable mark. It redraws only when the glyph changes; the pop is a
 * scale transform driven from the provider's sync, so it needs no tween.
 */
export class EmoteMark {
  private readonly container: Phaser.GameObjects.Container;
  private readonly chip: Phaser.GameObjects.Graphics;
  private readonly glyph: Phaser.GameObjects.Text;
  private glyphKey = '';

  constructor(scene: Phaser.Scene) {
    this.chip = scene.add.graphics();
    this.glyph = createUiText(scene, 0, -RADIUS - 1, '', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: INK_CSS
    }).setOrigin(0.5, 0.5);

    this.container = scene.add.container(0, 0, [this.chip, this.glyph]).setDepth(DEPTH.presence).setVisible(false);
  }

  /**
   * @param elapsed ms since the line started, for the pop-in.
   * @param motion false under reduced-motion: the mark appears at rest.
   */
  show(glyph: string, x: number, y: number, elapsed: number, motion: boolean): void {
    if (glyph !== this.glyphKey) {
      this.glyphKey = glyph;
      this.glyph.setText(glyph);
      this.drawChip();
    }

    this.container.setPosition(Math.round(x), Math.round(y));
    this.container.setScale(motion ? popScale(elapsed) : 1);
    this.container.setVisible(true);
  }

  hide(): void {
    this.container.setVisible(false);
  }

  destroy(): void {
    this.container.destroy();
  }

  private drawChip(): void {
    const g = this.chip;
    const cy = -RADIUS - 1;
    g.clear();
    g.fillStyle(INK, 0.3);
    g.fillCircle(3, cy + 3, RADIUS);
    g.fillStyle(PAPER, 1);
    g.fillCircle(0, cy, RADIUS);
    g.lineStyle(2.4, INK, 1);
    g.strokeCircle(0, cy, RADIUS);
    // Tail toward the head below.
    g.fillStyle(PAPER, 1);
    g.fillTriangle(-5, cy + RADIUS - 3, 5, cy + RADIUS - 3, 0, cy + RADIUS + 7);
    g.lineBetween(-5, cy + RADIUS - 1, 0, cy + RADIUS + 7);
    g.lineBetween(5, cy + RADIUS - 1, 0, cy + RADIUS + 7);
  }
}

/** Overshooting pop: 0 → 1.2 → 1 over {@link POP_MS}. */
function popScale(elapsed: number): number {
  if (elapsed >= POP_MS) return 1;
  const t = Math.max(0, elapsed) / POP_MS;
  return t < 0.6 ? (t / 0.6) * 1.2 : 1.2 - ((t - 0.6) / 0.4) * 0.2;
}
