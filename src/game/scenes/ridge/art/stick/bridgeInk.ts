import type * as Phaser from 'phaser';
import { BLUEPRINT_BRIDGE_PUZZLE, settleBridge, type BridgeDesign, type BridgeMaterial } from '@/game/core/ridge';
import { INK, PAPER, PAPER_WARM } from './palette';

/**
 * Ink language for Blueprint Bridge members, shared by the drawing table and
 * the finished crossing so the bridge you drew is the bridge you walk on.
 *
 * Monochrome only: strain reads through line wobble and hatch ticks, never hue.
 */

export interface InkBeam {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  material: BridgeMaterial;
}

const ROAD_WIDTH = 7;
const WOOD_WIDTH = 3.4;

export function drawInkBeam(
  g: Phaser.GameObjects.Graphics,
  beam: InkBeam,
  options: { stress?: number; wobble?: number; alpha?: number } = {}
): void {
  const { ax, ay, bx, by } = beam;
  const stress = options.stress ?? 0;
  const alpha = options.alpha ?? 1;
  const strain = Math.max(0, stress - 0.45) / 0.55;
  const amp = strain * strain * 3.2 * (options.wobble ?? 0);

  if (beam.material === 'road') {
    strokeWobbly(g, beam, ROAD_WIDTH + strain * 2, INK, alpha, amp);
    // Paper core makes the plank read as a board, not a thick pen line.
    strokeWobbly(g, beam, 2.2, PAPER_WARM, alpha, amp);
    drawPlankTicks(g, beam, alpha);
  } else {
    strokeWobbly(g, beam, WOOD_WIDTH + strain * 1.6, INK, alpha, amp);
    // A faint second pass, like a pencil line gone over twice.
    g.lineStyle(1.2, INK, 0.28 * alpha);
    g.lineBetween(ax + 1.2, ay - 1, bx + 1.2, by - 1);
  }

  if (strain > 0.35) drawStrainTicks(g, beam, (strain - 0.35) / 0.65, alpha);
}

function strokeWobbly(
  g: Phaser.GameObjects.Graphics,
  beam: InkBeam,
  width: number,
  color: number,
  alpha: number,
  amp: number
): void {
  g.lineStyle(width, color, alpha);
  if (amp < 0.15) {
    g.lineBetween(beam.ax, beam.ay, beam.bx, beam.by);
    return;
  }
  const dx = beam.bx - beam.ax;
  const dy = beam.by - beam.ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const steps = 4;
  g.beginPath();
  g.moveTo(beam.ax, beam.ay);
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const off = (i % 2 === 0 ? -1 : 1) * amp;
    g.lineTo(beam.ax + dx * t + nx * off, beam.ay + dy * t + ny * off);
  }
  g.lineTo(beam.bx, beam.by);
  g.strokePath();
}

function drawPlankTicks(g: Phaser.GameObjects.Graphics, beam: InkBeam, alpha: number): void {
  const dx = beam.bx - beam.ax;
  const dy = beam.by - beam.ay;
  const len = Math.hypot(dx, dy);
  if (len < 14) return;
  const nx = -dy / len;
  const ny = dx / len;
  g.lineStyle(1.4, INK, 0.7 * alpha);
  for (let d = 12; d < len - 6; d += 12) {
    const t = d / len;
    const x = beam.ax + dx * t;
    const y = beam.ay + dy * t;
    g.lineBetween(x - nx * 3, y - ny * 3, x + nx * 3, y + ny * 3);
  }
}

/** Short cross-hatch dashes that crowd a member as it nears its limit. */
function drawStrainTicks(g: Phaser.GameObjects.Graphics, beam: InkBeam, amount: number, alpha: number): void {
  const dx = beam.bx - beam.ax;
  const dy = beam.by - beam.ay;
  const len = Math.hypot(dx, dy);
  if (len < 8) return;
  const nx = -dy / len;
  const ny = dx / len;
  const spacing = 9 - amount * 4;
  const reach = 4 + amount * 4;
  g.lineStyle(1.6, INK, (0.35 + amount * 0.55) * alpha);
  for (let d = spacing / 2; d < len; d += spacing) {
    const t = d / len;
    const x = beam.ax + dx * t;
    const y = beam.ay + dy * t;
    g.lineBetween(
      x - nx * reach - (dx / len) * 2,
      y - ny * reach - (dy / len) * 2,
      x + nx * reach + (dx / len) * 2,
      y + ny * reach + (dy / len) * 2
    );
  }
}

export function drawInkJoint(g: Phaser.GameObjects.Graphics, x: number, y: number, alpha = 1): void {
  g.fillStyle(PAPER, alpha);
  g.fillCircle(x, y, 3.6);
  g.lineStyle(2, INK, alpha);
  g.strokeCircle(x, y, 3.6);
}

/** A bank bolt: a hatched plate pinned into the cliff with a fat rivet. */
export function drawInkBolt(g: Phaser.GameObjects.Graphics, x: number, y: number, side: -1 | 1): void {
  g.fillStyle(PAPER_WARM, 1);
  g.fillRect(side < 0 ? x - 11 : x, y - 7, 11, 14);
  g.lineStyle(2, INK, 0.9);
  g.strokeRect(side < 0 ? x - 11 : x, y - 7, 11, 14);
  g.fillStyle(INK, 1);
  g.fillCircle(x, y, 5.4);
  g.fillStyle(PAPER, 1);
  g.fillCircle(x, y, 2);
}

export interface BuiltBridgeShape {
  beams: InkBeam[];
}

const shapeCache = new WeakMap<BridgeDesign, BuiltBridgeShape>();

/**
 * World-space settled shape of a proven design, sagged under its own weight the
 * way it really hangs. Cached per design so scenery rebakes and per-frame deck
 * height lookups do not resimulate.
 */
export function builtBridgeShape(design: BridgeDesign, originX: number, originY: number): BuiltBridgeShape {
  const cached = shapeCache.get(design);
  if (cached) return cached;
  const sim = settleBridge(BLUEPRINT_BRIDGE_PUZZLE, design);
  const beams: InkBeam[] = [];
  for (const beam of sim.beams) {
    if (beam.broken) continue;
    const a = sim.joints[beam.a]!;
    const b = sim.joints[beam.b]!;
    beams.push({
      ax: originX + a.x,
      ay: originY + a.y,
      bx: originX + b.x,
      by: originY + b.y,
      material: beam.material
    });
  }
  // Support first, road on top: the deck should overlap the truss lines.
  beams.sort((l, r) => (l.material === r.material ? 0 : l.material === 'wood' ? -1 : 1));
  const shape = { beams };
  shapeCache.set(design, shape);
  return shape;
}

/** Top of the road surface at world x, or null where no road spans it. */
export function deckTopAt(shape: BuiltBridgeShape, x: number): number | null {
  let best: number | null = null;
  for (const beam of shape.beams) {
    if (beam.material !== 'road') continue;
    const minX = Math.min(beam.ax, beam.bx);
    const maxX = Math.max(beam.ax, beam.bx);
    if (x < minX || x > maxX || maxX - minX < 1e-3) continue;
    const t = (x - beam.ax) / (beam.bx - beam.ax);
    const y = beam.ay + (beam.by - beam.ay) * t - ROAD_WIDTH / 2;
    if (best === null || y < best) best = y;
  }
  return best;
}

export function drawBuiltBridge(g: Phaser.GameObjects.Graphics, shape: BuiltBridgeShape): void {
  for (const beam of shape.beams) drawInkBeam(g, beam);
  const seen = new Set<string>();
  for (const beam of shape.beams) {
    for (const [x, y] of [
      [beam.ax, beam.ay],
      [beam.bx, beam.by]
    ] as const) {
      const key = `${Math.round(x)},${Math.round(y)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      drawInkJoint(g, x, y);
    }
  }
}
