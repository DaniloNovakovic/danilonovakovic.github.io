// Phaser drawing of the night alarm; verified in the browser.
// fallow-ignore-file complexity
/**
 * The street in alarm (Out of Bounds escape, #163): a manhunt at night. Still
 * the same drawn street, just after dark: a night wash over the paper, a
 * moon, searchlights sweeping the buildings, a helicopter circling with its
 * spotlight, and every door crossed with red tape. Presentation only; the
 * console decides that nothing can be entered.
 *
 * Red follows the alert rules (docs/design/style-guide.md): danger only, always
 * hatched in ink, nothing flashes. Reduced motion: lights and helicopter hold
 * still.
 */
import * as Phaser from 'phaser';
import { ALERT_RED } from '@/game/sharedSceneRuntime/escapeAlert';
import { GAME_DESIGN_HEIGHT, GAME_DESIGN_WIDTH } from '@/game/sharedSceneRuntime/config';
import { OVERWORLD_BUILDING_SPOTS, OVERWORLD_WIDTH } from '@/game/core/console';

const INK = 0x1a1a1a;
const PAPER = 0xfbfbf9;
const NIGHT = 0x101629;
const BEAM = 0xfff6d8;
const GROUND_Y = 550;

/** Above the street, its props and the grass; under Danilo (25) and the fight. */
const NIGHT_DEPTH = 24;
const TAPE_DEPTH = 24.2;
const LIGHT_DEPTH = 24.4;
const HELI_DEPTH = 24.6;

/** Searchlight bases (world x), set behind the street. */
const SEARCHLIGHT_XS = [350, 1150, 1700, 2600] as const;
const SEARCHLIGHT_SWAY_RAD = 0.42;
const HELI_Y = 92;
const HELI_SPEED = 70;
/** How far past Danilo it drifts before turning back. */
const HELI_ORBIT_PX = 280;
/** Extra speed per pixel it has fallen behind that orbit. */
const HELI_CATCH_UP = 4;
/** The spotlight points mostly down: its spot stays within this of the helicopter. */
const HELI_BEAM_REACH_PX = 240;

export class StreetAlarm {
  private readonly scene: Phaser.Scene;
  private readonly lights: Phaser.GameObjects.Graphics;
  private readonly heli: Phaser.GameObjects.Graphics;
  private readonly heliBeam: Phaser.GameObjects.Graphics;
  private heliX: number;
  private heliDir: 1 | -1 = 1;
  private rotorFrame = -1;

  constructor(scene: Phaser.Scene, startX: number) {
    this.scene = scene;
    this.heliX = startX - 260;

    // Oversized so camera zoom (talk framing) never shows its edge.
    scene.add
      .rectangle(
        GAME_DESIGN_WIDTH / 2,
        GAME_DESIGN_HEIGHT / 2,
        GAME_DESIGN_WIDTH * 4,
        GAME_DESIGN_HEIGHT * 4,
        NIGHT,
        0.62
      )
      .setScrollFactor(0)
      .setDepth(NIGHT_DEPTH);
    this.drawMoon();
    this.drawTape();
    this.lights = scene.add.graphics().setDepth(LIGHT_DEPTH).setBlendMode(Phaser.BlendModes.ADD);
    this.heliBeam = scene.add.graphics().setDepth(LIGHT_DEPTH).setBlendMode(Phaser.BlendModes.ADD);
    this.heli = scene.add.graphics().setDepth(HELI_DEPTH);
  }

  update(timeMs: number, deltaMs: number, playerX: number, motion: boolean): void {
    const t = motion ? timeMs / 1000 : 0;
    this.drawSearchlights(t);
    this.moveHeli(deltaMs, playerX, motion);
    // Stepped rotor, ~10 fps, like the rest of the sketchbook.
    const frame = motion ? Math.floor(timeMs / 100) % 2 : 0;
    if (frame !== this.rotorFrame) {
      this.rotorFrame = frame;
      this.drawHeli(frame);
    }
    this.heli.setPosition(this.heliX, HELI_Y + (motion ? Math.sin(t * 1.7) * 4 : 0));
    this.drawHeliBeam(playerX, t, motion);
  }

  private drawMoon(): void {
    const g = this.scene.add.graphics().setScrollFactor(0.1, 1).setDepth(LIGHT_DEPTH);
    g.fillStyle(PAPER, 0.92);
    g.fillCircle(820, 70, 26);
    g.lineStyle(2, INK, 0.8);
    g.strokeCircle(820, 70, 26);
    // Hatched shadow side.
    g.lineStyle(1.5, INK, 0.45);
    for (let i = -18; i <= 18; i += 6) g.lineBetween(826 + i * 0.3, 70 - 22 + Math.abs(i) * 0.4, 840 + i * 0.2, 70 + i);
  }

  /** Red tape crossed over each door, hatched in ink so it reads without colour. */
  private drawTape(): void {
    const g = this.scene.add.graphics().setDepth(TAPE_DEPTH);
    for (const spot of OVERWORLD_BUILDING_SPOTS) {
      this.tapeBand(g, spot.x - 70, GROUND_Y - 118, spot.x + 70, GROUND_Y - 22);
      this.tapeBand(g, spot.x + 70, GROUND_Y - 112, spot.x - 70, GROUND_Y - 28);
    }
  }

  private tapeBand(g: Phaser.GameObjects.Graphics, x0: number, y0: number, x1: number, y1: number): void {
    const angle = Math.atan2(y1 - y0, x1 - x0);
    const length = Math.hypot(x1 - x0, y1 - y0);
    const half = 7;
    const nx = -Math.sin(angle) * half;
    const ny = Math.cos(angle) * half;
    const corners = [
      new Phaser.Math.Vector2(x0 + nx, y0 + ny),
      new Phaser.Math.Vector2(x1 + nx, y1 + ny),
      new Phaser.Math.Vector2(x1 - nx, y1 - ny),
      new Phaser.Math.Vector2(x0 - nx, y0 - ny)
    ];
    g.fillStyle(ALERT_RED, 0.95);
    g.fillPoints(corners, true);
    g.lineStyle(2, INK, 0.95);
    g.strokePoints(corners, true);
    // Ink chevrons along the tape.
    g.lineStyle(3, INK, 0.85);
    for (let d = 10; d < length - 6; d += 16) {
      const cx = x0 + Math.cos(angle) * d;
      const cy = y0 + Math.sin(angle) * d;
      g.lineBetween(
        cx + nx * 0.9,
        cy + ny * 0.9,
        cx + Math.cos(angle) * 7 - nx * 0.9,
        cy + Math.sin(angle) * 7 - ny * 0.9
      );
    }
  }

  private drawSearchlights(t: number): void {
    const g = this.lights.clear();
    SEARCHLIGHT_XS.forEach((baseX, i) => {
      const sway = Math.sin(t * (0.35 + i * 0.07) + i * 1.9) * SEARCHLIGHT_SWAY_RAD;
      const angle = -Math.PI / 2 + sway + (i % 2 === 0 ? -0.18 : 0.18);
      this.cone(g, baseX, GROUND_Y - 160, angle, 620, 0.11, 0.13);
    });
  }

  private moveHeli(deltaMs: number, playerX: number, motion: boolean): void {
    if (!motion) {
      this.heliX = Phaser.Math.Clamp(playerX - 220, 120, OVERWORLD_WIDTH - 120);
      return;
    }
    // Circles the search area: drifts past Danilo, turns, comes back. Left
    // behind (he ran), it hurries after him instead of losing him.
    if (this.heliX > playerX + HELI_ORBIT_PX) this.heliDir = -1;
    else if (this.heliX < playerX - HELI_ORBIT_PX) this.heliDir = 1;
    const behind = Math.max(0, Math.abs(playerX - this.heliX) - HELI_ORBIT_PX);
    const speed = HELI_SPEED + behind * HELI_CATCH_UP;
    this.heliX += this.heliDir * speed * (Math.min(deltaMs, 50) / 1000);
    this.heliX = Phaser.Math.Clamp(this.heliX, 60, OVERWORLD_WIDTH - 60);
  }

  private drawHeliBeam(playerX: number, t: number, motion: boolean): void {
    const g = this.heliBeam.clear();
    const fromX = this.heliX;
    const fromY = HELI_Y + 18;
    // Sweeps the ground around where Danilo is, never quite locked on, and
    // never slanted so far it lies across the street.
    const sweep = playerX + (motion ? Math.sin(t * 0.8) * 180 : -120);
    const aimX = Phaser.Math.Clamp(sweep, fromX - HELI_BEAM_REACH_PX, fromX + HELI_BEAM_REACH_PX);
    const angle = Math.atan2(GROUND_Y - fromY, aimX - fromX);
    this.cone(g, fromX, fromY, angle, Math.hypot(aimX - fromX, GROUND_Y - fromY), 0.16, 0.18);
    g.fillStyle(BEAM, 0.16);
    g.fillEllipse(aimX, GROUND_Y - 4, 150, 26);
  }

  private cone(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    angle: number,
    length: number,
    spread: number,
    alpha: number
  ): void {
    const left = angle - spread;
    const right = angle + spread;
    g.fillStyle(BEAM, alpha);
    g.fillTriangle(
      x,
      y,
      x + Math.cos(left) * length,
      y + Math.sin(left) * length,
      x + Math.cos(right) * length,
      y + Math.sin(right) * length
    );
    g.lineStyle(1, BEAM, alpha * 1.6);
    g.lineBetween(x, y, x + Math.cos(left) * length, y + Math.sin(left) * length);
    g.lineBetween(x, y, x + Math.cos(right) * length, y + Math.sin(right) * length);
  }

  /** An ink helicopter: bubble cab, tail boom, skids, a rotor in two stepped frames. */
  private drawHeli(frame: number): void {
    const g = this.heli.clear();
    g.setScale(this.heliDir, 1);
    g.fillStyle(INK, 1);
    g.fillEllipse(0, 0, 58, 30);
    g.fillRect(-58, -5, 40, 7);
    g.fillTriangle(-62, -14, -52, -3, -58, 4);
    g.fillStyle(PAPER, 0.9);
    g.fillEllipse(14, -3, 22, 14);
    g.lineStyle(2.5, INK, 1);
    g.lineBetween(-16, 20, 22, 20);
    g.lineBetween(-10, 14, -12, 20);
    g.lineBetween(14, 14, 16, 20);
    g.lineBetween(0, -15, 0, -21);
    g.lineStyle(3, INK, 1);
    if (frame === 0) g.lineBetween(-46, -22, 46, -20);
    else g.lineBetween(-28, -25, 28, -17);
    // Nav light: steady red, never blinking.
    g.fillStyle(ALERT_RED, 1);
    g.fillCircle(-60, -12, 3);
  }
}
