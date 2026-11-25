/**
 * HobbiesEscape — Out of Bounds, Act 2 cliffhanger: what the void looks like
 * once the simulation is broken. An ink scribble wall shuts the way back
 * right, the page runs on (rougher) past where the toolbox lay to a torn
 * opening, and when it first happens an alert goes off: a rubber-stamped
 * OUT_OF_BOUNDS, the page edge jittering in pencil, a graphite alarm.
 *
 * Everything reads with sound off. Reduced motion: the stamp and wall appear
 * whole, the edge frame holds still, no shake. Nothing flashes.
 * Geometry and copy come from src/game/core/console/content/outOfBoundsVoid.ts.
 */
import * as Phaser from 'phaser';
import {
  OUT_OF_BOUNDS_ALERT_STAMP,
  OUT_OF_BOUNDS_BARRIER_HALF_WIDTH,
  OUT_OF_BOUNDS_BARRIER_X,
  OUT_OF_BOUNDS_OPENING_X,
  OUT_OF_BOUNDS_TOOLBOX_X
} from '@/game/core/console';
import { HOBBIES_FLOOR_Y, HOBBIES_ROOM_HEIGHT } from '@/game/sharedSceneRuntime/config';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { playNoise } from '../overlays/shared/audioVoices';

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;

/** Scribble strokes in the barrier; revealed a few at a time when it draws itself in. */
const BARRIER_STROKES = 46;
const BARRIER_WIDTH = OUT_OF_BOUNDS_BARRIER_HALF_WIDTH * 2;
const BARRIER_DRAW_MS = 700;
/** How far the scribbled-out page runs past the barrier (off-camera beyond this). */
const SCRIBBLED_OUT_WIDTH = 420;

const STAMP_SLAM_MS = 140;
const STAMP_HOLD_MS = 2600;
const STAMP_FADE_MS = 500;
/** The jittering page edge lasts as long as the stamp. */
const ALERT_MS = STAMP_SLAM_MS + STAMP_HOLD_MS + STAMP_FADE_MS;
/** Jitter redraw cadence: stepped like the sketch clock, never smooth. */
const EDGE_STEP_MS = 110;

const OPENING_WIDTH = 120;
const OPENING_HEIGHT = 250;

/** Small deterministic PRNG so the scribbles look the same on every visit. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export interface HobbiesEscapeFrame {
  time: number;
  motion: boolean;
}

export class HobbiesEscape {
  private readonly scene: Phaser.Scene;
  private readonly getAudioContext: () => AudioContext | null;
  private readonly barrier: Phaser.GameObjects.Graphics;
  private readonly barrierStrokes: readonly Phaser.Math.Vector2[][];
  private readonly landscape: Phaser.GameObjects.Graphics;
  private readonly edge: Phaser.GameObjects.Graphics;
  private alertUntil = 0;
  private lastEdgeStep = -1;

  constructor(scene: Phaser.Scene, getAudioContext: () => AudioContext | null) {
    this.scene = scene;
    this.getAudioContext = getAudioContext;
    this.barrierStrokes = this.planBarrier();
    // Above the void's marks (depth 1), so the hatching scribbles out ROOM_END too.
    this.landscape = scene.add.graphics().setDepth(2).setVisible(false);
    this.drawLandscape(this.landscape);
    this.barrier = scene.add.graphics().setDepth(9).setVisible(false);
    // Screen-space: the page edge, drawn over everything during the alert.
    this.edge = scene.add.graphics().setScrollFactor(0).setDepth(190).setVisible(false);
  }

  /** The broken state, as a return visit finds it: wall up, page open, no alert. */
  showBroken(): void {
    this.landscape.setVisible(true);
    this.drawBarrier(this.barrierStrokes.length);
  }

  /**
   * The alert, once, right after the pickup: stamp, alarm, shake, and the wall
   * scribbling itself in behind the player.
   */
  playAlert(frame: HobbiesEscapeFrame): void {
    this.landscape.setVisible(true);
    this.alertUntil = frame.time + ALERT_MS;
    this.lastEdgeStep = -1;
    this.edge.setVisible(true);
    this.stamp(frame.motion);
    this.playAlarm();
    if (frame.motion) {
      this.scene.cameras.main.shake(280, 0.005);
      this.scene.tweens.addCounter({
        from: 0,
        to: this.barrierStrokes.length,
        duration: BARRIER_DRAW_MS,
        onUpdate: (tween) => this.drawBarrier(Math.round(tween.getValue() ?? 0))
      });
    } else {
      this.drawBarrier(this.barrierStrokes.length);
    }
  }

  update(frame: HobbiesEscapeFrame): void {
    if (!this.edge.visible) return;
    if (frame.time >= this.alertUntil) {
      this.edge.clear().setVisible(false);
      return;
    }
    const step = frame.motion ? Math.floor(frame.time / EDGE_STEP_MS) : 0;
    if (step === this.lastEdgeStep) return;
    this.lastEdgeStep = step;
    this.drawEdge(step);
  }

  /** Zig-zag strokes from ceiling to floor, a little wider at the bottom. */
  private planBarrier(): Phaser.Math.Vector2[][] {
    const random = seeded(149);
    const strokes: Phaser.Math.Vector2[][] = [];
    const top = 40;
    const bottom = HOBBIES_FLOOR_Y + 6;
    for (let i = 0; i < BARRIER_STROKES; i += 1) {
      const y0 = top + random() * (bottom - top);
      const y1 = Math.min(bottom, y0 + 40 + random() * 120);
      const points: Phaser.Math.Vector2[] = [];
      for (let y = y0, flip = random() < 0.5; y <= y1; y += 9 + random() * 8, flip = !flip) {
        const x = OUT_OF_BOUNDS_BARRIER_X + (flip ? -1 : 1) * (BARRIER_WIDTH / 2) * (0.4 + random() * 0.6);
        points.push(new Phaser.Math.Vector2(x, y));
      }
      strokes.push(points);
    }
    return strokes;
  }

  private drawBarrier(count: number): void {
    const g = this.barrier.clear().setVisible(count > 0);
    this.barrierStrokes.slice(0, count).forEach((points, i) => {
      g.lineStyle(i % 3 === 0 ? 3 : 2, INK, 0.85);
      g.strokePoints(points);
    });
  }

  /**
   * What doesn't animate: the page scribbled out beyond the wall, a hurried
   * floor line running on past the toolbox spot, and the torn opening at the
   * far left with an arrow scratched next to it.
   */
  private drawLandscape(g: Phaser.GameObjects.Graphics): void {
    const random = seeded(162);
    // Scribbled-out page past the wall: dense hatching, so "back" is visibly gone.
    const left = OUT_OF_BOUNDS_BARRIER_X + BARRIER_WIDTH / 2 - 10;
    g.lineStyle(1.5, INK, 0.35);
    for (let x = left; x < left + SCRIBBLED_OUT_WIDTH; x += 7) {
      g.lineBetween(x, 30, x + 60, HOBBIES_ROOM_HEIGHT);
    }
    g.lineStyle(1.5, INK, 0.25);
    for (let x = left; x < left + SCRIBBLED_OUT_WIDTH; x += 11) {
      g.lineBetween(x + 60, 30, x, HOBBIES_ROOM_HEIGHT);
    }

    // The floor goes on, drawn in a hurry: broken dashes with a little wobble.
    g.lineStyle(2, INK, 0.45);
    for (let x = OUT_OF_BOUNDS_TOOLBOX_X - 70; x > OUT_OF_BOUNDS_OPENING_X + OPENING_WIDTH / 2;) {
      const length = 26 + random() * 40;
      const wobble = (random() - 0.5) * 3;
      g.lineBetween(x, HOBBIES_FLOOR_Y + wobble, x - length, HOBBIES_FLOOR_Y - wobble);
      x -= length + 10 + random() * 18;
    }

    this.drawOpening(g, random);
  }

  /** A ragged tear in the page with darkness behind it: the way on. */
  private drawOpening(g: Phaser.GameObjects.Graphics, random: () => number): void {
    const cx = OUT_OF_BOUNDS_OPENING_X;
    const top = HOBBIES_FLOOR_Y - OPENING_HEIGHT;
    const points: Phaser.Math.Vector2[] = [];
    // Right edge down, then the left edge back up, both torn.
    for (let y = top; y <= HOBBIES_FLOOR_Y; y += 18) {
      points.push(new Phaser.Math.Vector2(cx + OPENING_WIDTH / 2 - random() * 16, y));
    }
    for (let y = HOBBIES_FLOOR_Y; y >= top; y -= 18) {
      points.push(new Phaser.Math.Vector2(cx - OPENING_WIDTH / 2 + random() * 16, y));
    }
    g.fillStyle(INK, 0.92);
    g.fillPoints(points, true);
    g.lineStyle(2, INK, 1);
    g.strokePoints(points, true);
    // Paper curling at the tear's top.
    g.fillStyle(PAPER, 1);
    g.fillTriangle(cx - 30, top + 4, cx + 10, top + 4, cx - 18, top + 30);
    g.lineStyle(1.5, INK, 0.8);
    g.strokeTriangle(cx - 30, top + 4, cx + 10, top + 4, cx - 18, top + 30);

    // A scratched arrow pointing in.
    const ay = top - 40;
    g.lineStyle(3, INK, 0.8);
    g.lineBetween(cx + 120, ay, cx + 20, ay + 6);
    g.lineBetween(cx + 20, ay + 6, cx + 40, ay - 8);
    g.lineBetween(cx + 20, ay + 6, cx + 42, ay + 18);
  }

  /** OUT_OF_BOUNDS slammed across the top of the view like a rubber stamp. */
  private stamp(motion: boolean): void {
    const camera = this.scene.cameras.main;
    // Screen-space objects still scale with zoom about the view's centre; undo that.
    const zoom = camera.zoom || 1;
    const x = camera.width / 2;
    const y = camera.height / 2 - (camera.height * 0.24) / zoom;
    const text = createUiText(this.scene, 0, 0, OUT_OF_BOUNDS_ALERT_STAMP, {
      fontSize: '44px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#1a1a1a'
    }).setOrigin(0.5);
    const box = this.scene.add.graphics();
    const w = text.width + 40;
    const h = text.height + 22;
    box.fillStyle(PAPER, 0.92);
    box.fillRect(-w / 2, -h / 2, w, h);
    box.lineStyle(5, INK, 1);
    box.strokeRect(-w / 2, -h / 2, w, h);
    box.lineStyle(2, INK, 1);
    box.strokeRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14);
    const stamp = this.scene.add
      .container(x, y, [box, text])
      .setScrollFactor(0)
      .setDepth(200)
      .setRotation(-0.07)
      .setScale(1 / zoom);
    if (motion) {
      stamp.setScale(1.7 / zoom).setAlpha(0);
      this.scene.tweens.add({
        targets: stamp,
        scale: 1 / zoom,
        alpha: 1,
        duration: STAMP_SLAM_MS,
        ease: 'Quad.easeIn'
      });
    }
    this.scene.tweens.add({
      targets: stamp,
      alpha: 0,
      delay: STAMP_SLAM_MS + STAMP_HOLD_MS,
      duration: STAMP_FADE_MS,
      onComplete: () => stamp.destroy()
    });
  }

  /** The view's border as a shaky pencil line, re-scribbled every step. */
  private drawEdge(step: number): void {
    const camera = this.scene.cameras.main;
    const zoom = camera.zoom || 1;
    const halfW = camera.width / 2 / zoom;
    const halfH = camera.height / 2 / zoom;
    const cx = camera.width / 2;
    const cy = camera.height / 2;
    const random = seeded(1000 + step);
    const g = this.edge.clear();
    const inset = 10 / zoom;
    const amp = 6 / zoom;
    const corners = [
      [cx - halfW + inset, cy - halfH + inset],
      [cx + halfW - inset, cy - halfH + inset],
      [cx + halfW - inset, cy + halfH - inset],
      [cx - halfW + inset, cy + halfH - inset]
    ] as const;
    for (const pass of [0, 1]) {
      g.lineStyle((pass === 0 ? 4 : 2) / zoom, INK, pass === 0 ? 0.8 : 0.45);
      g.beginPath();
      corners.forEach(([x0, y0], i) => {
        const [x1, y1] = corners[(i + 1) % corners.length] ?? corners[0];
        if (i === 0) g.moveTo(x0, y0);
        const segments = 14;
        for (let s = 1; s <= segments; s += 1) {
          const t = s / segments;
          const jitter = (random() - 0.5) * 2 * amp;
          const horizontal = y0 === y1;
          g.lineTo(x0 + (x1 - x0) * t + (horizontal ? 0 : jitter), y0 + (y1 - y0) * t + (horizontal ? jitter : 0));
        }
      });
      g.closePath();
      g.strokePath();
    }
  }

  /** A graphite alarm: rough pencil-scratch whoops, high-low, six times. */
  private playAlarm(): void {
    const context = this.getAudioContext();
    if (!context || context.state !== 'running') return;
    const now = context.currentTime;
    for (let i = 0; i < 6; i += 1) {
      playNoise(context, {
        at: now + i * 0.24,
        filter: 'bandpass',
        filterFrequency: i % 2 === 0 ? 1900 : 1300,
        q: 6,
        gain: 0.09,
        duration: 0.17
      });
    }
  }
}
