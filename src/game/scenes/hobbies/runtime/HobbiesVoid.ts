/**
 * HobbiesVoid — Out of Bounds, Act 1: the unfinished page past the Hobbies
 * room's left wall. Mostly blank paper so it reads as a collision bug, with a
 * few far-apart marks, and at the very end the Debugging Tools lying on the
 * floor in a faint glow (Act 2). Danilo's thoughts and sparse pencil-scratch
 * steps carry the walk. Once picked up, only a dusty footprint is left.
 * Geometry and copy come from src/game/core/console/content/outOfBoundsVoid.ts.
 */
import * as Phaser from 'phaser';
import {
  DEBUGGING_TOOLS_PICKUP_THOUGHT,
  HOBBIES_LEFT_WALL_X,
  OUT_OF_BOUNDS_TOOLBOX_X,
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
const TOOLBOX_WIDTH = 70;
/** Pencil dust around the toolbox's footprint: [dx, dy, radius] from its floor centre. */
const DUST_SPECKS: readonly (readonly [number, number, number])[] = [
  [-48, -3, 1.6],
  [-41, -6, 1],
  [44, -2, 1.4],
  [52, -5, 1],
  [-12, -12, 0.9],
  [20, -11, 1.1]
];
const PICKUP_MS = 420;
const PICKUP_CAPTION_MS = 2600;

export interface HobbiesVoidFrame {
  playerX: number;
  /** The Debugging Tools are in the Backpack, so the floor is bare. */
  kitOwned: boolean;
  /** Player is on the floor and moving horizontally. */
  walking: boolean;
  time: number;
  motion: boolean;
}

export class HobbiesVoid {
  private readonly scene: Phaser.Scene;
  private readonly glow: Phaser.GameObjects.Graphics;
  private readonly emptySpot: Phaser.GameObjects.Graphics;
  private readonly kit: Phaser.GameObjects.Container;
  /** True while the pickup tween carries the kit off the floor. */
  private kitLeaving = false;
  private readonly thought: Phaser.GameObjects.Text;
  private readonly getAudioContext: () => AudioContext | null;
  /** The player sprite the thought bubble floats above. */
  private readonly speaker: { readonly x: number; readonly y: number };
  private furthestDepth = 0;
  private thoughtUntil = 0;
  private lastScratchX: number | null = null;
  private lastGlowStep = -1;

  constructor(
    scene: Phaser.Scene,
    speaker: { readonly x: number; readonly y: number },
    getAudioContext: () => AudioContext | null
  ) {
    this.scene = scene;
    this.speaker = speaker;
    this.getAudioContext = getAudioContext;
    const g = scene.add.graphics().setDepth(1);
    for (const sight of OUT_OF_BOUNDS_SIGHTS) this.drawSight(g, sight.id, xAt(sight.depth));
    this.glow = scene.add.graphics().setDepth(1);
    this.drawFloorMark(scene.add.graphics().setDepth(2));
    this.emptySpot = this.drawEmptySpot(scene.add.graphics().setDepth(2));
    this.kit = this.createKit();
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
    // Follow the speaker after Arcade has synced the sprite to its body this
    // frame (POST_UPDATE), unrounded, so the bubble moves in lockstep with the
    // player instead of trailing a frame behind and shimmering.
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.followSpeaker, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.followSpeaker, this)
    );
  }

  private followSpeaker(): void {
    if (this.thought.visible) this.thought.setPosition(this.speaker.x, this.speaker.y - 70);
  }

  /**
   * The pickup moment: the toolbox lifts off the floor toward Danilo and is
   * gone, a latch clacks twice, and he says what's inside. Under reduced
   * motion the kit just disappears.
   */
  pickUpKit(frame: Pick<HobbiesVoidFrame, 'time' | 'motion'>): void {
    this.think(DEBUGGING_TOOLS_PICKUP_THOUGHT, frame);
    this.showPickupCaption(frame.motion);
    this.playLatch();
    if (!frame.motion) {
      this.kit.setVisible(false);
      return;
    }
    this.kitLeaving = true;
    this.scene.tweens.add({
      targets: this.kit,
      x: this.speaker.x,
      y: this.speaker.y - 30,
      scale: 0.2,
      alpha: 0,
      duration: PICKUP_MS,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.kitLeaving = false;
        this.kit.setVisible(false);
      }
    });
  }

  update(frame: HobbiesVoidFrame): void {
    if (!this.kitLeaving) this.kit.setVisible(!frame.kitOwned);
    this.emptySpot.setVisible(frame.kitOwned && !this.kitLeaving);
    const depth = outOfBoundsDepth(frame.playerX);
    const reached = outOfBoundsThoughtsReached(this.furthestDepth, depth);
    this.furthestDepth = Math.max(this.furthestDepth, depth);
    const latest = reached[reached.length - 1];
    if (latest) this.think(latest, frame);
    this.updateThought(frame);
    this.updateGlow(frame, !frame.kitOwned);
    this.updateScratch(frame, depth);
  }

  private think(line: string, frame: Pick<HobbiesVoidFrame, 'time'>): void {
    this.scene.tweens.killTweensOf(this.thought);
    this.thought.setText(line).setAlpha(1).setVisible(true);
    this.followSpeaker();
    this.thoughtUntil = frame.time + THOUGHT_MS;
  }

  private updateThought(frame: HobbiesVoidFrame): void {
    if (!this.thought.visible || frame.time < this.thoughtUntil) return;
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

  /** A slow stepped pulse around the kit; held still under reduced motion, off once the kit is taken. */
  private updateGlow(frame: HobbiesVoidFrame, lit: boolean): void {
    const step = !lit ? -2 : frame.motion ? Math.floor(frame.time / 180) % 12 : 0;
    if (step === this.lastGlowStep) return;
    this.lastGlowStep = step;
    if (!lit) {
      this.glow.clear();
      return;
    }
    const pulse = frame.motion ? Math.abs(6 - step) / 6 : 0.5;
    const g = this.glow.clear();
    const cx = OUT_OF_BOUNDS_TOOLBOX_X;
    const cy = HOBBIES_FLOOR_Y - 30;
    for (let ring = 0; ring < 4; ring += 1) {
      g.lineStyle(2, INK, (0.05 + pulse * 0.07) * (1 - ring * 0.2));
      g.strokeEllipse(cx, cy, 130 + ring * 26 + pulse * 10, 90 + ring * 20 + pulse * 8);
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

  /** A short ink floor line, so the toolbox stands on something in the blank page. */
  private drawFloorMark(g: Phaser.GameObjects.Graphics): void {
    const cx = OUT_OF_BOUNDS_TOOLBOX_X;
    g.lineStyle(2, INK, 0.5);
    g.lineBetween(cx - 70, HOBBIES_FLOOR_Y, cx + 64, HOBBIES_FLOOR_Y);
  }

  /** Where the toolbox lay: a clean dashed footprint in a scatter of pencil dust. */
  private drawEmptySpot(g: Phaser.GameObjects.Graphics): Phaser.GameObjects.Graphics {
    const cx = OUT_OF_BOUNDS_TOOLBOX_X;
    const half = TOOLBOX_WIDTH / 2;
    const top = HOBBIES_FLOOR_Y - 8;
    g.lineStyle(1.5, INK, 0.5);
    for (let dx = 0; dx < TOOLBOX_WIDTH; dx += 10) g.lineBetween(cx - half + dx, top, cx - half + dx + 6, top);
    g.lineBetween(cx - half, top, cx - half, HOBBIES_FLOOR_Y);
    g.lineBetween(cx + half, top, cx + half, HOBBIES_FLOOR_Y);
    g.fillStyle(INK, 0.18);
    for (const [dx, dy, r] of DUST_SPECKS) g.fillCircle(cx + dx, HOBBIES_FLOOR_Y + dy, r);
    return g.setVisible(false);
  }

  /**
   * A beat-up developer's toolbox on the floor, hammer handle poking out of
   * the lid. Drawn around its bottom-centre so the pickup tween scales it in place.
   */
  private createKit(): Phaser.GameObjects.Container {
    const g = this.scene.add.graphics();
    const w = TOOLBOX_WIDTH;
    const h = 36;
    // Hammer: handle out of the lid, head on top.
    g.lineStyle(5, INK, 1);
    g.lineBetween(12, -h - 2, 26, -h - 30);
    g.fillStyle(INK, 1);
    g.fillRect(18, -h - 40, 22, 9);
    // Carry handle.
    g.lineStyle(3, INK, 1);
    g.lineBetween(-14, -h, -14, -h - 10);
    g.lineBetween(-14, -h - 10, 6, -h - 10);
    g.lineBetween(6, -h - 10, 6, -h);
    // Body and a slightly crooked lid seam, so it reads hand-drawn and beat-up.
    g.fillStyle(PAPER, 1);
    g.fillRect(-w / 2, -h, w, h);
    g.lineStyle(3, INK, 1);
    g.strokeRect(-w / 2, -h, w, h);
    g.lineStyle(2, INK, 0.9);
    g.lineBetween(-w / 2, -h + 11, w / 2, -h + 9);
    // Latch, a dent, and a scuff.
    g.fillStyle(PAPER, 1);
    g.fillRect(-5, -h + 6, 10, 9);
    g.lineStyle(2, INK, 1);
    g.strokeRect(-5, -h + 6, 10, 9);
    g.lineStyle(1.2, INK, 0.5);
    g.lineBetween(-28, -8, -20, -5);
    g.lineBetween(20, -14, 27, -18);
    const label = createUiText(this.scene, 0, -12, 'DEBUG', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#1a1a1a'
    }).setOrigin(0.5);
    return this.scene.add.container(OUT_OF_BOUNDS_TOOLBOX_X, HOBBIES_FLOOR_Y, [g, label]).setDepth(3);
  }

  private showPickupCaption(motion: boolean): void {
    const caption = createUiText(
      this.scene,
      OUT_OF_BOUNDS_TOOLBOX_X,
      HOBBIES_FLOOR_Y - 150,
      '+ Debugging Tools (Backpack)',
      {
        fontSize: '14px',
        color: '#1a1a1a',
        backgroundColor: '#fbfbf9',
        padding: { x: 6, y: 3 }
      }
    )
      .setOrigin(0.5)
      .setDepth(100);
    this.scene.tweens.add({
      targets: caption,
      alpha: 0,
      y: motion ? caption.y - 16 : caption.y,
      delay: PICKUP_CAPTION_MS,
      duration: 500,
      onComplete: () => caption.destroy()
    });
  }

  /** Two dull clacks: the toolbox latch. */
  private playLatch(): void {
    const context = this.getAudioContext();
    if (!context || context.state !== 'running') return;
    const now = context.currentTime;
    playNoise(context, { at: now, filter: 'lowpass', filterFrequency: 900, q: 2, gain: 0.12, duration: 0.05 });
    playNoise(context, { at: now + 0.11, filter: 'lowpass', filterFrequency: 700, q: 2, gain: 0.1, duration: 0.05 });
  }
}
