/**
 * Shared bits of the Out of Bounds street fight (#163): the enemy contract,
 * ink colours, and the effects every hit uses (a big ink word, feathers,
 * splats, Foley). Hits must read with sound off, and nothing flashes.
 */
import type * as Phaser from 'phaser';
import type { StreetFightEnemy } from '@/game/core/console';
import { ALERT_RED_CSS } from '@/game/sharedSceneRuntime/escapeAlert';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { playNoise } from '@/game/scenes/hobbies/overlays/shared/audioVoices';

export const INK = 0x1a1a1a;
export const PAPER = 0xfbfbf9;
export const GREY = 0x8a8a8a;
/** The street's ground line, where feet stand. */
export const FEET_Y = 548;
export const ENEMY_DEPTH = 27;
const WORD_DEPTH = 140;

/** What the fight knows each frame. */
export interface FightFrame {
  timeMs: number;
  /** Seconds, clamped. */
  dt: number;
  playerX: number;
  playerY: number;
  /** Camera view edges in world x: enemies enter from just past them. */
  viewLeft: number;
  viewRight: number;
  motion: boolean;
}

/** An enemy's attack this frame: a claw swipe from beside Danilo, or something dropped from above. */
export type FightAttack = { kind: 'swipe'; fromX: number } | { kind: 'drop'; x: number; y: number };

/** A melee tell: a red `!` over an attacker's head (danger red, ink stroke, 26px bold). Hidden until shown. */
export function createTell(scene: Phaser.Scene, depth: number): Phaser.GameObjects.Text {
  return createUiText(scene, 0, 0, '!', {
    fontSize: '26px',
    color: ALERT_RED_CSS,
    fontStyle: 'bold',
    stroke: '#1a1a1a',
    strokeThickness: 3
  })
    .setOrigin(0.5, 1)
    .setDepth(depth)
    .setVisible(false);
}

/** A wave enemy: moves itself, says when it attacks, and goes down when the hammer lands. */
export interface FightEnemy {
  readonly kind: StreetFightEnemy;
  readonly x: number;
  readonly y: number;
  /** Can the hammer land on it right now. */
  readonly hittable: boolean;
  /** Knocked out (falling or fading): no longer a threat or a target. */
  readonly down: boolean;
  /** Knocked out and faded away: safe to forget. */
  readonly gone: boolean;
  update(frame: FightFrame): FightAttack | null;
  /** The hammer landed; `away` is the direction it flies off. */
  knock(away: 1 | -1): void;
  /** Its melee attack met a parry (ground enemies only): left dizzy and open. */
  daze?(): void;
  /** The fight is over: leave the page instead of coming round again (pigeons). */
  retire?(): void;
}

export interface WaveEnemyOptions {
  /** How long it waits before entering. */
  delayMs: number;
  /** Which edge of the view it enters from. */
  fromLeft: boolean;
  /** Takes over the knocked-out drawing (to fade it away). */
  onKnockedOut: (g: Phaser.GameObjects.Graphics) => void;
}

const OFFSCREEN_PX = 50;

/** What every wave enemy shares: its drawing, its entry, and going away once knocked out. */
export abstract class WaveEnemy {
  protected readonly g: Phaser.GameObjects.Graphics;
  /** Counts down to entering, then whatever the current state is timing. */
  protected timerMs: number;
  protected fromLeft: boolean;
  private readonly onKnockedOut: (g: Phaser.GameObjects.Graphics) => void;
  private faded = false;

  constructor(scene: Phaser.Scene, options: WaveEnemyOptions) {
    this.g = scene.add.graphics().setDepth(ENEMY_DEPTH).setVisible(false);
    this.timerMs = options.delayMs;
    this.fromLeft = options.fromLeft;
    this.onKnockedOut = options.onKnockedOut;
  }

  get gone(): boolean {
    return this.faded;
  }

  /** Hands the knocked-out drawing over to fade; `onGone` tidies anything else up. */
  protected fadeAway(onGone?: () => void): void {
    this.onKnockedOut(this.g);
    this.g.once('destroy', () => {
      this.faded = true;
      onGone?.();
    });
  }

  /** Just past the edge of the view on its side. */
  protected entryX(frame: FightFrame): number {
    return this.fromLeft ? frame.viewLeft - OFFSCREEN_PX : frame.viewRight + OFFSCREEN_PX;
  }

  /** Past the far edge of the view, flying the way `vx` says. */
  protected pastFarEdge(x: number, vx: number, frame: FightFrame): boolean {
    return vx > 0 ? x > frame.viewRight + OFFSCREEN_PX : x < frame.viewLeft - OFFSCREEN_PX;
  }
}

export class FightFx {
  private readonly scene: Phaser.Scene;
  private readonly motion: boolean;
  private readonly getAudioContext: () => AudioContext | null;

  constructor(scene: Phaser.Scene, motion: boolean, getAudioContext: () => AudioContext | null) {
    this.scene = scene;
    this.motion = motion;
    this.getAudioContext = getAudioContext;
  }

  /** BONK! THWACK! SPLAT!: an ink word that rises and goes (holds still under reduced motion). */
  word(text: string, x: number, y: number): void {
    const label = createUiText(this.scene, x, y - 30, text, {
      fontSize: '26px',
      color: '#1a1a1a',
      backgroundColor: '#fbfbf9',
      padding: { x: 6, y: 2 },
      fontStyle: 'bold'
    })
      .setOrigin(0.5)
      .setDepth(WORD_DEPTH)
      .setRotation(-0.12);
    this.scene.tweens.add({
      targets: label,
      y: this.motion ? y - 58 : y - 30,
      delay: this.motion ? 0 : 700,
      duration: this.motion ? 700 : 1,
      onComplete: () => label.destroy()
    });
  }

  feathers(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      const g = this.scene.add.graphics().setDepth(ENEMY_DEPTH).setPosition(x, y);
      g.lineStyle(1.5, INK, 0.85);
      g.lineBetween(-5, 0, 5, 0);
      g.lineBetween(-3, -1.5, -1, 1.5);
      g.lineBetween(1, -1.5, 3, 1.5);
      g.rotation = Math.random() * Math.PI;
      this.fadeOut(g, {
        x: x + (Math.random() - 0.5) * 120,
        y: y + 30 + Math.random() * 60,
        rotation: g.rotation + (this.motion ? 3 : 0)
      });
    }
  }

  /** A dropping hits the street: a little hatched splat that dries off the page. */
  splat(x: number, y: number): void {
    const g = this.scene.add
      .graphics()
      .setDepth(ENEMY_DEPTH - 1)
      .setPosition(x, y);
    g.fillStyle(PAPER, 1);
    g.lineStyle(1.5, INK, 0.9);
    g.fillEllipse(0, 0, 18, 6);
    g.strokeEllipse(0, 0, 18, 6);
    g.lineBetween(-9, 0, -13, -3);
    g.lineBetween(8, -1, 12, -4);
    g.lineStyle(1, GREY, 0.9);
    g.lineBetween(-4, -1, 0, 2);
    g.lineBetween(1, -1, 5, 2);
    this.fadeOut(g, {}, 1200);
  }

  smashSound(): void {
    const context = this.liveAudio();
    if (!context) return;
    const now = context.currentTime;
    playNoise(context, { at: now, filter: 'lowpass', filterFrequency: 420, gain: 0.22, duration: 0.16 });
    playNoise(context, { at: now + 0.02, filter: 'highpass', filterFrequency: 3200, gain: 0.07, duration: 0.22 });
  }

  whiffSound(): void {
    const context = this.liveAudio();
    if (!context) return;
    playNoise(context, { filter: 'bandpass', filterFrequency: 900, q: 1.2, gain: 0.05, duration: 0.12 });
  }

  hurtSound(): void {
    const context = this.liveAudio();
    if (!context) return;
    playNoise(context, { filter: 'bandpass', filterFrequency: 600, q: 2, gain: 0.12, duration: 0.14 });
  }

  /** Fades a throwaway mark off the page; under reduced motion it just holds, then goes. */
  fadeOut(target: Phaser.GameObjects.Graphics, to: Record<string, number>, delayMs = 0): void {
    this.scene.tweens.add({
      targets: target,
      ...(this.motion ? to : {}),
      alpha: 0,
      delay: this.motion ? delayMs : delayMs + 900,
      duration: this.motion ? 900 + Math.random() * 400 : 1,
      onComplete: () => target.destroy()
    });
  }

  private liveAudio(): AudioContext | null {
    const context = this.getAudioContext();
    return context && context.state === 'running' ? context : null;
  }
}
