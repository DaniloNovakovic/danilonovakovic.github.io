// Workbench verbs dispatch through one switch; each branch is a single delegation.
// fallow-ignore-file complexity
import {
  addBeam,
  designInk,
  designJoints,
  DRAFTSPERSON_SKETCH,
  hasRoadAcross,
  removeBeamAt,
  type BridgeDesign
} from './design';
import { isAnchor, type BridgeMaterial, type BridgePuzzle, type GridPoint } from './puzzle';
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
  /** Road reaches across, but the preview already sags or snaps. */
  | 'wobbly'
  /** Road reaches across and the preview holds its own weight. */
  | 'steady'
  | 'testing'
  | 'no_road'
  /** Road only, no supports: it folds under its own weight. */
  | 'bare_deck'
  /** Has supports, but the frame still folds before the car rolls. */
  | 'loose_frame'
  /** Free joints below the deck with nothing to stand on. */
  | 'hanging_joint'
  | 'snapped_middle'
  | 'snapped_end'
  | 'stuck'
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
/** Long enough to show anything that would fold before the car rolls. */
const PREVIEW_SECONDS = 1;
/** Freeze the preview just after the first snap: the sag reads, the wreck doesn't. */
const PREVIEW_AFTER_SNAP = 0.12;

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
  private previewFor: BridgeDesign | null = null;
  private previewSim: BridgeSim | null = null;

  constructor(puzzle: BridgePuzzle) {
    this.puzzle = puzzle;
  }

  get ink(): number {
    return designInk(this.puzzle, this.design);
  }

  /** True while there is a saved design to step back to (survives Clear). */
  get canUndo(): boolean {
    return this.history.length > 0;
  }

  get sketchOffered(): boolean {
    return this.attempts >= SKETCH_OFFER_AFTER;
  }

  /**
   * The current drawing settled under its own weight (no car), so the table can
   * show what sags or snaps before the player presses Test. Beam indices match
   * {@link design}. Recomputed only when the design changes.
   */
  get preview(): BridgeSim {
    if (this.previewFor !== this.design || !this.previewSim) {
      this.previewFor = this.design;
      this.previewSim = previewSettle(this.puzzle, this.design);
    }
    return this.previewSim;
  }

  /** After a few misses, the failure remark ends with a nudge toward the sketch. */
  get sketchNudge(): boolean {
    return this.phase === 'failed' && this.sketchOffered && !this.hintVisible;
  }

  /** Rotates which phrasing of a remark is shown, so retries don't repeat verbatim. */
  get tipVariant(): number {
    return Math.max(0, this.attempts - 1);
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
    this.tip = this.editTip();
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
    this.tip = this.editTip();
    return { ok: true, message: 'Undone.' };
  }

  private edit(change: (design: BridgeDesign) => BridgeDesign, message: string): BridgeActionResult {
    if (this.phase !== 'editing') return this.notEditing();
    this.pushHistory();
    this.design = change(this.design);
    this.tip = this.editTip();
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
    if (this.tip === 'testing') this.tip = this.editTip();
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

  /** Live coaching while drawing, read off the self-weight preview. */
  private editTip(): BridgeBuildTip {
    if (this.ink > this.puzzle.inkBudget) return 'out_of_ink';
    if (!hasRoadAcross(this.puzzle, this.design)) return 'drawing';
    return this.preview.beams.some((beam) => beam.broken) ? 'wobbly' : 'steady';
  }

  /** Name what actually went wrong, so the Draftsperson can react to it. */
  private failureTip(sim: BridgeSim): BridgeBuildTip {
    if (!hasRoadAcross(this.puzzle, this.design)) return 'no_road';
    const snap = sim.firstSnap;
    if (!snap) return 'stuck';
    if (!this.design.some((beam) => beam.material === 'wood')) return 'bare_deck';
    if (snap.time < this.puzzle.car.settleSeconds) {
      return this.hasHangingJoint() ? 'hanging_joint' : 'loose_frame';
    }
    const along = snap.x / (this.puzzle.columns * this.puzzle.cell);
    return along < 0.25 || along > 0.75 ? 'snapped_end' : 'snapped_middle';
  }

  /** A drawn joint below the deck that is not a bolt: it only hangs from beams. */
  private hasHangingJoint(): boolean {
    return designJoints(this.puzzle, this.design).some((joint) => joint.y > 0 && !isAnchor(this.puzzle, joint));
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

function previewSettle(puzzle: BridgePuzzle, design: BridgeDesign): BridgeSim {
  const sim = new BridgeSim(puzzle, design, { withCar: false });
  while (sim.time < PREVIEW_SECONDS) {
    if (sim.firstSnap && sim.time >= sim.firstSnap.time + PREVIEW_AFTER_SNAP) break;
    sim.step();
  }
  return sim;
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
    .map((beam, index) => `#${index + 1} ${beam.material} ${formatPoint(beam.a)} → ${formatPoint(beam.b)}`)
    .join('\n');
}
