import { isStampedeWeaponImmune, type StampedeFlockKind } from './flock';
import { STAMPEDE_WORLD, type StampedeBounds, type StampedeVelocity } from './movement';

/**
 * Guitar Surf: the metalhead rides a Flying V like a skateboard.
 *
 * Movement keeps momentum (wide turns, a coast when you let go) and the board
 * drops burning notes behind it. Braking hard from top speed can slam a power
 * chord (the `riffDrop` twist).
 */

export interface StampedeGuitarMods {
  /** Notes burn longer. */
  long?: boolean;
  /** Higher top speed and a denser trail. */
  shred?: boolean;
  /** Braking from top speed blasts a power chord ring. */
  drop?: boolean;
}

export interface StampedeGuitarTuning {
  topSpeedScale: number;
  steerRate: number;
  coastRate: number;
  noteSpacing: number;
  noteLifeMs: number;
  noteHitRadius: number;
  noteHitGapMs: number;
  minTrailSpeed: number;
  chordRadius: number;
  chordCooldownMs: number;
}

export interface StampedeGuitarNote {
  x: number;
  y: number;
  bornAtMs: number;
  untilMs: number;
  /** Which glyph to draw; rotates so the trail reads as a melody. */
  glyph: number;
}

export interface StampedeGuitarChord {
  x: number;
  y: number;
  atMs: number;
  radius: number;
}

export interface StampedeGuitarState {
  velocity: StampedeVelocity;
  notes: readonly StampedeGuitarNote[];
  travelSinceNote: number;
  nextGlyph: number;
  /** Set once the board reaches top speed; a brake after that can fire a chord. */
  primed: boolean;
  chordReadyAtMs: number;
  lastChord: StampedeGuitarChord | null;
  nextHitAtById: Record<string, number>;
}

export interface StampedeGuitarCandidate {
  id: string;
  x: number;
  y: number;
  kind?: StampedeFlockKind;
  radius?: number;
}

export interface StampedeGuitarStepInput {
  state: StampedeGuitarState;
  mods: StampedeGuitarMods;
  /** What plain walking would do this frame (input direction x walk speed). */
  desired: StampedeVelocity;
  walkSpeed: number;
  player: { x: number; y: number };
  elapsedMs: number;
  deltaMs: number;
  candidates: readonly StampedeGuitarCandidate[];
  bounds?: StampedeBounds;
}

export interface StampedeGuitarStep {
  state: StampedeGuitarState;
  velocity: StampedeVelocity;
  /** Everyone hit this frame, chord included. */
  hitIds: string[];
  /** The subset caught by a power chord (left dazed). */
  chordHitIds: string[];
  chord: StampedeGuitarChord | null;
}

const MAX_NOTES = 48;
const CHORD_PRIME_FRACTION = 0.8;
const CHORD_BRAKE_FRACTION = 0.3;

export function createStampedeGuitarState(): StampedeGuitarState {
  return {
    velocity: { x: 0, y: 0 },
    notes: [],
    travelSinceNote: 0,
    nextGlyph: 0,
    primed: false,
    chordReadyAtMs: 0,
    lastChord: null,
    nextHitAtById: {}
  };
}

export function getStampedeGuitarTuning(mods: StampedeGuitarMods = {}): StampedeGuitarTuning {
  return {
    topSpeedScale: mods.shred ? 1.45 : 1.25,
    steerRate: 3.2,
    coastRate: 1.1,
    noteSpacing: mods.shred ? 16 : 22,
    noteLifeMs: mods.long ? 2_800 : 1_500,
    noteHitRadius: 15,
    noteHitGapMs: 520,
    minTrailSpeed: 90,
    chordRadius: 120,
    chordCooldownMs: 1_400
  };
}

/**
 * Pure step. Calling it twice with the same input gives the same answer, so the
 * scene can peek at hits before committing (like the other continuous weapons).
 */
export function stepStampedeGuitar(input: StampedeGuitarStepInput): StampedeGuitarStep {
  const tuning = getStampedeGuitarTuning(input.mods);
  const dt = Math.max(0, input.deltaMs) / 1000;
  const velocity = steer(input.state.velocity, input.desired, tuning, dt, input);
  const topSpeed = input.walkSpeed * tuning.topSpeedScale;
  const speed = Math.hypot(velocity.x, velocity.y);

  const notes = dropNotes(input, tuning, speed, dt);
  const chord = resolveChord(input, tuning, topSpeed, speed);
  const hits = resolveHits(input, tuning, notes.notes, chord);

  return {
    velocity,
    hitIds: hits.hitIds,
    chordHitIds: hits.chordHitIds,
    chord: chord.fired,
    state: {
      velocity,
      notes: notes.notes,
      travelSinceNote: notes.travelSinceNote,
      nextGlyph: notes.nextGlyph,
      primed: chord.primed,
      chordReadyAtMs: chord.readyAtMs,
      lastChord: chord.fired ?? input.state.lastChord,
      nextHitAtById: hits.nextHitAtById
    }
  };
}

function steer(
  current: StampedeVelocity,
  desired: StampedeVelocity,
  tuning: StampedeGuitarTuning,
  dt: number,
  input: StampedeGuitarStepInput
): StampedeVelocity {
  const pushing = Math.hypot(desired.x, desired.y) > 1;
  const target = pushing
    ? { x: desired.x * tuning.topSpeedScale, y: desired.y * tuning.topSpeedScale }
    : { x: 0, y: 0 };
  const blend = 1 - Math.exp(-(pushing ? tuning.steerRate : tuning.coastRate) * dt);
  const next = {
    x: current.x + (target.x - current.x) * blend,
    y: current.y + (target.y - current.y) * blend
  };
  return stopAtWalls(next, input.player, input.bounds ?? STAMPEDE_WORLD);
}

/** A board pressed against the notebook edge stops on that axis instead of grinding. */
function stopAtWalls(
  velocity: StampedeVelocity,
  player: { x: number; y: number },
  bounds: StampedeBounds
): StampedeVelocity {
  return {
    x: stopAxis(velocity.x, player.x, bounds.safeLeft, bounds.safeRight),
    y: stopAxis(velocity.y, player.y, bounds.safeTop, bounds.safeBottom)
  };
}

function stopAxis(speed: number, at: number, min: number, max: number): number {
  const pressing = (at <= min && speed < 0) || (at >= max && speed > 0);
  return pressing || Math.abs(speed) < 2 ? 0 : speed;
}

function dropNotes(
  input: StampedeGuitarStepInput,
  tuning: StampedeGuitarTuning,
  speed: number,
  dt: number
): { notes: StampedeGuitarNote[]; travelSinceNote: number; nextGlyph: number } {
  const kept = input.state.notes.filter((note) => note.untilMs > input.elapsedMs);
  if (speed < tuning.minTrailSpeed) {
    return { notes: kept, travelSinceNote: 0, nextGlyph: input.state.nextGlyph };
  }
  const travel = input.state.travelSinceNote + speed * dt;
  if (travel < tuning.noteSpacing) {
    return { notes: kept, travelSinceNote: travel, nextGlyph: input.state.nextGlyph };
  }
  // Drop the note at the tail of the board, slightly behind the rider.
  const backX = -input.state.velocity.x / (speed || 1);
  const backY = -input.state.velocity.y / (speed || 1);
  const note: StampedeGuitarNote = {
    x: input.player.x + backX * 18,
    y: input.player.y + 14 + backY * 10,
    bornAtMs: input.elapsedMs,
    untilMs: input.elapsedMs + tuning.noteLifeMs,
    glyph: input.state.nextGlyph % 4
  };
  return {
    notes: [...kept, note].slice(-MAX_NOTES),
    travelSinceNote: travel - tuning.noteSpacing,
    nextGlyph: input.state.nextGlyph + 1
  };
}

function resolveChord(
  input: StampedeGuitarStepInput,
  tuning: StampedeGuitarTuning,
  topSpeed: number,
  speed: number
): { primed: boolean; readyAtMs: number; fired: StampedeGuitarChord | null } {
  if (!input.mods.drop) return { primed: false, readyAtMs: input.state.chordReadyAtMs, fired: null };
  const primed = input.state.primed || speed >= topSpeed * CHORD_PRIME_FRACTION;
  const braked = primed && speed <= topSpeed * CHORD_BRAKE_FRACTION;
  if (!braked || input.elapsedMs < input.state.chordReadyAtMs) {
    return { primed, readyAtMs: input.state.chordReadyAtMs, fired: null };
  }
  return {
    primed: false,
    readyAtMs: input.elapsedMs + tuning.chordCooldownMs,
    fired: {
      x: input.player.x,
      y: input.player.y,
      atMs: input.elapsedMs,
      radius: tuning.chordRadius
    }
  };
}

function resolveHits(
  input: StampedeGuitarStepInput,
  tuning: StampedeGuitarTuning,
  notes: readonly StampedeGuitarNote[],
  chord: { fired: StampedeGuitarChord | null }
): { hitIds: string[]; chordHitIds: string[]; nextHitAtById: Record<string, number> } {
  const nextHitAtById = { ...input.state.nextHitAtById };
  const hitIds: string[] = [];
  const chordHitIds: string[] = [];
  input.candidates.forEach((candidate) => {
    const hit = classifyHit(candidate, input, tuning, notes, chord.fired, nextHitAtById);
    if (hit === 'none') return;
    hitIds.push(candidate.id);
    if (hit === 'chord') chordHitIds.push(candidate.id);
    nextHitAtById[candidate.id] = input.elapsedMs + tuning.noteHitGapMs;
  });
  return { hitIds, chordHitIds, nextHitAtById };
}

/** A chord ignores the per-chick gap; notes respect it. */
function classifyHit(
  candidate: StampedeGuitarCandidate,
  input: StampedeGuitarStepInput,
  tuning: StampedeGuitarTuning,
  notes: readonly StampedeGuitarNote[],
  chord: StampedeGuitarChord | null,
  nextHitAtById: Record<string, number>
): 'none' | 'note' | 'chord' {
  if (isStampedeWeaponImmune(candidate.kind ?? 'chick', 'metalRiff', 1)) return 'none';
  const body = candidate.radius ?? 0;
  if (chord && distance(candidate, chord) <= chord.radius + body) return 'chord';
  if (input.elapsedMs < (nextHitAtById[candidate.id] ?? 0)) return 'none';
  const onNote = notes.some((note) => distance(candidate, note) <= tuning.noteHitRadius + body);
  return onNote ? 'note' : 'none';
}

function distance(left: { x: number; y: number }, right: { x: number; y: number }): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}
