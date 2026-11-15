// Drawing-table presentation: pointer gestures and per-phase drawing branch by design.
// fallow-ignore-file complexity
import * as Phaser from 'phaser';
import {
  addBeam,
  cellDistance,
  designJoints,
  DRAFTSPERSON_SKETCH,
  isInBuildArea,
  type BridgeBuildAction,
  type BridgeDesign,
  type BridgeSim,
  type BridgeWorkbench,
  type GridPoint
} from '@/game/core/ridge';
import { prefersReducedMotion } from '@/game/sharedSceneRuntime/motion/sketchMotion';
import { drawInkBeam, drawInkBolt, drawInkJoint, type InkBeam } from '../art/stick/bridgeInk';
import { INK, PAPER, PAPER_WARM } from '../art/stick/palette';
import type { RidgeBridgeTool } from '../sceneUi/RidgeBridgeBuilderPanel';

/** Joints within this many cells of the pointer can be grabbed. */
const GRAB_CELLS = 0.55;
/** World units of slack when tapping or erasing a beam. */
const BEAM_HIT = 9;
const PULSE_MS = 700;
const DEBRIS_LIFE_MS = 1600;
/** Dashes around the reach circle; even so dash and gap alternate cleanly. */
const REACH_DASHES = 28;
const SPLASH_LIFE_MS = 900;

/** Below this many world units of droop, the drawing counts as holding still. */
const PREVIEW_STILL = 4;

const DEPTH = {
  sheet: 17,
  preview: 20,
  beams: 22,
  car: 23,
  fx: 24,
  ghost: 25
} as const;

interface Debris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  half: number;
  width: number;
  born: number;
}

interface Splash {
  x: number;
  born: number;
}

type Drag =
  | { kind: 'beam'; from: GridPoint; to: GridPoint | null; moved: boolean }
  | { kind: 'erase' };

export interface BridgeBuilderViewOptions {
  originX: number;
  originY: number;
  /** Apply a workbench edit through the Ridge session. */
  onAction: (action: BridgeBuildAction) => void;
}

/**
 * Phaser view over the Blueprint Bridge workbench: blueprint sheet, bolts,
 * beams, drag-to-draw, eraser, hint ghost, and the animated toy-car test.
 * All decisions go back through `onAction`; this only reads the workbench.
 */
export class BridgeBuilderView {
  private readonly scene: Phaser.Scene;
  private readonly originX: number;
  private readonly originY: number;
  private readonly onAction: (action: BridgeBuildAction) => void;
  private readonly sheet: Phaser.GameObjects.Graphics;
  private readonly beams: Phaser.GameObjects.Graphics;
  private readonly car: Phaser.GameObjects.Graphics;
  private readonly fx: Phaser.GameObjects.Graphics;
  private readonly ghost: Phaser.GameObjects.Graphics;
  private readonly preview: Phaser.GameObjects.Graphics;
  private workbench: BridgeWorkbench | null = null;
  private tool: RidgeBridgeTool = 'road';
  private drag: Drag | null = null;
  private hover: { x: number; y: number } | null = null;
  private pulseAt = -Infinity;
  private debris: Debris[] = [];
  private splashes: Splash[] = [];
  private lastSim: BridgeSim | null = null;
  private splashed = false;
  private sheetKey = '';
  private reachCache: { key: string; design: BridgeDesign; points: GridPoint[] } | null = null;

  constructor(scene: Phaser.Scene, options: BridgeBuilderViewOptions) {
    this.scene = scene;
    this.originX = options.originX;
    this.originY = options.originY;
    this.onAction = options.onAction;
    this.sheet = scene.add.graphics().setDepth(DEPTH.sheet);
    this.beams = scene.add.graphics().setDepth(DEPTH.beams);
    this.car = scene.add.graphics().setDepth(DEPTH.car);
    this.fx = scene.add.graphics().setDepth(DEPTH.fx);
    this.ghost = scene.add.graphics().setDepth(DEPTH.ghost);
    this.preview = scene.add.graphics().setDepth(DEPTH.preview);
    drawToyCar(this.car);

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    scene.input.on(Phaser.Input.Events.GAME_OUT, this.onPointerOut, this);
    scene.input.mouse?.disableContextMenu();
  }

  setTool(tool: RidgeBridgeTool): void {
    this.tool = tool;
    this.drag = null;
  }

  /** Called after every fixed sim step so snaps become debris exactly once. */
  afterSimStep(sim: BridgeSim): void {
    const now = this.scene.time.now;
    for (const snap of sim.snapsThisStep) {
      const beam = sim.beams[snap.beamIndex]!;
      const a = sim.joints[beam.a]!;
      const b = sim.joints[beam.b]!;
      this.spawnDebris(a.x, a.y, snap.x, snap.y, beam.material, now);
      this.spawnDebris(snap.x, snap.y, b.x, b.y, beam.material, now);
    }
    if (sim.status === 'splashed' && !this.splashed) {
      this.splashed = true;
      this.splashes.push({ x: this.originX + sim.carPose().x, born: now });
    }
  }

  sync(workbench: BridgeWorkbench): void {
    this.workbench = workbench;
    const now = this.scene.time.now;
    const motion = !prefersReducedMotion();
    if (workbench.sim !== this.lastSim) {
      this.lastSim = workbench.sim;
      this.splashed = false;
    }
    if (workbench.phase !== 'editing') this.drag = null;

    this.drawSheet(workbench);
    this.beams.clear();
    this.ghost.clear();
    this.preview.clear();
    this.fx.clear();

    const running = workbench.phase !== 'editing' && workbench.sim;
    if (running) {
      this.drawRun(workbench.sim!, now, motion);
    } else {
      this.drawDesign(workbench, now);
      this.placeCar(-workbench.puzzle.car.startOffset + workbench.puzzle.car.wheelBase / 2, -workbench.puzzle.car.wheelRadius, 0);
    }
    this.drawFx(now, motion, workbench.phase === 'passed' ? workbench.sim : null);
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    this.scene.input.off(Phaser.Input.Events.GAME_OUT, this.onPointerOut, this);
    this.sheet.destroy();
    this.beams.destroy();
    this.car.destroy();
    this.fx.destroy();
    this.ghost.destroy();
    this.preview.destroy();
  }

  // --- drawing ------------------------------------------------------------

  /** Blueprint paper, dot grid, bolts, and finish pennant. Static per hint state. */
  private drawSheet(workbench: BridgeWorkbench): void {
    const key = `${workbench.hintVisible}`;
    if (key === this.sheetKey) return;
    this.sheetKey = key;

    const { puzzle } = workbench;
    const g = this.sheet;
    g.clear();
    const left = this.originX - 8;
    const top = this.originY + puzzle.minRow * puzzle.cell - 16;
    const width = puzzle.columns * puzzle.cell + 16;
    const height = (puzzle.maxRow - puzzle.minRow) * puzzle.cell + 26;

    g.fillStyle(PAPER_WARM, 0.62);
    g.fillRect(left, top, width, height);
    // No bottom edge: a dashed line there read as a floor. Below the deck is
    // only air and river; the bolts are the sole ground.
    g.lineStyle(1.6, INK, 0.4);
    strokeDashedLine(g, left, top + height, left, top, 7, 5);
    strokeDashedLine(g, left, top, left + width, top, 7, 5);
    strokeDashedLine(g, left + width, top, left + width, top + height, 7, 5);
    drawRiverInk(g, this.originX, this.originY + puzzle.waterDepth, puzzle.columns * puzzle.cell);
    // Tape corners hold the sheet to the page.
    g.fillStyle(PAPER, 0.85);
    g.lineStyle(1.2, INK, 0.35);
    for (const [x, y, r] of [
      [left, top, -0.5],
      [left + width, top, 0.5]
    ] as const) {
      g.save();
      g.translateCanvas(x, y);
      g.rotateCanvas(r);
      g.fillRect(-12, -5, 24, 10);
      g.strokeRect(-12, -5, 24, 10);
      g.restore();
    }

    g.fillStyle(INK, 0.32);
    for (let gx = 0; gx <= puzzle.columns; gx += 1) {
      for (let gy = puzzle.minRow; gy <= puzzle.maxRow; gy += 1) {
        g.fillCircle(this.originX + gx * puzzle.cell, this.originY + gy * puzzle.cell, 1.6);
      }
    }

    if (workbench.hintVisible) {
      g.lineStyle(2.4, INK, 0.22);
      for (const beam of DRAFTSPERSON_SKETCH) {
        const a = this.toWorld(beam.a);
        const b = this.toWorld(beam.b);
        strokeDashedLine(g, a.x, a.y, b.x, b.y, 6, 5);
      }
    }

    for (const anchor of puzzle.anchors) {
      const p = this.toWorld(anchor);
      drawInkBolt(g, p.x, p.y, anchor.x === 0 ? -1 : 1);
    }

    // Finish pennant on the far bank: where the car is headed.
    const fx = this.originX + puzzle.columns * puzzle.cell + 40;
    const fy = this.originY;
    g.lineStyle(2.2, INK, 0.9);
    g.lineBetween(fx, fy, fx, fy - 30);
    g.fillStyle(INK, 0.9);
    g.fillTriangle(fx, fy - 30, fx + 15, fy - 25, fx, fy - 20);
  }

  private drawDesign(workbench: BridgeWorkbench, now: number): void {
    const { design } = workbench;
    const g = this.beams;
    const eraseTarget =
      this.tool === 'eraser' && this.hover ? this.beamIndexAt(design, this.hover.x, this.hover.y) : -1;
    const snapped = this.drawPreview(workbench);

    design.forEach((beam, index) => {
      const ink = this.inkBeam(beam.a, beam.b, beam.material);
      // Members that would snap under their own weight wear strain hatching.
      drawInkBeam(g, ink, {
        alpha: index === eraseTarget ? 0.3 : 1,
        stress: snapped.has(index) ? 1 : 0
      });
    });
    for (const joint of designJoints(workbench.puzzle, design)) {
      if (workbench.puzzle.anchors.some((a) => a.x === joint.x && a.y === joint.y)) continue;
      const p = this.toWorld(joint);
      drawInkJoint(g, p.x, p.y);
    }

    if (workbench.lastBreak) {
      drawScribbleX(g, this.originX + workbench.lastBreak.x, this.originY + workbench.lastBreak.y);
    }

    this.drawGhost(workbench, now);
  }

  /**
   * Faint pencil of the drawing settled under its own weight, so floppy parts
   * visibly droop before the test. Returns beams that would snap doing so.
   */
  private drawPreview(workbench: BridgeWorkbench): Set<number> {
    const snapped = new Set<number>();
    const { design, puzzle } = workbench;
    if (design.length === 0) return snapped;
    const sim = workbench.preview;
    let droop = 0;
    design.forEach((spec, index) => {
      const beam = sim.beams[index]!;
      if (beam.broken) snapped.add(index);
      for (const [point, joint] of [
        [spec.a, sim.joints[beam.a]!],
        [spec.b, sim.joints[beam.b]!]
      ] as const) {
        droop = Math.max(droop, Math.hypot(joint.x - point.x * puzzle.cell, joint.y - point.y * puzzle.cell));
      }
    });
    if (droop < PREVIEW_STILL) return snapped;

    const g = this.preview;
    const floor = puzzle.waterDepth;
    for (const beam of sim.beams) {
      if (beam.broken) continue;
      const a = sim.joints[beam.a]!;
      const b = sim.joints[beam.b]!;
      g.lineStyle(beam.material === 'road' ? 3.2 : 2, INK, 0.3);
      strokeDashedLine(
        g,
        this.originX + a.x,
        this.originY + Math.min(a.y, floor),
        this.originX + b.x,
        this.originY + Math.min(b.y, floor),
        4,
        4
      );
    }
    return snapped;
  }

  private drawGhost(workbench: BridgeWorkbench, now: number): void {
    const g = this.ghost;
    const pulse = now - this.pulseAt < PULSE_MS ? 1 - (now - this.pulseAt) / PULSE_MS : 0;

    if (pulse > 0) {
      g.lineStyle(2, INK, 0.7 * pulse);
      for (const joint of designJoints(workbench.puzzle, workbench.design)) {
        const p = this.toWorld(joint);
        g.strokeCircle(p.x, p.y, 8 + (1 - pulse) * 10);
      }
    }

    const drag = this.drag;
    if (drag?.kind === 'beam') {
      const from = this.toWorld(drag.from);
      this.drawReach(workbench, drag.from, drag.to, 1);
      g.lineStyle(2, INK, 0.8);
      g.strokeCircle(from.x, from.y, 8);
      if (drag.to) {
        const to = this.toWorld(drag.to);
        const material = this.tool === 'wood' ? 'wood' : 'road';
        drawInkBeam(g, { ax: from.x, ay: from.y, bx: to.x, by: to.y, material }, { alpha: 0.45 });
        g.lineStyle(2, INK, 0.9);
        g.strokeCircle(to.x, to.y, 6);
        // Dragged past reach: a dotted rubber band shows the beam stopped short.
        const hover = this.hover;
        const reach = workbench.puzzle.maxBeamCells * workbench.puzzle.cell;
        if (hover && Math.hypot(hover.x - from.x, hover.y - from.y) > reach + 6) {
          g.lineStyle(1.4, INK, 0.45);
          strokeDashedLine(g, to.x, to.y, hover.x, hover.y, 2, 4);
          g.strokeCircle(hover.x, hover.y, 3);
        }
      }
      return;
    }

    // Hover: show what a press would grab, and how far a beam from it can go.
    if (!this.hover || this.tool === 'eraser') return;
    const joint = this.jointNear(workbench, this.hover.x, this.hover.y);
    if (joint) {
      this.drawReach(workbench, joint, null, 0.45);
      const p = this.toWorld(joint);
      g.lineStyle(2, INK, 0.55);
      g.strokeCircle(p.x, p.y, 9);
    }
  }

  /**
   * Poly-Bridge-style reach: a dashed pencil compass circle at max beam length
   * around the start joint, plus a small ring on every legal end point.
   */
  private drawReach(
    workbench: BridgeWorkbench,
    from: GridPoint,
    target: GridPoint | null,
    strength: number
  ): void {
    const g = this.ghost;
    const { puzzle } = workbench;
    const center = this.toWorld(from);
    const radius = puzzle.maxBeamCells * puzzle.cell;

    g.lineStyle(1.4, INK, 0.38 * strength);
    const step = (Math.PI * 2) / REACH_DASHES;
    for (let i = 0; i < REACH_DASHES; i += 2) {
      g.beginPath();
      g.arc(center.x, center.y, radius, i * step, (i + 1) * step);
      g.strokePath();
    }

    for (const point of this.reachablePoints(workbench, from)) {
      if (target && point.x === target.x && point.y === target.y) continue;
      const p = this.toWorld(point);
      g.lineStyle(1.3, INK, 0.5 * strength);
      g.strokeCircle(p.x, p.y, 4.5);
    }
  }

  /** Grid points a beam from `from` may legally end on. Cached per design. */
  private reachablePoints(workbench: BridgeWorkbench, from: GridPoint): GridPoint[] {
    const { puzzle, design } = workbench;
    const key = `${from.x},${from.y}`;
    const cached = this.reachCache;
    if (cached && cached.key === key && cached.design === design) return cached.points;

    const reach = Math.ceil(puzzle.maxBeamCells);
    const points: GridPoint[] = [];
    for (let dx = -reach; dx <= reach; dx += 1) {
      for (let dy = -reach; dy <= reach; dy += 1) {
        const candidate = { x: from.x + dx, y: from.y + dy };
        if ((dx === 0 && dy === 0) || !isInBuildArea(puzzle, candidate)) continue;
        if (cellDistance(from, candidate) > puzzle.maxBeamCells) continue;
        if (!addBeam(puzzle, design, from, candidate, 'wood').ok) continue;
        points.push(candidate);
      }
    }
    this.reachCache = { key, design, points };
    return points;
  }

  private drawRun(sim: BridgeSim, now: number, motion: boolean): void {
    const g = this.beams;
    const wobble = motion ? Math.sin(now * 0.05) : 0;
    for (const beam of sim.beams) {
      if (beam.broken) continue;
      const a = sim.joints[beam.a]!;
      const b = sim.joints[beam.b]!;
      drawInkBeam(
        g,
        {
          ax: this.originX + a.x,
          ay: this.originY + a.y,
          bx: this.originX + b.x,
          by: this.originY + b.y,
          material: beam.material
        },
        { stress: beam.stress, wobble }
      );
    }
    for (const joint of sim.joints) {
      if (joint.invMass === 0) continue;
      drawInkJoint(g, this.originX + joint.x, this.originY + joint.y);
    }
    const pose = sim.carPose();
    // A sunk car bobs at the water line instead of vanishing off the page.
    const floatY = (this.workbench?.puzzle.waterDepth ?? 84) - 4;
    if (pose.y > floatY) {
      const bob = motion ? Math.sin(now * 0.006) * 1.5 : 0;
      this.placeCar(pose.x, floatY + bob, motion ? Math.sin(now * 0.004) * 0.12 : 0);
      return;
    }
    this.placeCar(pose.x, pose.y, pose.angle);
  }

  private placeCar(x: number, y: number, angle: number): void {
    this.car.setPosition(this.originX + x, this.originY + y).setRotation(angle);
  }

  private drawFx(now: number, motion: boolean, passedSim: BridgeSim | null): void {
    const g = this.fx;
    const waterY = this.originY + (this.workbench?.puzzle.waterDepth ?? 84);

    this.debris = this.debris.filter((piece) => now - piece.born < DEBRIS_LIFE_MS);
    for (const piece of this.debris) {
      const t = (now - piece.born) / 1000;
      const x = piece.x + piece.vx * t;
      const y = Math.min(waterY, piece.y + piece.vy * t + 450 * t * t);
      const angle = piece.angle + (y < waterY ? piece.spin * t : 0);
      const alpha = 1 - (now - piece.born) / DEBRIS_LIFE_MS;
      const cx = Math.cos(angle) * piece.half;
      const cy = Math.sin(angle) * piece.half;
      g.lineStyle(piece.width, INK, alpha);
      g.lineBetween(x - cx, y - cy, x + cx, y + cy);
    }

    this.splashes = this.splashes.filter((s) => now - s.born < SPLASH_LIFE_MS);
    for (const splash of this.splashes) {
      const p = (now - splash.born) / SPLASH_LIFE_MS;
      g.lineStyle(2, INK, 1 - p);
      for (let i = 0; i < 6; i += 1) {
        const dir = i < 3 ? -1 : 1;
        const spread = (i % 3) + 1;
        const x = splash.x + dir * spread * 7 * p * 2;
        const y = waterY - Math.sin(p * Math.PI) * (12 + spread * 6);
        g.fillStyle(INK, 1 - p);
        g.fillCircle(x, y, 2.4 - spread * 0.4);
      }
      g.strokeEllipse(splash.x, waterY + 2, 20 + p * 40, 4 + p * 6);
    }

    if (passedSim) {
      const pose = passedSim.carPose();
      const cx = this.originX + pose.x;
      const cy = this.originY + pose.y - 26;
      const spin = motion ? now * 0.004 : 0;
      for (let i = 0; i < 5; i += 1) {
        const a = spin + (i / 5) * Math.PI * 2;
        drawSparkle(g, cx + Math.cos(a) * 22, cy + Math.sin(a) * 10, 4 + (i % 2) * 2);
      }
    }
  }

  private spawnDebris(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    material: 'road' | 'wood',
    now: number
  ): void {
    const x = this.originX + (ax + bx) / 2;
    const y = this.originY + (ay + by) / 2;
    const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    const r = seed - Math.floor(seed);
    this.debris.push({
      x,
      y,
      vx: (r - 0.5) * 60,
      vy: -40 - r * 50,
      angle: Math.atan2(by - ay, bx - ax),
      spin: (r - 0.5) * 9,
      half: Math.hypot(bx - ax, by - ay) / 2,
      width: material === 'road' ? 6 : 3,
      born: now
    });
  }

  // --- input --------------------------------------------------------------

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    const workbench = this.workbench;
    if (!workbench || workbench.phase !== 'editing') return;
    const world = this.worldPoint(pointer);
    this.hover = world;

    if (pointer.rightButtonDown() || this.tool === 'eraser') {
      this.drag = { kind: 'erase' };
      this.eraseAt(workbench.design, world.x, world.y);
      return;
    }

    const joint = this.jointNear(workbench, world.x, world.y);
    if (joint) {
      this.drag = { kind: 'beam', from: joint, to: null, moved: false };
      return;
    }

    // Tapping an existing beam repaints it with the current tool.
    const index = this.beamIndexAt(workbench.design, world.x, world.y);
    if (index >= 0) {
      const beam = workbench.design[index]!;
      const material = this.tool === 'wood' ? 'wood' : 'road';
      if (beam.material !== material) this.onAction({ kind: 'add', material, a: beam.a, b: beam.b });
      return;
    }

    // Pressed empty paper: remind the player where beams start.
    this.pulseAt = this.scene.time.now;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    const workbench = this.workbench;
    if (!workbench || workbench.phase !== 'editing') return;
    const world = this.worldPoint(pointer);
    this.hover = world;
    const drag = this.drag;
    if (!drag || !pointer.isDown) return;

    if (drag.kind === 'erase') {
      this.eraseAt(workbench.design, world.x, world.y);
      return;
    }
    drag.moved = true;
    drag.to = this.snapEnd(workbench, drag.from, world.x, world.y);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    const drag = this.drag;
    this.drag = null;
    const workbench = this.workbench;
    if (!workbench || workbench.phase !== 'editing' || drag?.kind !== 'beam') return;
    const world = this.worldPoint(pointer);
    const to = drag.to ?? this.snapEnd(workbench, drag.from, world.x, world.y);
    if (!to) return;
    this.onAction({
      kind: 'add',
      material: this.tool === 'wood' ? 'wood' : 'road',
      a: drag.from,
      b: to
    });
  }

  private onPointerOut(): void {
    this.hover = null;
  }

  private eraseAt(design: BridgeDesign, x: number, y: number): void {
    const index = this.beamIndexAt(design, x, y);
    if (index >= 0) this.onAction({ kind: 'erase', index });
  }

  /**
   * Nearest grid point the beam may legally reach. Past max length the end
   * slides along the drag direction instead of refusing, like a stretchy rule.
   */
  private snapEnd(workbench: BridgeWorkbench, from: GridPoint, x: number, y: number): GridPoint | null {
    const fromWorld = this.toWorld(from);
    if (Math.hypot(x - fromWorld.x, y - fromWorld.y) < workbench.puzzle.cell * 0.4) return null;

    let best: GridPoint | null = null;
    let bestDistance = Infinity;
    for (const candidate of this.reachablePoints(workbench, from)) {
      const p = this.toWorld(candidate);
      const distance = Math.hypot(p.x - x, p.y - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }
    return best;
  }

  private jointNear(workbench: BridgeWorkbench, x: number, y: number): GridPoint | null {
    const limit = workbench.puzzle.cell * GRAB_CELLS;
    let best: GridPoint | null = null;
    let bestDistance = limit;
    for (const joint of designJoints(workbench.puzzle, workbench.design)) {
      const p = this.toWorld(joint);
      const distance = Math.hypot(p.x - x, p.y - y);
      if (distance <= bestDistance) {
        bestDistance = distance;
        best = joint;
      }
    }
    return best;
  }

  private beamIndexAt(design: BridgeDesign, x: number, y: number): number {
    let best = -1;
    let bestDistance = BEAM_HIT;
    design.forEach((beam, index) => {
      const a = this.toWorld(beam.a);
      const b = this.toWorld(beam.b);
      const distance = distanceToSegment(x, y, a.x, a.y, b.x, b.y);
      if (distance <= bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  }

  private worldPoint(pointer: Phaser.Input.Pointer): { x: number; y: number } {
    const p = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    return { x: p.x, y: p.y };
  }

  private toWorld(point: GridPoint): { x: number; y: number } {
    const cell = this.workbench?.puzzle.cell ?? 36;
    return { x: this.originX + point.x * cell, y: this.originY + point.y * cell };
  }

  private inkBeam(a: GridPoint, b: GridPoint, material: 'road' | 'wood'): InkBeam {
    const pa = this.toWorld(a);
    const pb = this.toWorld(b);
    return { ax: pa.x, ay: pa.y, bx: pb.x, by: pb.y, material };
  }
}

/** Toy car around its axle midpoint, matching the sim's wheel base and radius. */
function drawToyCar(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(PAPER, 1);
  g.lineStyle(2.5, INK, 1);
  g.fillRect(-14, -15, 28, 11);
  g.strokeRect(-14, -15, 28, 11);
  g.beginPath();
  g.moveTo(-7, -15);
  g.lineTo(-3, -22);
  g.lineTo(6, -22);
  g.lineTo(10, -15);
  g.closePath();
  g.fillPath();
  g.strokePath();
  g.fillStyle(PAPER, 1);
  for (const x of [-8.5, 8.5]) {
    g.fillCircle(x, 0, 5);
    g.strokeCircle(x, 0, 5);
    g.fillStyle(INK, 1);
    g.fillCircle(x, 0, 1.4);
    g.fillStyle(PAPER, 1);
  }
}

function drawScribbleX(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.lineStyle(2.6, INK, 0.75);
  g.lineBetween(x - 7, y - 6, x + 7, y + 7);
  g.lineBetween(x + 6, y - 7, x - 6, y + 6);
  g.lineStyle(1.2, INK, 0.5);
  g.strokeCircle(x, y, 11);
}

function drawSparkle(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number): void {
  g.lineStyle(2, INK, 0.85);
  g.lineBetween(x - r, y, x + r, y);
  g.lineBetween(x, y - r, x, y + r);
  g.lineStyle(1.2, INK, 0.6);
  g.lineBetween(x - r * 0.6, y - r * 0.6, x + r * 0.6, y + r * 0.6);
  g.lineBetween(x - r * 0.6, y + r * 0.6, x + r * 0.6, y - r * 0.6);
}

function strokeDashedLine(
  g: Phaser.GameObjects.Graphics,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  dash: number,
  gap: number
): void {
  const len = Math.hypot(bx - ax, by - ay);
  if (len === 0) return;
  const ux = (bx - ax) / len;
  const uy = (by - ay) / len;
  for (let d = 0; d < len; d += dash + gap) {
    const e = Math.min(len, d + dash);
    g.lineBetween(ax + ux * d, ay + uy * d, ax + ux * e, ay + uy * e);
  }
}

/** Wavy ink across the gap at the water line: nothing to stand on down there. */
function drawRiverInk(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number): void {
  for (const [dy, alpha] of [
    [0, 0.55],
    [7, 0.3]
  ] as const) {
    g.lineStyle(1.6, INK, alpha);
    g.beginPath();
    g.moveTo(x, y + dy);
    for (let d = 6; d <= width; d += 6) {
      g.lineTo(x + d, y + dy + (d % 12 === 0 ? 0 : 2.2));
    }
    g.strokePath();
  }
}

function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}
