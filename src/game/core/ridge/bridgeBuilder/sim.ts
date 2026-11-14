// A compact XPBD solver: the per-step loops are the physics, not branch soup.
// fallow-ignore-file complexity
import type { BridgeDesign } from './design';
import { gridKey, isAnchor, type BridgeMaterial, type BridgePuzzle } from './puzzle';

/**
 * Deterministic bridge test. Beams are XPBD distance constraints that snap
 * when their axial force passes the material strength; the toy car is two
 * wheels on a rigid axle that only touch road members and the banks.
 *
 * Fixed timestep only: the same design always produces the same run, so the
 * console, tests, and the animated Phaser run agree on the outcome.
 */

export const BRIDGE_SIM_DT = 1 / 60;
const SUBSTEPS = 16;
const H = BRIDGE_SIM_DT / SUBSTEPS;
const DAMPING = 0.9992;
/** How quickly a grounded wheel matches the motor speed along the surface. */
const TRACTION = 0.08;
/** World units past the far bank edge that count as arrived. */
const FINISH_MARGIN = 34;
const BANK_REACH = 400;
const GRAVITY_RAMP_SECONDS = 0.45;
const STRESS_SMOOTHING = 0.06;

export type BridgeRunStatus = 'settling' | 'driving' | 'passed' | 'splashed' | 'stuck';

export type BridgeFailure = Extract<BridgeRunStatus, 'splashed' | 'stuck'>;

export interface SimJoint {
  x: number;
  y: number;
  px: number;
  py: number;
  invMass: number;
}

export interface SimBeam {
  a: number;
  b: number;
  material: BridgeMaterial;
  rest: number;
  compliance: number;
  strength: number;
  lambda: number;
  /** |force| / strength from the last substep, 0..1+ for stress drawing. */
  stress: number;
  broken: boolean;
}

interface Wheel {
  x: number;
  y: number;
  px: number;
  py: number;
  grounded: boolean;
  tx: number;
  ty: number;
}

export interface BridgeCarPose {
  x: number;
  y: number;
  angle: number;
  /** Rear and front wheel centres. */
  wheels: readonly [{ x: number; y: number }, { x: number; y: number }];
}

export interface BridgeSnapEvent {
  beamIndex: number;
  x: number;
  y: number;
  time: number;
}

export class BridgeSim {
  readonly joints: SimJoint[] = [];
  readonly beams: SimBeam[] = [];
  /** Beams that broke during the last {@link step}. Cleared each step. */
  readonly snapsThisStep: BridgeSnapEvent[] = [];
  status: BridgeRunStatus = 'settling';
  time = 0;
  /** Highest stress any member reached this run. */
  peakStress = 0;
  firstSnap: BridgeSnapEvent | null = null;

  private readonly puzzle: BridgePuzzle;
  private readonly wheels: [Wheel, Wheel];
  private readonly wheelInvMass: number;
  private readonly withCar: boolean;
  private readonly finishX: number;

  constructor(puzzle: BridgePuzzle, design: BridgeDesign, options: { withCar?: boolean } = {}) {
    this.puzzle = puzzle;
    this.withCar = options.withCar ?? true;
    this.finishX = puzzle.columns * puzzle.cell + FINISH_MARGIN;
    this.buildStructure(design);

    const r = puzzle.car.wheelRadius;
    const rearX = -puzzle.car.startOffset;
    const frontX = rearX + puzzle.car.wheelBase;
    this.wheels = [makeWheel(rearX, -r), makeWheel(frontX, -r)];
    this.wheelInvMass = 2 / puzzle.car.mass;
  }

  get finished(): boolean {
    return this.status === 'passed' || this.status === 'splashed' || this.status === 'stuck';
  }

  carPose(): BridgeCarPose {
    const [rear, front] = this.wheels;
    return {
      x: (rear.x + front.x) / 2,
      y: (rear.y + front.y) / 2,
      angle: Math.atan2(front.y - rear.y, front.x - rear.x),
      wheels: [
        { x: rear.x, y: rear.y },
        { x: front.x, y: front.y }
      ]
    };
  }

  /** Advance one fixed frame. Keeps running after the outcome for the flourish. */
  step(): void {
    this.snapsThisStep.length = 0;
    for (let i = 0; i < SUBSTEPS; i += 1) this.substep();
    this.time += BRIDGE_SIM_DT;
    this.updateStatus();
  }

  /** Run headless until an outcome or timeout. */
  runToEnd(): BridgeRunStatus {
    const maxFrames = Math.ceil(this.puzzle.timeoutSeconds / BRIDGE_SIM_DT) + 1;
    for (let i = 0; i < maxFrames && !this.finished; i += 1) this.step();
    return this.status;
  }

  private buildStructure(design: BridgeDesign): void {
    const { puzzle } = this;
    const index = new Map<string, number>();
    const mass: number[] = [];

    const jointFor = (point: { x: number; y: number }): number => {
      const key = gridKey(point);
      const found = index.get(key);
      if (found !== undefined) return found;
      const x = point.x * puzzle.cell;
      const y = point.y * puzzle.cell;
      this.joints.push({ x, y, px: x, py: y, invMass: isAnchor(puzzle, point) ? 0 : 1 });
      mass.push(0);
      index.set(key, this.joints.length - 1);
      return this.joints.length - 1;
    };

    for (const spec of design) {
      const a = jointFor(spec.a);
      const b = jointFor(spec.b);
      const material = puzzle.materials[spec.material];
      const ja = this.joints[a]!;
      const jb = this.joints[b]!;
      const rest = Math.hypot(jb.x - ja.x, jb.y - ja.y);
      const beamMass = (rest / puzzle.cell) * material.density;
      mass[a]! += beamMass / 2;
      mass[b]! += beamMass / 2;
      this.beams.push({
        a,
        b,
        material: spec.material,
        rest,
        compliance: material.compliance,
        strength: material.strength,
        lambda: 0,
        stress: 0,
        broken: false
      });
    }

    this.joints.forEach((joint, i) => {
      if (joint.invMass !== 0) joint.invMass = 1 / Math.max(0.05, mass[i]!);
    });
  }

  private substep(): void {
    // Ease gravity in so a sound design is not judged by the jolt of switching it on.
    const ramp = Math.min(1, this.time / GRAVITY_RAMP_SECONDS);
    const g = this.puzzle.gravity * ramp;
    const h2 = H * H;

    for (const joint of this.joints) {
      if (joint.invMass === 0) continue;
      const vx = (joint.x - joint.px) * DAMPING;
      const vy = (joint.y - joint.py) * DAMPING;
      joint.px = joint.x;
      joint.py = joint.y;
      joint.x += vx;
      joint.y += vy + g * h2;
    }

    const carActive = this.withCar && this.time >= this.puzzle.car.settleSeconds;
    if (carActive) {
      for (const wheel of this.wheels) {
        const vx = wheel.x - wheel.px;
        const vy = wheel.y - wheel.py;
        wheel.px = wheel.x;
        wheel.py = wheel.y;
        wheel.x += vx;
        wheel.y += vy + this.puzzle.gravity * h2;
        wheel.grounded = false;
      }
    }

    for (const beam of this.beams) {
      beam.lambda = 0;
      if (!beam.broken) this.solveBeam(beam, h2);
    }

    if (carActive) {
      this.solveAxle();
      for (const wheel of this.wheels) {
        this.collideBanks(wheel);
        this.collideRoads(wheel);
      }
      this.applyMotor();
    }

    this.breakOverloaded(h2);
  }

  private solveBeam(beam: SimBeam, h2: number): void {
    const ja = this.joints[beam.a]!;
    const jb = this.joints[beam.b]!;
    const w = ja.invMass + jb.invMass;
    if (w === 0) return;
    const dx = jb.x - ja.x;
    const dy = jb.y - ja.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) return;
    const c = len - beam.rest;
    const alpha = beam.compliance / h2;
    const dLambda = (-c - alpha * beam.lambda) / (w + alpha);
    beam.lambda += dLambda;
    const nx = dx / len;
    const ny = dy / len;
    ja.x -= nx * dLambda * ja.invMass;
    ja.y -= ny * dLambda * ja.invMass;
    jb.x += nx * dLambda * jb.invMass;
    jb.y += ny * dLambda * jb.invMass;
  }

  private breakOverloaded(h2: number): void {
    for (let i = 0; i < this.beams.length; i += 1) {
      const beam = this.beams[i]!;
      if (beam.broken) continue;
      // Low-pass the force so one noisy substep cannot snap a sound member.
      const force = Math.abs(beam.lambda) / h2;
      beam.stress += (force / beam.strength - beam.stress) * STRESS_SMOOTHING;
      if (beam.stress > this.peakStress) this.peakStress = beam.stress;
      if (beam.stress <= 1) continue;
      beam.broken = true;
      const ja = this.joints[beam.a]!;
      const jb = this.joints[beam.b]!;
      const snap = { beamIndex: i, x: (ja.x + jb.x) / 2, y: (ja.y + jb.y) / 2, time: this.time };
      this.snapsThisStep.push(snap);
      this.firstSnap ??= snap;
    }
  }

  private solveAxle(): void {
    const [rear, front] = this.wheels;
    const dx = front.x - rear.x;
    const dy = front.y - rear.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) return;
    const c = (len - this.puzzle.car.wheelBase) / 2;
    const nx = dx / len;
    const ny = dy / len;
    rear.x += nx * c;
    rear.y += ny * c;
    front.x -= nx * c;
    front.y -= ny * c;
  }

  /** Bank tops and cliff faces, as static segments. */
  private collideBanks(wheel: Wheel): void {
    const r = this.puzzle.car.wheelRadius;
    const right = this.puzzle.columns * this.puzzle.cell;
    // Left bank: top surface and the cliff face below the edge.
    if (wheel.x < 0) {
      if (wheel.y > -r && wheel.y < r * 2) this.pushWheel(wheel, 0, -1, wheel.y + r, 1, 0);
    } else if (wheel.x < r && wheel.y > 0) {
      this.pushWheel(wheel, 1, 0, r - wheel.x, 0, 1);
    }
    if (wheel.x > right) {
      if (wheel.y > -r && wheel.y < r * 2) this.pushWheel(wheel, 0, -1, wheel.y + r, 1, 0);
    } else if (wheel.x > right - r && wheel.y > 0) {
      this.pushWheel(wheel, -1, 0, wheel.x - (right - r), 0, 1);
    }
  }

  private pushWheel(
    wheel: Wheel,
    nx: number,
    ny: number,
    depth: number,
    tx: number,
    ty: number
  ): void {
    if (depth <= 0) return;
    wheel.x += nx * depth;
    wheel.y += ny * depth;
    if (ny < -0.3) this.markGrounded(wheel, tx, ty);
  }

  private markGrounded(wheel: Wheel, tx: number, ty: number): void {
    // Orient the tangent eastward so the motor always drives toward the far bank.
    const sign = tx < 0 ? -1 : 1;
    wheel.grounded = true;
    wheel.tx = tx * sign;
    wheel.ty = ty * sign;
  }

  private collideRoads(wheel: Wheel): void {
    const r = this.puzzle.car.wheelRadius;
    for (const beam of this.beams) {
      if (beam.broken || beam.material !== 'road') continue;
      const ja = this.joints[beam.a]!;
      const jb = this.joints[beam.b]!;
      const sx = jb.x - ja.x;
      const sy = jb.y - ja.y;
      const segLen2 = sx * sx + sy * sy;
      if (segLen2 < 1e-6) continue;
      let t = ((wheel.x - ja.x) * sx + (wheel.y - ja.y) * sy) / segLen2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const cx = ja.x + sx * t;
      const cy = ja.y + sy * t;
      let dx = wheel.x - cx;
      let dy = wheel.y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist >= r) continue;
      if (dist < 1e-6) {
        dx = 0;
        dy = -1;
      } else {
        dx /= dist;
        dy /= dist;
      }
      const depth = r - Math.max(dist, 0);

      // Share the correction between the wheel and the two joints by mass.
      const wa = ja.invMass * (1 - t);
      const wb = jb.invMass * t;
      const wSeg = wa * (1 - t) + wb * t;
      const wTotal = this.wheelInvMass + wSeg;
      if (wTotal === 0) continue;
      const k = depth / wTotal;
      wheel.x += dx * k * this.wheelInvMass;
      wheel.y += dy * k * this.wheelInvMass;
      ja.x -= dx * k * wa;
      ja.y -= dy * k * wa;
      jb.x -= dx * k * wb;
      jb.y -= dy * k * wb;

      if (dy < -0.3) {
        const len = Math.sqrt(segLen2);
        this.markGrounded(wheel, sx / len, sy / len);
      }
    }
  }

  /** Grounded wheels creep toward motor speed along whatever they stand on. */
  private applyMotor(): void {
    // Once across, the car brakes by the finish pennant for its victory beat.
    const target = this.status === 'passed' ? 0 : this.puzzle.car.speed * H;
    for (const wheel of this.wheels) {
      if (!wheel.grounded) continue;
      const vx = wheel.x - wheel.px;
      const vy = wheel.y - wheel.py;
      const along = vx * wheel.tx + vy * wheel.ty;
      const delta = (target - along) * TRACTION;
      wheel.px -= wheel.tx * delta;
      wheel.py -= wheel.ty * delta;
    }
  }

  private updateStatus(): void {
    if (this.finished) return;
    const pose = this.carPose();
    if (this.withCar && this.time >= this.puzzle.car.settleSeconds) this.status = 'driving';
    if (pose.wheels[0].y > this.puzzle.waterDepth || pose.wheels[1].y > this.puzzle.waterDepth) {
      this.status = 'splashed';
      return;
    }
    if (this.withCar && pose.wheels[0].x > this.finishX) {
      this.status = 'passed';
      return;
    }
    if (this.time >= this.puzzle.timeoutSeconds) {
      this.status = 'stuck';
      return;
    }
    // A car that falls off the world sideways (e.g. off a broken end) also fails.
    if (Math.abs(pose.x) > BANK_REACH + this.finishX) this.status = 'stuck';
  }
}

function makeWheel(x: number, y: number): Wheel {
  return { x, y, px: x, py: y, grounded: false, tx: 1, ty: 0 };
}

/** Rest shape of a design under its own weight, for drawing the finished crossing. */
export function settleBridge(
  puzzle: BridgePuzzle,
  design: BridgeDesign,
  seconds = 1.5
): BridgeSim {
  const sim = new BridgeSim(puzzle, design, { withCar: false });
  const frames = Math.ceil(seconds / BRIDGE_SIM_DT);
  for (let i = 0; i < frames; i += 1) sim.step();
  return sim;
}
