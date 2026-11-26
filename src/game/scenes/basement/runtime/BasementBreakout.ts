/**
 * BasementBreakout — Out of Bounds, Act 3 step 1 (#162): the damage laid over
 * the den once the simulation is broken. Someone has been looking for Danilo:
 * papers on the floor, claw marks on the bricks, a WANTED poster and red
 * circles scrawled around his things. In the right wall, the torn hole the
 * blank page broke in through, scribbled shut behind him.
 *
 * Alert red marks danger only and is always paired with chalk/ink strokes or
 * words (src/game/sharedSceneRuntime/escapeAlert.ts). Nothing flashes; under
 * reduced motion the breach is shown already shut. The desk, corkboard and
 * shelf are knocked over by BasementDen itself (its `ransacked` option).
 */
import * as Phaser from 'phaser';
import { BASEMENT_BREACH_X, BASEMENT_WANTED_SCRAWL, getBasementSpot } from '@/game/core/console';
import { GAME_DESIGN_WIDTH } from '@/game/sharedSceneRuntime/config';
import {
  ALERT_RED,
  ALERT_RED_CSS,
  ALERT_TEXT_MIN_PX,
  strokeAlertScribble
} from '@/game/sharedSceneRuntime/escapeAlert';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';

const CHALK = 0xfbfbf9;
const INK = 0x1a1a1a;
/** The blank page showing through the torn wall: the Hobbies void's paper. */
const VOID_PAPER = 0xf4f1ea;
const FLOOR_Y = 500;

const BREACH_TOP = 290;
const BREACH_HALF_WIDTH = 34;
const SCRIBBLE_STROKES = 30;
const SCRIBBLE_DRAW_MS = 650;
const PAPER_COUNT = 16;

/** Small deterministic PRNG so the mess is the same on every visit. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export class BasementBreakout {
  private readonly scene: Phaser.Scene;
  private readonly scribble: Phaser.GameObjects.Graphics;
  private readonly scribbleStrokes: readonly Phaser.Math.Vector2[][];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Behind the furniture: the wall damage, the breach and the poster.
    const wall = scene.add.graphics().setDepth(1);
    this.drawClawMarks(wall);
    this.drawBreach(wall);
    this.drawWantedPoster(wall);
    this.scribbleStrokes = this.planScribble();
    this.scribble = scene.add.graphics().setDepth(1);
    // In front of the furniture: papers on the floor and the scrawled circles.
    const mess = scene.add.graphics().setDepth(6);
    this.drawPapers(mess);
    const pc = getBasementSpot('computer');
    this.circleThing(mess, { x: pc.x, y: pc.y - 10, width: 92 }, { dx: 72, dy: -72, text: 'his PC', tilt: -0.08 });
    // Label off to the left, clear of the blueprint and of Danilo's thoughts by the breach.
    const bench = getBasementSpot('workbench');
    this.circleThing(
      mess,
      { x: bench.x, y: FLOOR_Y - 64, width: 104 },
      { dx: -132, dy: -76, text: 'his bench', tilt: 0.06 }
    );
  }

  /** How a visit that came down the ladder finds the breach: already shut. */
  showSealed(): void {
    this.drawScribble(this.scribbleStrokes.length);
  }

  /** The player just came through: the page scribbles itself shut behind him. */
  sealBehind(motion: boolean): void {
    if (!motion) {
      this.showSealed();
      return;
    }
    this.scene.tweens.addCounter({
      from: 0,
      to: this.scribbleStrokes.length,
      delay: 250,
      duration: SCRIBBLE_DRAW_MS,
      onUpdate: (tween) => this.drawScribble(Math.round(tween.getValue() ?? 0))
    });
  }

  private breachOutline(): Phaser.Math.Vector2[] {
    const random = seeded(162);
    const points: Phaser.Math.Vector2[] = [];
    for (let y = BREACH_TOP; y <= FLOOR_Y; y += 16) {
      points.push(new Phaser.Math.Vector2(BASEMENT_BREACH_X - BREACH_HALF_WIDTH + random() * 14, y));
    }
    // The tear runs off the right edge of the view.
    points.push(new Phaser.Math.Vector2(GAME_DESIGN_WIDTH + 4, FLOOR_Y));
    points.push(new Phaser.Math.Vector2(GAME_DESIGN_WIDTH + 4, BREACH_TOP - 20));
    return points;
  }

  /** A ragged hole torn in the bricks with the blank page behind it. */
  private drawBreach(g: Phaser.GameObjects.Graphics): void {
    const outline = this.breachOutline();
    g.fillStyle(VOID_PAPER, 1);
    g.fillPoints(outline, true);
    g.lineStyle(3, CHALK, 0.9);
    g.strokePoints(outline.slice(0, -2));
    // Cracks spreading from the tear into the bricks.
    g.lineStyle(1.5, CHALK, 0.45);
    const x = BASEMENT_BREACH_X - BREACH_HALF_WIDTH;
    g.lineBetween(x, BREACH_TOP + 10, x - 36, BREACH_TOP - 24);
    g.lineBetween(x - 36, BREACH_TOP - 24, x - 44, BREACH_TOP - 58);
    g.lineBetween(x + 4, BREACH_TOP + 120, x - 40, BREACH_TOP + 136);
    g.lineBetween(x + 2, FLOOR_Y - 30, x - 30, FLOOR_Y - 6);
    // Brick chunks on the floor below.
    g.fillStyle(CHALK, 0.35);
    g.fillRect(x - 28, FLOOR_Y - 6, 10, 6);
    g.fillRect(x - 50, FLOOR_Y - 4, 7, 4);
    g.fillRect(x - 12, FLOOR_Y - 5, 6, 5);
  }

  /** Ink zig-zags across the hole, every third a heavy alert-red stroke. */
  private planScribble(): Phaser.Math.Vector2[][] {
    const random = seeded(1620);
    const strokes: Phaser.Math.Vector2[][] = [];
    const left = BASEMENT_BREACH_X - BREACH_HALF_WIDTH + 4;
    const right = GAME_DESIGN_WIDTH;
    for (let i = 0; i < SCRIBBLE_STROKES; i += 1) {
      const y0 = BREACH_TOP + random() * (FLOOR_Y - BREACH_TOP - 30);
      const y1 = Math.min(FLOOR_Y, y0 + 40 + random() * 90);
      const points: Phaser.Math.Vector2[] = [];
      for (let y = y0, flip = random() < 0.5; y <= y1; y += 8 + random() * 7, flip = !flip) {
        points.push(new Phaser.Math.Vector2(flip ? left + random() * 8 : right - random() * 8, y));
      }
      strokes.push(points);
    }
    return strokes;
  }

  private drawScribble(count: number): void {
    strokeAlertScribble(this.scribble.clear(), this.scribbleStrokes.slice(0, count), { color: INK, alpha: 0.9 });
  }

  /** Three-line claw slashes on the bricks, one set traced through in red. */
  private drawClawMarks(g: Phaser.GameObjects.Graphics): void {
    const marks: readonly { x: number; y: number; red: boolean }[] = [
      { x: 168, y: 120, red: false },
      { x: 330, y: 200, red: true },
      { x: 860, y: 110, red: false },
      { x: 560, y: 330, red: true }
    ];
    for (const { x, y, red } of marks) {
      for (let i = 0; i < 3; i += 1) {
        const dx = i * 14;
        g.lineStyle(4, CHALK, 0.55);
        g.lineBetween(x + dx, y, x + dx + 34, y + 62);
        if (red) {
          g.lineStyle(1.5, ALERT_RED, 0.95);
          g.lineBetween(x + dx + 2, y + 4, x + dx + 32, y + 58);
        }
      }
    }
  }

  /** A WANTED sheet taped to the wall: a quick sketch of Danilo, circled in red. */
  private drawWantedPoster(g: Phaser.GameObjects.Graphics): void {
    const cx = 690;
    const top = 104;
    const w = 84;
    const h = 104;
    g.fillStyle(CHALK, 0.9);
    g.fillRect(cx - w / 2, top, w, h);
    g.lineStyle(2, CHALK, 1);
    g.strokeRect(cx - w / 2, top, w, h);
    // Tape.
    g.fillStyle(CHALK, 0.5);
    g.fillRect(cx - 12, top - 6, 24, 10);
    // The face: head, glasses, shoulders, in ink.
    g.lineStyle(2, INK, 0.9);
    g.strokeCircle(cx, top + 52, 15);
    g.strokeCircle(cx - 6, top + 50, 4);
    g.strokeCircle(cx + 6, top + 50, 4);
    g.lineBetween(cx - 2, top + 50, cx + 2, top + 50);
    g.lineBetween(cx - 22, top + 92, cx - 14, top + 72);
    g.lineBetween(cx + 22, top + 92, cx + 14, top + 72);
    // Hatching behind the face so the red loop isn't carrying it alone.
    g.lineStyle(1, INK, 0.35);
    for (let i = 0; i < 6; i += 1) g.lineBetween(cx - 34 + i * 6, top + 96, cx - 26 + i * 6, top + 82);
    g.lineStyle(2.5, ALERT_RED, 0.95);
    g.strokeEllipse(cx + 1, top + 56, 50, 54);
    g.strokeEllipse(cx - 1, top + 54, 46, 50);
    createUiText(this.scene, cx, top + 16, BASEMENT_WANTED_SCRAWL, {
      fontSize: `${ALERT_TEXT_MIN_PX}px`,
      fontStyle: 'bold',
      color: ALERT_RED_CSS
    })
      .setOrigin(0.5)
      .setRotation(-0.05)
      .setDepth(1);
  }

  /** Papers dumped from the desk and board, all over the floor. */
  private drawPapers(g: Phaser.GameObjects.Graphics): void {
    const random = seeded(7);
    for (let i = 0; i < PAPER_COUNT; i += 1) {
      const x = 150 + random() * 780;
      const y = FLOOR_Y + 6 + random() * 46;
      const angle = (random() - 0.5) * 1.4;
      const w = 18 + random() * 10;
      const h = 12 + random() * 6;
      const corners = [
        [-w / 2, -h / 2],
        [w / 2, -h / 2],
        [w / 2, h / 2],
        [-w / 2, h / 2]
      ].map(
        ([dx, dy]) =>
          new Phaser.Math.Vector2(
            x + dx * Math.cos(angle) - dy * Math.sin(angle),
            y + dx * Math.sin(angle) + dy * Math.cos(angle)
          )
      );
      g.fillStyle(CHALK, 0.72);
      g.fillPoints(corners, true);
      g.lineStyle(1, CHALK, 0.95);
      g.strokePoints(corners, true);
      // Scribbled lines of writing on each sheet.
      g.lineStyle(1, INK, 0.5);
      const [a, b] = corners;
      if (a && b) g.lineBetween(a.x + (b.x - a.x) * 0.2, a.y + 5, a.x + (b.x - a.x) * 0.8, b.y + 5);
    }
  }

  /** A loose red loop around one of his things, with who it belongs to scrawled beside it. */
  private circleThing(
    g: Phaser.GameObjects.Graphics,
    { x, y, width }: { x: number; y: number; width: number },
    label: { dx: number; dy: number; text: string; tilt: number }
  ): void {
    g.lineStyle(3, ALERT_RED, 0.9);
    g.strokeEllipse(x, y, width * 2, width * 1.45);
    g.lineStyle(2, ALERT_RED, 0.7);
    g.strokeEllipse(x + 4, y - 3, width * 2 - 10, width * 1.45 - 6);
    const text = createUiText(this.scene, x + label.dx, y + label.dy, label.text, {
      fontSize: `${ALERT_TEXT_MIN_PX}px`,
      fontStyle: 'bold',
      color: ALERT_RED_CSS,
      backgroundColor: '#151515',
      padding: { x: 3, y: 1 }
    })
      .setOrigin(0.5)
      .setRotation(label.tilt)
      .setDepth(6);
    // Chalk underline, so the scrawl reads without its colour.
    g.lineStyle(1.5, CHALK, 0.8);
    g.lineBetween(
      text.x - text.width / 2,
      text.y + text.height / 2 + 1,
      text.x + text.width / 2,
      text.y + text.height / 2 + 3
    );
  }
}
