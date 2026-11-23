// Per-note drawing branches on judgment state; splitting it would scatter one picture.
// fallow-ignore-file complexity
import type * as Phaser from 'phaser';
import { GIG_GOOD_MS, type ConcertGig, type GigJudgment, type GigLane } from '@/game/core/ridge';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { GIG_CARD_EDGE_CSS, GIG_FLASH_MS, gigCardWidthCss, type GigFrame } from '../art/gigStaging';
import { headTopFor } from '../art/stick/actorSprites';
import { CONCERT_STAGE_RISE, DEPTH, GROUND_Y, INK, INK_CSS, PAPER, PAPER_CSS } from '../art/stick/palette';
import { pinToScreen, visibleSlice } from './screenOverlay';

/** Song ms of notes visible above the strike line. Practice scrolls slower. */
const LOOKAHEAD_MS = { practice: 2300, show: 1750, serenade: 2100 } as const;
/** How long hit notes burst and missed notes keep falling past the line. */
const BURST_MS = 300;
const MISS_TAIL_MS = 380;
/** CSS sizes; converted to canvas pixels through the cover crop. */
const NOTE_CSS = 15;
const STRIKE_FROM_BOTTOM_CSS = 34;
/** Matches the `short:` Tailwind variant and the `sm` breakpoint the panel compacts at. */
const SHORT_VIEWPORT_CSS = 512;
const NARROW_VIEWPORT_CSS = 640;
const FLOAT_NOTES = 6;
const FLOAT_MS = 900;
const CONFETTI = 18;

const JUDGMENT_WORD: Record<GigJudgment, string> = { perfect: 'perfect!', good: 'nice', miss: 'miss' };
const KEY_LABELS: readonly string[] = ['A', 'S', 'D'];

interface Layout {
  /** Canvas px per CSS px. */
  k: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  strikeY: number;
  laneX: readonly [number, number, number];
  noteR: number;
}

interface FloatingNote {
  text: Phaser.GameObjects.Text;
  bornAt: number;
}

/**
 * Concert Crossing chrome drawn by Phaser: the note highway (in screen space,
 * so it stays put while the camera eases), stage lights that warm with the
 * crowd, notes floating off the guitar, and lighters when the crowd is
 * really with you. Gameplay lives in ConcertGig; this only paints it.
 */
export class ConcertGigView {
  private readonly scene: Phaser.Scene;
  private readonly hud: Phaser.GameObjects.Graphics;
  private readonly fx: Phaser.GameObjects.Graphics;
  private readonly countText: Phaser.GameObjects.Text;
  private readonly judgmentText: Phaser.GameObjects.Text[];
  private readonly keyText: Phaser.GameObjects.Text[];
  private readonly floating: FloatingNote[] = [];
  private nextFloat = 0;
  /** Song time each lane was last pressed, for the target flash. */
  private readonly pressedAt: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  private lastSerial = 0;
  private floatSerial = 0;
  private finishedAt: number | null = null;
  private readonly showKeys: boolean;
  /** Off stage the card docks right, so the performer and the cats stay in view. */
  private dockRight = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.fx = scene.add.graphics().setDepth(DEPTH.actor - 1);
    this.hud = scene.add
      .graphics()
      .setDepth(DEPTH.presence + 2)
      .setScrollFactor(0);
    const hudText = (size: number) =>
      createUiText(scene, 0, 0, '', {
        fontSize: `${size}px`,
        fontStyle: 'bold',
        color: INK_CSS,
        stroke: PAPER_CSS,
        strokeThickness: 4
      })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setDepth(DEPTH.presence + 3)
        .setVisible(false);
    this.countText = hudText(64);
    this.judgmentText = [0, 1, 2].map(() => hudText(18));
    this.keyText = [0, 1, 2].map(() => hudText(14).setStroke(PAPER_CSS, 0));
    this.showKeys = typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches === true;
    for (let i = 0; i < FLOAT_NOTES; i += 1) {
      const text = createUiText(scene, 0, 0, i % 2 === 0 ? '♪' : '♫', {
        fontSize: '22px',
        color: INK_CSS,
        stroke: PAPER_CSS,
        strokeThickness: 3
      })
        .setOrigin(0.5, 1)
        .setDepth(DEPTH.presence)
        .setVisible(false);
      this.floating.push({ text, bornAt: -Infinity });
    }
  }

  /** A lane was strummed (hit or not): flash its target. */
  press(lane: GigLane, songMs: number): void {
    this.pressedAt[lane] = songMs;
  }

  /**
   * `onStage` is the Concert show: spotlights, lighters, confetti. Off stage
   * (the serenade under the plaza lanterns) only the notes float up.
   */
  sync(gig: ConcertGig, frame: GigFrame, anchors: { performerX: number; crowdX: number; onStage: boolean }): void {
    this.dockRight = !anchors.onStage;
    const layout = this.layout();
    this.drawHighway(gig, frame, layout);
    if (anchors.onStage) this.drawStageFx(gig, frame, anchors);
    else this.fx.clear();
    this.syncFloatingNotes(gig, anchors.performerX, anchors.onStage ? CONCERT_STAGE_RISE : 0);
  }

  /** The lane column under a canvas point on the highway card, if any (touch players tap the targets). */
  laneAt(x: number, y: number): GigLane | undefined {
    const l = this.layout();
    if (x < l.left || x > l.right || y < l.top || y > l.bottom) return undefined;
    return Math.min(2, Math.floor(((x - l.left) / (l.right - l.left)) * 3)) as GigLane;
  }

  destroy(): void {
    this.hud.destroy();
    this.fx.destroy();
    this.countText.destroy();
    for (const text of [...this.judgmentText, ...this.keyText]) text.destroy();
    for (const note of this.floating) note.text.destroy();
  }

  // --- layout -------------------------------------------------------------

  /** Highway rectangle in canvas px, inside the visible slice and clear of the panel chrome. */
  private layout(): Layout {
    const visible = visibleSlice(this.scene);
    const { k, left: visLeft, top: visTop } = visible;
    const [reserveTop, reserveBottom] = chromeReserveCss();
    const width = gigCardWidthCss(visible.width / k) * k;
    const centre = this.dockRight
      ? visLeft + visible.width - GIG_CARD_EDGE_CSS * k - width / 2
      : visLeft + visible.width / 2;
    const top = visTop + reserveTop * k;
    const bottom = Math.max(top + 160 * k, visTop + visible.height - reserveBottom * k);
    const left = centre - width / 2;
    const lane = (i: number) => left + (width * (i + 0.5)) / 3;
    return {
      k,
      left,
      right: left + width,
      top,
      bottom,
      strikeY: bottom - STRIKE_FROM_BOTTOM_CSS * k,
      laneX: [lane(0), lane(1), lane(2)],
      noteR: NOTE_CSS * k
    };
  }

  private pin(object: Phaser.GameObjects.Components.Transform, x = 0, y = 0): void {
    pinToScreen(this.scene, object, x, y);
  }

  // --- highway ------------------------------------------------------------

  private drawHighway(gig: ConcertGig, frame: GigFrame, l: Layout): void {
    const g = this.hud;
    g.clear();
    this.pin(g);
    const now = frame.timeMs;
    const look = LOOKAHEAD_MS[gig.mode];
    const yOf = (t: number) => l.strikeY - ((t - now) / look) * (l.strikeY - l.top - l.noteR);

    // Card with the house offset shadow, like the panel chrome.
    const r = 10 * l.k;
    g.fillStyle(INK, 1);
    g.fillRoundedRect(l.left + 4 * l.k, l.top + 4 * l.k, l.right - l.left, l.bottom - l.top, r);
    g.fillStyle(PAPER, 0.94);
    g.fillRoundedRect(l.left, l.top, l.right - l.left, l.bottom - l.top, r);
    g.lineStyle(3 * l.k, INK, 1);
    g.strokeRoundedRect(l.left, l.top, l.right - l.left, l.bottom - l.top, r);

    // Frets scroll down on the beat; bar lines are heavier.
    const beat = gig.song.beatMs;
    for (let b = Math.ceil((now - 300) / beat); b * beat <= now + look; b += 1) {
      const y = yOf(b * beat);
      if (y < l.top + 4 || y > l.bottom - 4) continue;
      const bar = b % 4 === 0;
      g.lineStyle((bar ? 2 : 1) * l.k, INK, bar ? 0.32 : 0.13);
      g.lineBetween(l.left + 6 * l.k, y, l.right - 6 * l.k, y);
    }
    // Strings, low to high: the low one is the thickest.
    l.laneX.forEach((x, lane) => {
      g.lineStyle((2.6 - lane * 0.6) * l.k, INK, 0.5);
      g.lineBetween(x, l.top + 8 * l.k, x, l.bottom - 8 * l.k);
    });

    this.drawStrikeLine(gig, frame, l);
    this.drawNotes(gig, now, l, yOf, look);
    this.syncHudText(frame, l);
  }

  private drawStrikeLine(gig: ConcertGig, frame: GigFrame, l: Layout): void {
    const g = this.hud;
    g.lineStyle(3.5 * l.k, INK, 1);
    g.lineBetween(l.left + 4 * l.k, l.strikeY, l.right - 4 * l.k, l.strikeY);
    const now = frame.timeMs;
    l.laneX.forEach((x, i) => {
      const lane = i as GigLane;
      const pressed = now - this.pressedAt[lane] < 120;
      const flash = frame.flash && frame.flash.lane === lane && frame.flash.judgment !== 'miss';
      g.fillStyle(PAPER, 1);
      drawGlyph(g, lane, x, l.strikeY, l.noteR + 5 * l.k);
      g.fillPath();
      g.lineStyle(2.6 * l.k, INK, 1);
      drawGlyph(g, lane, x, l.strikeY, l.noteR + 5 * l.k);
      g.strokePath();
      if (pressed || flash) {
        g.fillStyle(INK, flash ? 0.35 : 0.18);
        drawGlyph(g, lane, x, l.strikeY, l.noteR + 5 * l.k);
        g.fillPath();
      }
    });
    // A slow combo pulse along the line once the crowd is properly warm.
    if (gig.combo >= 10 && frame.beatPhase !== null) {
      g.lineStyle(1.5 * l.k, INK, 0.25 * (1 - frame.beatPhase));
      g.strokeRoundedRect(
        l.left - 4 * l.k,
        l.top - 4 * l.k,
        l.right - l.left + 8 * l.k,
        l.bottom - l.top + 8 * l.k,
        12 * l.k
      );
    }
  }

  private drawNotes(gig: ConcertGig, now: number, l: Layout, yOf: (t: number) => number, look: number): void {
    const g = this.hud;
    const notes = gig.song.notes;
    let pendingChordY: number | null = null;
    for (const note of notes) {
      if (note.timeMs < now - Math.max(BURST_MS, MISS_TAIL_MS)) continue;
      if (note.timeMs > now + look) break;
      const x = l.laneX[note.lane];
      const judgment = gig.judgmentOf(note.id);
      const age = now - note.timeMs;

      if (judgment === 'perfect' || judgment === 'good') {
        if (age < -GIG_GOOD_MS || age > BURST_MS) continue;
        // Burst ring at the target where it landed.
        const t = Math.max(0, age + GIG_GOOD_MS) / (BURST_MS + GIG_GOOD_MS);
        g.lineStyle((judgment === 'perfect' ? 3 : 2) * l.k, INK, 0.8 * (1 - t));
        g.strokeCircle(x, l.strikeY, l.noteR * (1.2 + t * 1.6));
        continue;
      }
      const y = yOf(note.timeMs);
      if (y < l.top + l.noteR || y > l.bottom + l.noteR) continue;

      if (judgment === 'miss') {
        const fade = clamp(1 - age / MISS_TAIL_MS, 0, 1);
        g.lineStyle(2 * l.k, INK, 0.5 * fade);
        drawGlyph(g, note.lane, x, y, l.noteR * 0.85);
        g.strokePath();
        const d = l.noteR * 0.5;
        g.lineBetween(x - d, y - d, x + d, y + d);
        g.lineBetween(x - d, y + d, x + d, y - d);
        continue;
      }

      // Chord halves are tied by a bar so they read as one strum.
      if (note.chordHit) {
        if (pendingChordY !== null && Math.abs(pendingChordY - y) < 1) {
          g.lineStyle(5 * l.k, INK, 0.85);
          g.lineBetween(l.laneX[0] + 2, y, l.laneX[2] - 2, y);
        }
        pendingChordY = y;
      }
      const near = Math.abs(age) <= GIG_GOOD_MS;
      g.fillStyle(INK, 1);
      drawGlyph(g, note.lane, x, y, l.noteR);
      g.fillPath();
      g.lineStyle(2 * l.k, PAPER, 1);
      drawGlyph(g, note.lane, x, y, l.noteR * 0.55);
      g.strokePath();
      if (near) {
        g.lineStyle(2 * l.k, INK, 0.6);
        drawGlyph(g, note.lane, x, y, l.noteR + 6 * l.k);
        g.strokePath();
      }
    }
  }

  private syncHudText(frame: GigFrame, l: Layout): void {
    // Count-in: big drummer numbers in the middle of the highway.
    if (frame.countIn !== null) {
      this.countText.setText(String(frame.countIn)).setVisible(true);
      this.countText.setFontSize(`${Math.round(64 * l.k)}px`);
      this.pin(this.countText, (l.left + l.right) / 2, (l.top + l.strikeY) / 2);
      this.countText.setAlpha(1 - (frame.beatPhase ?? 0) * 0.7);
    } else {
      this.countText.setVisible(false);
    }

    const flash = frame.flash;
    this.judgmentText.forEach((text, lane) => {
      if (!flash || flash.lane !== lane) {
        text.setVisible(false);
        return;
      }
      if (flash.serial !== this.lastSerial) {
        this.lastSerial = flash.serial;
        text.setText(JUDGMENT_WORD[flash.judgment]);
      }
      const t = flash.age / GIG_FLASH_MS;
      text.setFontSize(`${Math.round((flash.judgment === 'perfect' ? 18 : 15) * l.k)}px`);
      this.pin(text, l.laneX[lane], l.strikeY - (l.noteR + 22 * l.k) - t * 16 * l.k);
      text.setAlpha(1 - t).setVisible(true);
    });

    // Key letters sit inside the hollow targets: big, ink on paper, never clipped by the card edge.
    this.keyText.forEach((text, lane) => {
      text.setVisible(this.showKeys);
      if (!this.showKeys) return;
      text.setText(KEY_LABELS[lane]!).setFontSize(`${Math.round(l.noteR * 1.15)}px`);
      this.pin(text, l.laneX[lane], l.strikeY);
    });
  }

  // --- stage --------------------------------------------------------------

  private drawStageFx(gig: ConcertGig, frame: GigFrame, anchors: { performerX: number; crowdX: number }): void {
    const g = this.fx;
    g.clear();
    const hype = frame.hype;
    const deck = GROUND_Y - CONCERT_STAGE_RISE;
    const px = anchors.performerX;

    // Two spotlights from the truss, warming as the crowd does.
    const glow = gig.phase === 'countIn' ? 0.12 : 0.14 + 0.3 * hype;
    for (const from of [px - 70, px + 60]) {
      g.fillStyle(PAPER, glow);
      g.fillTriangle(from, GROUND_Y - 176, px - 34, deck, px + 34, deck);
      g.lineStyle(1.2, INK, 0.12 + 0.1 * hype);
      g.lineBetween(from, GROUND_Y - 176, px - 34, deck);
      g.lineBetween(from, GROUND_Y - 176, px + 34, deck);
    }
    g.fillStyle(PAPER, 0.4 + 0.3 * hype);
    g.fillEllipse(px, deck, 84, 10);

    // Lighters over the crowd once it is properly with you.
    if (hype > 0.72 || gig.phase === 'finished') {
      const flick = Math.floor(frame.timeMs / 90);
      const head = GROUND_Y + headTopFor('crowd') - 16;
      for (const [i, dx] of [-38, -2, 24, 46].entries()) {
        const x = anchors.crowdX + dx;
        const y = head - (i % 2) * 8 + ((flick + i) % 3);
        g.lineStyle(2, INK, 0.9);
        g.lineBetween(x, y + 16, x, y + 4);
        g.fillStyle(PAPER, 1);
        g.fillTriangle(x - 4, y + 4, x + 4, y + 4, x + ((flick + i) % 2 === 0 ? 1 : -1), y - 8);
        g.lineStyle(1.4, INK, 1);
        g.strokeTriangle(x - 4, y + 4, x + 4, y + 4, x + ((flick + i) % 2 === 0 ? 1 : -1), y - 8);
      }
    }

    // A warm finish rains paper scraps over the stage.
    if (gig.phase === 'finished') {
      this.finishedAt ??= frame.timeMs;
      if (hype > 0.6) this.drawConfetti(g, frame.timeMs - this.finishedAt, px, anchors.crowdX);
    }
  }

  private drawConfetti(g: Phaser.GameObjects.Graphics, age: number, from: number, to: number): void {
    for (let i = 0; i < CONFETTI; i += 1) {
      const seed = Math.sin(i * 12.9898) * 43758.5453;
      const r = seed - Math.floor(seed);
      const x = from - 40 + (to - from + 80) * ((i + 0.5) / CONFETTI) + Math.sin(age / 240 + i) * 10;
      const y = GROUND_Y - 200 + ((age * (0.09 + r * 0.06) + r * 80) % 200);
      g.fillStyle(i % 3 === 0 ? INK : PAPER, 1);
      g.lineStyle(1, INK, 1);
      g.fillRect(x, y, 6, 4);
      g.strokeRect(x, y, 6, 4);
    }
  }

  /** A note glyph drifts off the guitar for every landed strum. */
  private syncFloatingNotes(gig: ConcertGig, performerX: number, rise: number): void {
    const last = gig.lastHit;
    const now = this.scene.time.now;
    if (last && last.judgment !== 'miss' && last.serial !== this.floatSerial) {
      this.floatSerial = last.serial;
      const note = this.floating[this.nextFloat]!;
      this.nextFloat = (this.nextFloat + 1) % this.floating.length;
      note.bornAt = now;
      note.text.setData('dx', (last.lane - 1) * 14 + (Math.random() - 0.5) * 10);
    }
    const headY = GROUND_Y - rise + headTopFor('player');
    for (const note of this.floating) {
      const age = now - note.bornAt;
      if (age > FLOAT_MS) {
        note.text.setVisible(false);
        continue;
      }
      const t = age / FLOAT_MS;
      const dx = (note.text.getData('dx') as number | undefined) ?? 0;
      note.text
        .setPosition(Math.round(performerX + 26 + dx + Math.sin(t * 6) * 4), Math.round(headY + 10 - t * 46))
        .setAlpha(1 - t)
        .setVisible(true);
    }
  }
}

/** Lane shapes, so lanes read without colour: circle, diamond, square. */
function drawGlyph(g: Phaser.GameObjects.Graphics, lane: GigLane, x: number, y: number, r: number): void {
  g.beginPath();
  if (lane === 0) {
    g.arc(x, y, r, 0, Math.PI * 2);
  } else if (lane === 1) {
    const d = r * 1.18;
    g.moveTo(x, y - d);
    g.lineTo(x + d, y);
    g.lineTo(x, y + d);
    g.lineTo(x - d, y);
  } else {
    const d = r * 0.86;
    g.moveTo(x - d, y - d);
    g.lineTo(x + d, y - d);
    g.lineTo(x + d, y + d);
    g.lineTo(x - d, y + d);
  }
  g.closePath();
}

/** CSS pixels the gig panel takes at the top (status) and bottom (lane buttons). */
function chromeReserveCss(): [number, number] {
  // Mouse-and-keyboard screens hide the strum buttons (keys play), so only the hint row sits below.
  const fine = window.matchMedia?.('(pointer: fine)').matches ?? false;
  const short = window.innerHeight <= SHORT_VIEWPORT_CSS;
  const bottom = fine ? (short ? 36 : 52) : short ? 96 : 136;
  if (short) return [48, bottom];
  if (window.innerWidth < NARROW_VIEWPORT_CSS) return [112, bottom];
  return [80, bottom];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
