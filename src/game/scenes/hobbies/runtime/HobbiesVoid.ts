/**
 * HobbiesVoid — Out of Bounds, Act 1: the unfinished page past the Hobbies
 * room's left wall. Mostly blank paper so it reads as a collision bug, with a
 * few far-apart marks and the empty sketchbook-spine pedestal; Danilo's
 * thoughts and sparse pencil-scratch steps carry the walk.
 * Geometry and copy come from src/game/core/console/content/outOfBoundsVoid.ts.
 */
import * as Phaser from 'phaser';
import {
  HOBBIES_LEFT_WALL_X,
  OUT_OF_BOUNDS_PEDESTAL_X,
  OUT_OF_BOUNDS_SIGHTS,
  OUT_OF_BOUNDS_VOID_LENGTH,
  outOfBoundsDepth,
  outOfBoundsThoughtsReached,
  type OutOfBoundsSightId
} from '@/game/core/console';
import { HOBBIES_FLOOR_Y } from '@/game/sharedSceneRuntime/config';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { playNoise } from '../overlays/shared/audioVoices';

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;
/** World x at `depth` px past the left wall. */
const xAt = (depth: number) => HOBBIES_LEFT_WALL_X - depth;

const THOUGHT_MS = 2600;
const THOUGHT_FADE_MS = 400;
/** Px walked between pencil-scratch steps; grows sparser with depth. */
const SCRATCH_STRIDE_MIN = 120;
const SCRATCH_STRIDE_MAX = 320;

export interface HobbiesVoidFrame {
  playerX: number;
  playerY: number;
  /** Player is on the floor and moving horizontally. */
  walking: boolean;
  time: number;
  motion: boolean;
}

export class HobbiesVoid {
  private readonly scene: Phaser.Scene;
  private readonly glow: Phaser.GameObjects.Graphics;
  private readonly thought: Phaser.GameObjects.Text;
  private readonly getAudioContext: () => AudioContext | null;
  private furthestDepth = 0;
  private thoughtUntil = 0;
  private lastScratchX: number | null = null;
  private lastGlowStep = -1;

  constructor(scene: Phaser.Scene, getAudioContext: () => AudioContext | null) {
    this.scene = scene;
    this.getAudioContext = getAudioContext;
    const g = scene.add.graphics().setDepth(1);
    for (const sight of OUT_OF_BOUNDS_SIGHTS) this.drawSight(g, sight.id, xAt(sight.depth));
    this.glow = scene.add.graphics().setDepth(1);
    this.drawPedestal(scene.add.graphics().setDepth(2));
    this.thought = createUiText(scene, 0, 0, '', {
      fontSize: '15px',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 8, y: 4 },
      fontStyle: 'italic'
    })
      .setOrigin(0.5, 1)
      .setDepth(100)
      .setVisible(false);
  }

  update(frame: HobbiesVoidFrame): void {
    const depth = outOfBoundsDepth(frame.playerX);
    const reached = outOfBoundsThoughtsReached(this.furthestDepth, depth);
    this.furthestDepth = Math.max(this.furthestDepth, depth);
    const latest = reached[reached.length - 1];
    if (latest) this.think(latest, frame);
    this.updateThought(frame);
    this.updateGlow(frame);
    this.updateScratch(frame, depth);
  }

  private think(line: string, frame: HobbiesVoidFrame): void {
    this.scene.tweens.killTweensOf(this.thought);
    this.thought.setText(line).setAlpha(1).setVisible(true);
    this.thoughtUntil = frame.time + THOUGHT_MS;
  }

  private updateThought(frame: HobbiesVoidFrame): void {
    if (!this.thought.visible) return;
    this.thought.setPosition(Math.round(frame.playerX), Math.round(frame.playerY - 70));
    if (frame.time < this.thoughtUntil) return;
    this.thoughtUntil = Number.POSITIVE_INFINITY;
    if (!frame.motion) {
      this.thought.setVisible(false);
      return;
    }
    this.scene.tweens.add({
      targets: this.thought,
      alpha: 0,
      duration: THOUGHT_FADE_MS,
      onComplete: () => this.thought.setVisible(false)
    });
  }

  /** A slow stepped pulse around the pedestal; held still under reduced motion. */
  private updateGlow(frame: HobbiesVoidFrame): void {
    const step = frame.motion ? Math.floor(frame.time / 180) % 12 : 0;
    if (step === this.lastGlowStep) return;
    this.lastGlowStep = step;
    const pulse = frame.motion ? Math.abs(6 - step) / 6 : 0.5;
    const g = this.glow.clear();
    const cx = OUT_OF_BOUNDS_PEDESTAL_X;
    const cy = HOBBIES_FLOOR_Y - 90;
    for (let ring = 0; ring < 4; ring += 1) {
      g.lineStyle(2, INK, (0.05 + pulse * 0.07) * (1 - ring * 0.2));
      g.strokeEllipse(cx, cy, 120 + ring * 26 + pulse * 10, 200 + ring * 26 + pulse * 10);
    }
  }

  /** One graphite scratch every stride of walking in the void, sparser the further you go. */
  private updateScratch(frame: HobbiesVoidFrame, depth: number): void {
    if (depth <= 0 || !frame.walking) {
      this.lastScratchX = null;
      return;
    }
    if (this.lastScratchX === null) {
      this.lastScratchX = frame.playerX;
      return;
    }
    const stride = SCRATCH_STRIDE_MIN + (SCRATCH_STRIDE_MAX - SCRATCH_STRIDE_MIN) * (depth / OUT_OF_BOUNDS_VOID_LENGTH);
    if (Math.abs(frame.playerX - this.lastScratchX) < stride) return;
    this.lastScratchX = frame.playerX;
    const context = this.getAudioContext();
    if (!context || context.state !== 'running') return;
    playNoise(context, {
      filter: 'bandpass',
      filterFrequency: 2600 + Math.random() * 1400,
      q: 1.4,
      gain: 0.05,
      duration: 0.07 + Math.random() * 0.04
    });
  }

  private drawSight(g: Phaser.GameObjects.Graphics, id: OutOfBoundsSightId, x: number): void {
    const draw: Record<OutOfBoundsSightId, (graphics: Phaser.GameObjects.Graphics, at: number) => void> = {
      'todo-scribble': (graphics, at) => this.drawTodoScribble(graphics, at),
      'coffee-ring': (graphics, at) => this.drawCoffeeRing(graphics, at),
      'room-end-label': (graphics, at) => this.drawRoomEndLabel(graphics, at)
    };
    draw[id](g, x);
  }

  private drawTodoScribble(g: Phaser.GameObjects.Graphics, x: number): void {
    createUiText(this.scene, x, 210, 'TODO: fix left wall collision', { fontSize: '18px', color: '#1a1a1a' })
      .setOrigin(0.5)
      .setRotation(-0.12)
      .setAlpha(0.75)
      .setDepth(1);
    g.lineStyle(1.5, INK, 0.5);
    g.lineBetween(x - 118, 236, x + 112, 222);
    // Arrow pointing back toward the room's wall.
    g.lineBetween(x + 122, 214, x + 166, 230);
    g.lineBetween(x + 166, 230, x + 154, 222);
    g.lineBetween(x + 166, 230, x + 156, 236);
  }

  private drawCoffeeRing(g: Phaser.GameObjects.Graphics, x: number): void {
    g.lineStyle(3, INK, 0.12);
    g.strokeEllipse(x, 380, 92, 88);
    g.lineStyle(1.5, INK, 0.2);
    g.strokeEllipse(x + 2, 381, 84, 80);
    g.fillStyle(INK, 0.06);
    g.fillCircle(x + 30, 340, 5);
    g.fillCircle(x - 44, 410, 3);
  }

  private drawRoomEndLabel(g: Phaser.GameObjects.Graphics, x: number): void {
    const w = 150;
    const h = 64;
    const top = 260;
    g.lineStyle(1.5, INK, 0.5);
    for (let dx = 0; dx < w; dx += 14) {
      g.lineBetween(x - w / 2 + dx, top, x - w / 2 + Math.min(w, dx + 8), top);
      g.lineBetween(x - w / 2 + dx, top + h, x - w / 2 + Math.min(w, dx + 8), top + h);
    }
    for (let dy = 0; dy < h; dy += 14) {
      g.lineBetween(x - w / 2, top + dy, x - w / 2, top + Math.min(h, dy + 8));
      g.lineBetween(x + w / 2, top + dy, x + w / 2, top + Math.min(h, dy + 8));
    }
    g.lineStyle(1, INK, 0.25);
    g.lineBetween(x - w / 2, top, x + w / 2, top + h);
    g.lineBetween(x + w / 2, top, x - w / 2, top + h);
    createUiText(this.scene, x, top + h / 2, 'ROOM_END', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 4, y: 1 }
    })
      .setOrigin(0.5)
      .setDepth(1);
  }

  /** A closed sketchbook stood on end, spine out, with an empty dashed slot on top. */
  private drawPedestal(g: Phaser.GameObjects.Graphics): void {
    const cx = OUT_OF_BOUNDS_PEDESTAL_X;
    const w = 64;
    const h = 130;
    const left = cx - w / 2;
    const top = HOBBIES_FLOOR_Y - h;
    // Cover edge peeking out behind the spine, then the spine itself.
    g.fillStyle(INK, 1);
    g.fillRect(left + 6, top - 4, w, h + 4);
    g.fillStyle(PAPER, 1);
    g.fillRect(left, top, w, h);
    g.lineStyle(3, INK, 1);
    g.strokeRect(left, top, w, h);
    // Cross-hatched spine cloth.
    g.lineStyle(1, INK, 0.25);
    for (let y = top + 8; y < top + h; y += 9) g.lineBetween(left + 4, y + 6, left + w - 4, y);
    // Stitched binding down both spine edges.
    g.lineStyle(1.5, INK, 0.8);
    for (let y = top + 8; y < top + h - 6; y += 12) {
      g.lineBetween(left + 9, y, left + 9, y + 6);
      g.lineBetween(left + w - 9, y, left + w - 9, y + 6);
    }
    // Elastic band.
    g.lineStyle(4, INK, 1);
    g.lineBetween(cx + 14, top - 2, cx + 14, top + h);
    // Floor shadow.
    g.lineStyle(2, INK, 0.5);
    g.lineBetween(left - 16, HOBBIES_FLOOR_Y, left + w + 20, HOBBIES_FLOOR_Y);
    // Empty slot: a dashed outline where something should sit.
    g.lineStyle(1.5, INK, 0.55);
    const slotTop = top - 46;
    for (let dx = 0; dx < 56; dx += 10) g.lineBetween(cx - 28 + dx, slotTop, cx - 22 + dx, slotTop);
    for (let dy = 0; dy < 40; dy += 10) {
      g.lineBetween(cx - 28, slotTop + dy, cx - 28, slotTop + dy + 6);
      g.lineBetween(cx + 28, slotTop + dy, cx + 28, slotTop + dy + 6);
    }
  }
}
