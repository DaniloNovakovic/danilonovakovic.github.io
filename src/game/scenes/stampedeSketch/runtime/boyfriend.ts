/**
 * Brad, the jealous boyfriend. A pure state machine: the swarm runtime moves and
 * draws him from `mode`, and reacts to the one-shot `action` each step returns.
 */

interface Point {
  x: number;
  y: number;
}

export interface BradLane {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  length: number;
}

export type BradMode =
  | { kind: 'stalk' }
  | { kind: 'comboWindup'; untilMs: number; lanes: readonly BradLane[] }
  | { kind: 'comboDash'; untilMs: number; lane: number; lanes: readonly BradLane[] }
  | { kind: 'rest'; untilMs: number }
  | { kind: 'shakerWindup'; untilMs: number; target: Point }
  | { kind: 'whistle'; untilMs: number }
  | { kind: 'flex'; untilMs: number }
  | { kind: 'confused'; untilMs: number }
  | { kind: 'ally'; untilMs: number }
  | { kind: 'leaving' };

export interface BradBrain {
  mode: BradMode;
  enraged: boolean;
  nextComboAtMs: number;
  nextShakerAtMs: number;
  nextWhistleAtMs: number;
}

export type BradAction =
  | { kind: 'whistle' }
  | { kind: 'throwShaker'; target: Point }
  | { kind: 'flex' }
  | { kind: 'allyDone' }
  | null;

export interface BradStepInput {
  nowMs: number;
  self: Point;
  player: Point;
  hp: number;
  maxHp: number;
  escorts: number;
}

export interface BradComboTuning {
  windupMs: number;
  dashMs: number;
  dashSpeed: number;
  restMs: number;
}

const CALM_COMBO: BradComboTuning = { windupMs: 900, dashMs: 380, dashSpeed: 520, restMs: 1_300 };
const ENRAGED_COMBO: BradComboTuning = { windupMs: 700, dashMs: 330, dashSpeed: 620, restMs: 850 };
const COMBO_BEND = (50 * Math.PI) / 180;
const COMBO_TRIGGER = 300;
const SHAKER_MIN = 140;
const SHAKER_MAX = 460;
const SHAKER_WINDUP_MS = 600;
const SHAKER_EVERY_MS = 6_000;
const WHISTLE_MS = 650;
const WHISTLE_EVERY_MS = 14_000;
const WHISTLE_EVERY_ENRAGED_MS = 10_000;
const FLEX_MS = 800;
export const BRAD_CONFUSED_MS = 2_500;
export const BRAD_ALLY_MS = 20_000;

export function createBradBrain(nowMs: number): BradBrain {
  return {
    mode: { kind: 'stalk' },
    enraged: false,
    nextComboAtMs: nowMs + 1_500,
    nextShakerAtMs: nowMs + 2_500,
    nextWhistleAtMs: nowMs + 4_000
  };
}

export function bradComboTuning(enraged: boolean): BradComboTuning {
  return enraged ? ENRAGED_COMBO : CALM_COMBO;
}

/** Three chained lanes: straight at the player, then a zag, then a zig. All shown at windup. */
export function planBradCombo(from: Point, player: Point, enraged: boolean): BradLane[] {
  const tuning = bradComboTuning(enraged);
  const length = tuning.dashSpeed * (tuning.dashMs / 1000);
  const base = normalize(player.x - from.x, player.y - from.y);
  const lanes: BradLane[] = [];
  let start = { x: from.x, y: from.y };
  [0, COMBO_BEND, -COMBO_BEND].forEach((bend) => {
    const dir = rotate(base, bend);
    lanes.push({ x: start.x, y: start.y, dirX: dir.x, dirY: dir.y, length });
    start = { x: start.x + dir.x * length, y: start.y + dir.y * length };
  });
  return lanes;
}

export function confuseBrad(brain: BradBrain, nowMs: number): BradBrain {
  if (isBradFriendly(brain)) return brain;
  return { ...brain, mode: { kind: 'confused', untilMs: nowMs + BRAD_CONFUSED_MS } };
}

export function befriendBrad(brain: BradBrain, nowMs: number): BradBrain {
  if (isBradFriendly(brain)) return brain;
  return { ...brain, mode: { kind: 'ally', untilMs: nowMs + BRAD_ALLY_MS } };
}

export function isBradFriendly(brain: BradBrain): boolean {
  return brain.mode.kind === 'ally' || brain.mode.kind === 'leaving';
}

export function stepBradBrain(
  brain: BradBrain,
  input: BradStepInput
): { brain: BradBrain; action: BradAction } {
  const { mode } = brain;
  const now = input.nowMs;
  switch (mode.kind) {
    case 'leaving':
      return { brain, action: null };
    case 'ally':
      return now < mode.untilMs
        ? { brain, action: null }
        : { brain: { ...brain, mode: { kind: 'leaving' } }, action: { kind: 'allyDone' } };
    case 'confused':
    case 'flex':
    case 'rest':
      return now < mode.untilMs ? { brain, action: null } : { brain: stalk(brain), action: null };
    case 'whistle':
      return now < mode.untilMs
        ? { brain, action: null }
        : { brain: stalk(brain), action: { kind: 'whistle' } };
    case 'shakerWindup':
      return now < mode.untilMs
        ? { brain, action: null }
        : { brain: stalk(brain), action: { kind: 'throwShaker', target: mode.target } };
    case 'comboWindup':
      return now < mode.untilMs
        ? { brain, action: null }
        : { brain: dash(brain, mode.lanes, 0, now), action: null };
    case 'comboDash':
      return stepDash(brain, mode, now);
    case 'stalk':
      return decide(brain, input);
  }
}

function stepDash(
  brain: BradBrain,
  mode: Extract<BradMode, { kind: 'comboDash' }>,
  now: number
): { brain: BradBrain; action: BradAction } {
  if (now < mode.untilMs) return { brain, action: null };
  if (mode.lane + 1 < mode.lanes.length) {
    return { brain: dash(brain, mode.lanes, mode.lane + 1, now), action: null };
  }
  const restMs = bradComboTuning(brain.enraged).restMs;
  return {
    brain: {
      ...brain,
      mode: { kind: 'rest', untilMs: now + restMs },
      nextComboAtMs: now + restMs + 1_200
    },
    action: null
  };
}

function decide(brain: BradBrain, input: BradStepInput): { brain: BradBrain; action: BradAction } {
  return flexAtHalf(brain, input)
    ?? whistleForEscorts(brain, input)
    ?? rangedTrick(brain, input)
    ?? { brain, action: null };
}

function flexAtHalf(
  brain: BradBrain,
  input: BradStepInput
): { brain: BradBrain; action: BradAction } | null {
  if (brain.enraged || input.hp > input.maxHp / 2) return null;
  return {
    brain: { ...brain, enraged: true, mode: { kind: 'flex', untilMs: input.nowMs + FLEX_MS } },
    action: { kind: 'flex' }
  };
}

function whistleForEscorts(
  brain: BradBrain,
  input: BradStepInput
): { brain: BradBrain; action: BradAction } | null {
  if (input.escorts > 0 || input.nowMs < brain.nextWhistleAtMs) return null;
  const every = brain.enraged ? WHISTLE_EVERY_ENRAGED_MS : WHISTLE_EVERY_MS;
  return {
    brain: {
      ...brain,
      mode: { kind: 'whistle', untilMs: input.nowMs + WHISTLE_MS },
      nextWhistleAtMs: input.nowMs + every
    },
    action: null
  };
}

function rangedTrick(
  brain: BradBrain,
  input: BradStepInput
): { brain: BradBrain; action: BradAction } | null {
  const distance = Math.hypot(input.player.x - input.self.x, input.player.y - input.self.y);
  if (distance <= COMBO_TRIGGER && input.nowMs >= brain.nextComboAtMs) {
    const tuning = bradComboTuning(brain.enraged);
    return {
      brain: {
        ...brain,
        mode: {
          kind: 'comboWindup',
          untilMs: input.nowMs + tuning.windupMs,
          lanes: planBradCombo(input.self, input.player, brain.enraged)
        }
      },
      action: null
    };
  }
  if (distance < SHAKER_MIN || distance > SHAKER_MAX || input.nowMs < brain.nextShakerAtMs) return null;
  return {
    brain: {
      ...brain,
      mode: { kind: 'shakerWindup', untilMs: input.nowMs + SHAKER_WINDUP_MS, target: { ...input.player } },
      nextShakerAtMs: input.nowMs + SHAKER_EVERY_MS
    },
    action: null
  };
}

function stalk(brain: BradBrain): BradBrain {
  return { ...brain, mode: { kind: 'stalk' } };
}

function dash(brain: BradBrain, lanes: readonly BradLane[], lane: number, now: number): BradBrain {
  return {
    ...brain,
    mode: { kind: 'comboDash', untilMs: now + bradComboTuning(brain.enraged).dashMs, lane, lanes }
  };
}

function normalize(x: number, y: number): Point {
  const length = Math.hypot(x, y);
  return length < 0.001 ? { x: 1, y: 0 } : { x: x / length, y: y / length };
}

function rotate(point: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos };
}
