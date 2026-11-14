// Workbench verbs dispatch through one switch; each branch is a single delegation.
// fallow-ignore-file complexity
import {
  addBeam,
  designInk,
  DRAFTSPERSON_SKETCH,
  hasRoadAcross,
  removeBeamAt,
  type BridgeDesign
} from './design';
import type { BridgeMaterial, BridgePuzzle, GridPoint } from './puzzle';
import { BridgeSim } from './sim';

/**
 * Blueprint Bridge workbench: the edit → test → fix loop the player runs with
 * the Bridge Draftsperson. Owns the design, undo history, and the live test.
 */

export type BridgeBuildPhase = 'editing' | 'testing' | 'failed' | 'passed';

/**
 * Which Draftsperson line to show. Copy lives in the dialogue catalog under
 * `bridge.builder.tip.<id>`, so presentation and console share one source.
 */
export type BridgeBuildTip =
  | 'intro'
  | 'drawing'
  | 'testing'
  | 'no_road'
  | 'self_weight'
  | 'car_weight'
  | 'stuck'
  | 'sketch_offer'
  | 'sketch_shown'
  | 'out_of_ink'
  | 'passed';

export type BridgeBuildAction =
  | { kind: 'add'; material: BridgeMaterial; a: GridPoint; b: GridPoint }
  | { kind: 'erase'; index: number }
  | { kind: 'undo' }
  | { kind: 'clear' }
  | { kind: 'hint' }
  | { kind: 'sketch' }
  | { kind: 'test'; instant: boolean }
  | { kind: 'edit' }
  | { kind: 'done' }
  | { kind: 'leave' }
  | { kind: 'show' };

export interface BridgeActionResult {
  ok: boolean;
  message: string;
}

/** Failed attempts before the Draftsperson offers their own sketch. */
const SKETCH_OFFER_AFTER = 2;
const UNDO_LIMIT = 60;
const FLOURISH_SECONDS = 3;

export class BridgeWorkbench {
  readonly puzzle: BridgePuzzle;
  design: BridgeDesign = [];
  phase: BridgeBuildPhase = 'editing';
  attempts = 0;
  tip: BridgeBuildTip = 'intro';
  /** When true, presentation draws the Draftsperson's sketch as a ghost to trace. */
  hintVisible = false;
  /** The live or last test run. Null until the first test. */
  sim: BridgeSim | null = null;
  /** Where the last failed run first gave way, in world units. */
  lastBreak: { x: number; y: number } | null = null;
  private history: BridgeDesign[] = [];
  private outcomeAt = 0;

  constructor(puzzle: BridgePuzzle) {
    this.puzzle = puzzle;
  }

  get ink(): number {
    return designInk(this.puzzle, this.design);
  }

  get sketchOffered(): boolean {
    return this.attempts >= SKETCH_OFFER_AFTER;
  }

  apply(action: BridgeBuildAction): BridgeActionResult {
    switch (action.kind) {
      case 'add':
        return this.add(action.a, action.b, action.material);
      case 'erase':
        return this.erase(action.index);
      case 'undo':
        return this.undo();
      case 'clear':
        return this.edit(() => [], 'Blueprint wiped clean.');
      case 'hint':
        return this.toggleHint();
      case 'sketch':
        return this.edit(() => DRAFTSPERSON_SKETCH, "Traced the Draftsperson's sketch.");
      case 'test':
        return this.startTest(action.instant);
      case 'edit':
        return this.backToEditing();
      case 'show':
        return { ok: true, message: describeDesign(this.design) };
      case 'done':
      case 'leave':
        // Session-level transitions; the workbench only validates them.
        return action.kind === 'done' && this.phase !== 'passed'
          ? { ok: false, message: 'The car has not made it across yet.' }
          : { ok: true, message: '' };
    }
  }

  /**
   * Advance a running test by one fixed frame. After the outcome the run keeps
   * going briefly so the wreck can fall or the car can roll on, without ever
   * changing the result.
   */
  stepTest(): void {
    const sim = this.sim;
    if (!sim || this.phase === 'editing') return;
    if (this.phase !== 'testing') {
      if (sim.time < this.outcomeAt + FLOURISH_SECONDS) sim.step();
      return;
    }
    sim.step();
    if (sim.finished) {
      this.outcomeAt = sim.time;
      this.resolveRun(sim);
    }
  }

  private add(a: GridPoint, b: GridPoint, material: BridgeMaterial): BridgeActionResult {
    if (this.phase !== 'editing') return this.notEditing();
    const result = addBeam(this.puzzle, this.design, a, b, material);
    if (!result.ok) return { ok: false, message: result.reason };
    this.pushHistory();
    this.design = result.design;
    this.tip = this.ink > this.puzzle.inkBudget ? 'out_of_ink' : 'drawing';
    return {
      ok: true,
      message: result.replaced
        ? `Swapped that beam to ${material}.`
        : `Drew ${material} ${formatPoint(a)} → ${formatPoint(b)}.`
    };
  }

  private erase(index: number): BridgeActionResult {
    if (this.phase !== 'editing') return this.notEditing();
    if (index < 0 || index >= this.design.length) {
      return { ok: false, message: `No beam #${index + 1}.` };
    }
    return this.edit((design) => removeBeamAt(design, index), 'Erased.');
  }

  private undo(): BridgeActionResult {
    if (this.phase !== 'editing') return this.notEditing();
    const previous = this.history.pop();
    if (!previous) return { ok: false, message: 'Nothing to undo.' };
    this.design = previous;
    this.tip = 'drawing';
    return { ok: true, message: 'Undone.' };
  }

  private edit(change: (design: BridgeDesign) => BridgeDesign, message: string): BridgeActionResult {
    if (this.phase !== 'editing') return this.notEditing();
    this.pushHistory();
    this.design = change(this.design);
    this.tip = 'drawing';
    return { ok: true, message };
  }

  private toggleHint(): BridgeActionResult {
    this.hintVisible = !this.hintVisible;
    if (this.hintVisible) this.tip = 'sketch_shown';
    return {
      ok: true,
      message: this.hintVisible ? 'The Draftsperson holds up a faint sketch.' : 'Sketch tucked away.'
    };
  }

  private startTest(instant: boolean): BridgeActionResult {
    if (this.phase !== 'editing') return this.notEditing();
    if (this.design.length === 0) {
      return { ok: false, message: 'Draw something first — the car needs a road.' };
    }
    if (this.ink > this.puzzle.inkBudget) {
      this.tip = 'out_of_ink';
      return { ok: false, message: 'Out of ink — erase a few beams first.' };
    }

    this.attempts += 1;
    this.phase = 'testing';
    this.tip = 'testing';
    this.lastBreak = null;
    this.sim = new BridgeSim(this.puzzle, this.design);
    if (!instant) return { ok: true, message: 'The toy car revs up…' };

    this.sim.runToEnd();
    const outcome = this.resolveRun(this.sim);
    return {
      ok: outcome === 'passed',
      message: outcome === 'passed' ? 'The toy car made it across!' : describeFailure(this.sim)
    };
  }

  private backToEditing(): BridgeActionResult {
    if (this.phase === 'editing') return { ok: true, message: 'Already drawing.' };
    if (this.phase === 'passed') return { ok: false, message: 'It already holds — use build done.' };
    this.phase = 'editing';
    if (this.tip === 'testing') this.tip = 'drawing';
    return { ok: true, message: 'Back to the drawing board.' };
  }

  private resolveRun(sim: BridgeSim): BridgeBuildPhase {
    if (sim.status === 'passed') {
      this.phase = 'passed';
      this.tip = 'passed';
      return this.phase;
    }
    this.phase = 'failed';
    this.lastBreak = sim.firstSnap ? { x: sim.firstSnap.x, y: sim.firstSnap.y } : null;
    this.tip = this.failureTip(sim);
    return this.phase;
  }

  private failureTip(sim: BridgeSim): BridgeBuildTip {
    if (!hasRoadAcross(this.puzzle, this.design)) return 'no_road';
    if (this.sketchOffered && !this.hintVisible) return 'sketch_offer';
    if (sim.firstSnap) {
      return sim.firstSnap.time < this.puzzle.car.settleSeconds ? 'self_weight' : 'car_weight';
    }
    return 'stuck';
  }

  private pushHistory(): void {
    this.history.push(this.design);
    if (this.history.length > UNDO_LIMIT) this.history.shift();
  }

  private notEditing(): BridgeActionResult {
    return {
      ok: false,
      message:
        this.phase === 'testing'
          ? 'The test is running — build edit to stop it.'
          : 'Use build edit to get back to drawing.'
    };
  }
}

function formatPoint(point: GridPoint): string {
  return `${point.x},${point.y}`;
}

function describeFailure(sim: BridgeSim): string {
  if (sim.status === 'stuck') return 'The toy car got stuck and never reached the far bank.';
  return sim.firstSnap
    ? 'Snap! A beam gave way and the toy car took a swim.'
    : 'Splash! The toy car rolled off into the river.';
}

function describeDesign(design: BridgeDesign): string {
  if (design.length === 0) return 'Blueprint is empty. Bolts: 0,0  8,0  0,2  8,2.';
  return design
    .map(
      (beam, index) =>
        `#${index + 1} ${beam.material} ${formatPoint(beam.a)} → ${formatPoint(beam.b)}`
    )
    .join('\n');
}
