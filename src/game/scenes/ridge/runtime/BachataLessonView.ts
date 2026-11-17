// Per-step drawing branches on judgment state; splitting it would scatter one picture.
// fallow-ignore-file complexity
import type * as Phaser from 'phaser';
import { bachataStepOf, GIG_GOOD_MS, type BachataStep, type ConcertGig, type GigJudgment, type GigLane } from '@/game/core/ridge';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { LESSON_FLASH_MS, type LessonFrame } from '../art/lessonStaging';
import { headTopFor } from '../art/stick/actorSprites';
import { DEPTH, GROUND_Y, INK, INK_CSS, PAPER, PAPER_CSS } from '../art/stick/palette';
import { pinToScreen, visibleSlice } from './screenOverlay';

/** Song ms of steps visible ahead of the strike mark. */
const LOOKAHEAD_MS = 2600;
/** How long a landed step's ring and a missed step's cross linger behind the mark. */
const TAIL_MS = 360;
/** CSS sizes; converted to canvas pixels through the cover crop. */
const CARD_MIN_CSS = 260;
const CARD_MAX_CSS = 560;
const CARD_HEIGHT_CSS = 76;
const GLYPH_CSS = 14;
/** Strike mark, as a share of the card's width from its left edge. */
const STRIKE_AT = 0.2;
const SHORT_VIEWPORT_CSS = 512;
const COUNT_LABELS = 10;
const FOOTPRINTS = 10;
const FOOTPRINT_MS = 1400;

const JUDGMENT_WORD: Record<GigJudgment, string> = { perfect: '¡eso!', good: 'nice', miss: 'oops' };
/** What the Profe calls on each count of the eight. */
const CALL: readonly string[] = ['1', '2', '3', 'tap!', '5', '6', '7', 'tap!'];

interface Layout {
  k: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  strikeX: number;
  midY: number;
  r: number;
}

interface Footprint {
  x: number;
  bornAt: number;
  tap: boolean;
}

/**
 * The Profe's lesson, drawn by Phaser: a paper step strip pinned in screen
 * space (steps slide toward the mark: left, tap, right), her count called big
 * above it, a word over your head on every step, and ink footprints on the
 * boards where you landed. Gameplay lives in the lesson judge; this paints.
 */
export class BachataLessonView {
  private readonly scene: Phaser.Scene;
  private readonly hud: Phaser.GameObjects.Graphics;
  private readonly floor: Phaser.GameObjects.Graphics;
  private readonly callText: Phaser.GameObjects.Text;
  private readonly wordText: Phaser.GameObjects.Text;
  private readonly countLabels: Phaser.GameObjects.Text[] = [];
  private readonly footprints: Footprint[] = [];
  private nextFootprint = 0;
  private lastSerial = 0;
  private printedSerial = 0;
  private pressedAt = Number.NEGATIVE_INFINITY;
  private pressedLane: GigLane = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.floor = scene.add.graphics().setDepth(DEPTH.actor - 1);
    this.hud = scene.add.graphics().setDepth(DEPTH.presence + 2).setScrollFactor(0);
    const text = (size: number, scrollFactor: number) =>
      createUiText(scene, 0, 0, '', {
        fontSize: `${size}px`,
        fontStyle: 'bold',
        color: INK_CSS,
        stroke: PAPER_CSS,
        strokeThickness: 4
      })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(scrollFactor)
        .setDepth(DEPTH.presence + 3)
        .setVisible(false);
    this.callText = text(40, 0);
    this.wordText = text(18, 1);
    for (let i = 0; i < COUNT_LABELS; i += 1) this.countLabels.push(text(11, 0).setStroke(PAPER_CSS, 0));
    for (let i = 0; i < FOOTPRINTS; i += 1) this.footprints.push({ x: 0, bornAt: Number.NEGATIVE_INFINITY, tap: false });
  }

  /** A step was pressed (landed or not): flash the mark. */
  press(lane: GigLane, songMs: number): void {
    this.pressedAt = songMs;
    this.pressedLane = lane;
  }

  sync(lesson: ConcertGig, frame: LessonFrame, anchors: { playerX: number }): void {
    const layout = this.layout();
    this.drawStrip(lesson, frame, layout);
    this.syncCall(frame, layout);
    this.syncWord(frame, anchors.playerX);
    this.drawFootprints(frame, anchors.playerX);
  }

  destroy(): void {
    this.hud.destroy();
    this.floor.destroy();
    this.callText.destroy();
    this.wordText.destroy();
    for (const label of this.countLabels) label.destroy();
  }

  // --- layout -------------------------------------------------------------

  private layout(): Layout {
    const visible = visibleSlice(this.scene);
    const { k, left: visLeft, top: visTop } = visible;
    const width = clamp((visible.width / k) * 0.92, CARD_MIN_CSS, CARD_MAX_CSS) * k;
    const left = visLeft + (visible.width - width) / 2;
    const bottom = visTop + visible.height - bottomReserveCss() * k;
    const top = bottom - CARD_HEIGHT_CSS * k;
    return {
      k,
      left,
      right: left + width,
      top,
      bottom,
      strikeX: left + width * STRIKE_AT,
      midY: top + (CARD_HEIGHT_CSS * k) * 0.42,
      r: GLYPH_CSS * k
    };
  }

  private pin(object: Phaser.GameObjects.Components.Transform, x = 0, y = 0): void {
    pinToScreen(this.scene, object, x, y);
  }

  // --- strip --------------------------------------------------------------

  private drawStrip(lesson: ConcertGig, frame: LessonFrame, l: Layout): void {
    const g = this.hud;
    g.clear();
    this.pin(g);
    const now = frame.timeMs;
    const span = l.right - l.strikeX - l.r * 2;
    const xOf = (t: number) => l.strikeX + ((t - now) / LOOKAHEAD_MS) * span;

    const radius = 10 * l.k;
    g.fillStyle(INK, 1);
    g.fillRoundedRect(l.left + 4 * l.k, l.top + 4 * l.k, l.right - l.left, l.bottom - l.top, radius);
    g.fillStyle(PAPER, 0.95);
    g.fillRoundedRect(l.left, l.top, l.right - l.left, l.bottom - l.top, radius);
    g.lineStyle(3 * l.k, INK, 1);
    g.strokeRoundedRect(l.left, l.top, l.right - l.left, l.bottom - l.top, radius);

    // Beat ticks slide with the steps; the start of each eight is heavier.
    const { beatMs, startMs } = lesson.song;
    for (let b = Math.ceil((now - TAIL_MS - startMs) / beatMs); startMs + b * beatMs <= now + LOOKAHEAD_MS; b += 1) {
      const x = xOf(startMs + b * beatMs);
      if (x < l.left + 6 * l.k || x > l.right - 6 * l.k) continue;
      const eight = ((b % 8) + 8) % 8 === 0;
      g.lineStyle((eight ? 2 : 1) * l.k, INK, eight ? 0.3 : 0.12);
      g.lineBetween(x, l.top + 8 * l.k, x, l.bottom - 8 * l.k);
    }

    // The mark.
    const pressed = now - this.pressedAt < 120;
    const landed = frame.flash && frame.flash.judgment !== 'miss' && frame.flash.age < 140;
    g.lineStyle(3.5 * l.k, INK, 1);
    g.lineBetween(l.strikeX, l.top + 6 * l.k, l.strikeX, l.bottom - 6 * l.k);
    g.lineStyle(2.4 * l.k, INK, 1);
    g.fillStyle(PAPER, 1);
    g.fillCircle(l.strikeX, l.midY, l.r + 6 * l.k);
    g.strokeCircle(l.strikeX, l.midY, l.r + 6 * l.k);
    if (pressed || landed) {
      g.fillStyle(INK, landed ? 0.3 : 0.16);
      g.fillCircle(l.strikeX, l.midY, l.r + 6 * l.k);
      if (pressed) drawStepGlyph(g, bachataStepOf(this.pressedLane), l.strikeX, l.midY, l.r * 0.7, l.k, 0.45);
    }

    this.drawSteps(lesson, now, l, xOf);
  }

  private drawSteps(lesson: ConcertGig, now: number, l: Layout, xOf: (t: number) => number): void {
    const g = this.hud;
    const { beatMs, startMs } = lesson.song;
    let label = 0;
    for (const note of lesson.song.notes) {
      if (note.timeMs < now - TAIL_MS) continue;
      if (note.timeMs > now + LOOKAHEAD_MS) break;
      const x = xOf(note.timeMs);
      if (x > l.right - l.r) continue;
      const step = bachataStepOf(note.lane);
      const judgment = lesson.judgmentOf(note.id);
      const age = now - note.timeMs;

      if (judgment === 'perfect' || judgment === 'good') {
        if (age < -GIG_GOOD_MS || age > TAIL_MS) continue;
        const t = Math.max(0, age + GIG_GOOD_MS) / (TAIL_MS + GIG_GOOD_MS);
        g.lineStyle((judgment === 'perfect' ? 3 : 2) * l.k, INK, 0.8 * (1 - t));
        g.strokeCircle(l.strikeX, l.midY, l.r * (1.2 + t * 1.5));
        continue;
      }
      if (judgment === 'miss') {
        const fade = clamp(1 - age / TAIL_MS, 0, 1);
        drawStepGlyph(g, step, x, l.midY, l.r * 0.85, l.k, 0.45 * fade);
        const d = l.r * 0.6;
        g.lineStyle(2 * l.k, INK, 0.6 * fade);
        g.lineBetween(x - d, l.midY - d, x + d, l.midY + d);
        g.lineBetween(x - d, l.midY + d, x + d, l.midY - d);
        continue;
      }

      const near = Math.abs(age) <= GIG_GOOD_MS;
      drawStepGlyph(g, step, x, l.midY, near ? l.r * 1.12 : l.r, l.k, 1);
      // The count under each step: what the Profe will call when it lands.
      const text = this.countLabels[label];
      if (text) {
        label += 1;
        const beat = Math.round((note.timeMs - startMs) / beatMs);
        text.setText(CALL[((beat % 8) + 8) % 8]!).setFontSize(`${Math.round(11 * l.k)}px`).setVisible(true);
        this.pin(text, x, l.bottom - 13 * l.k);
      }
    }
    for (let i = label; i < this.countLabels.length; i += 1) this.countLabels[i]!.setVisible(false);
  }

  /** The Profe's call: "5, 6, 7, 8" in, then the count of the eight. */
  private syncCall(frame: LessonFrame, l: Layout): void {
    const value = frame.countIn !== null ? String(frame.countIn) : frame.count !== null ? CALL[frame.count - 1]! : null;
    if (value === null) {
      this.callText.setVisible(false);
      return;
    }
    const big = frame.countIn !== null || value === 'tap!';
    this.callText.setText(value).setFontSize(`${Math.round((big ? 40 : 30) * l.k)}px`).setVisible(true);
    this.pin(this.callText, l.strikeX, l.top - 28 * l.k);
    this.callText.setAlpha(1 - (frame.beatPhase ?? 0) * 0.6);
  }

  /** A word over your head for every step. */
  private syncWord(frame: LessonFrame, playerX: number): void {
    const flash = frame.flash;
    if (!flash) {
      this.wordText.setVisible(false);
      return;
    }
    if (flash.serial !== this.lastSerial) {
      this.lastSerial = flash.serial;
      this.wordText.setText(JUDGMENT_WORD[flash.judgment]);
    }
    const t = flash.age / LESSON_FLASH_MS;
    this.wordText
      .setPosition(Math.round(playerX), Math.round(GROUND_Y + headTopFor('player') - 18 - t * 18))
      .setAlpha(1 - t)
      .setVisible(true);
  }

  /** Ink footprints where you landed, fading into the boards. */
  private drawFootprints(frame: LessonFrame, playerX: number): void {
    const flash = frame.flash;
    const now = frame.timeMs;
    if (flash && flash.judgment !== 'miss' && flash.serial !== this.printedSerial) {
      this.printedSerial = flash.serial;
      const print = this.footprints[this.nextFootprint]!;
      this.nextFootprint = (this.nextFootprint + 1) % this.footprints.length;
      print.x = playerX + (flash.step === 'left' ? -10 : flash.step === 'right' ? 10 : 0);
      print.bornAt = now;
      print.tap = flash.step === 'tap';
    }
    const g = this.floor;
    g.clear();
    for (const print of this.footprints) {
      const age = now - print.bornAt;
      if (age < 0 || age > FOOTPRINT_MS) continue;
      const alpha = 0.5 * (1 - age / FOOTPRINT_MS);
      g.fillStyle(INK, alpha);
      if (print.tap) {
        g.fillCircle(print.x, GROUND_Y + 13, 3);
        g.lineStyle(1.4, INK, alpha);
        g.strokeCircle(print.x, GROUND_Y + 13, 7 + (age / FOOTPRINT_MS) * 8);
      } else {
        g.fillEllipse(print.x, GROUND_Y + 13, 12, 5);
      }
    }
  }
}

/** Step glyphs, so steps read without colour: arrows for the feet, a burst for the hip tap. */
function drawStepGlyph(
  g: Phaser.GameObjects.Graphics,
  step: BachataStep,
  x: number,
  y: number,
  r: number,
  k: number,
  alpha: number
): void {
  if (step === 'tap') {
    g.fillStyle(INK, alpha);
    g.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const radius = i % 2 === 0 ? r * 1.15 : r * 0.5;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    return;
  }
  const dir = step === 'left' ? -1 : 1;
  g.fillStyle(INK, alpha);
  g.fillCircle(x, y, r);
  g.lineStyle(2.6 * k, PAPER, alpha);
  g.beginPath();
  g.moveTo(x - dir * r * 0.15, y - r * 0.5);
  g.lineTo(x + dir * r * 0.4, y);
  g.lineTo(x - dir * r * 0.15, y + r * 0.5);
  g.strokePath();
}

/** CSS pixels the lesson panel takes along the bottom (buttons on touch, the hint row on desktop). */
function bottomReserveCss(): number {
  const fine = window.matchMedia?.('(pointer: fine)').matches ?? false;
  const short = window.innerHeight <= SHORT_VIEWPORT_CSS;
  if (fine) return short ? 40 : 56;
  return short ? 92 : 132;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
