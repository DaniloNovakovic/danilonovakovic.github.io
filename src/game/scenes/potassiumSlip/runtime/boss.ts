import {
  getPotassiumSplitterSpawnColumns,
  POTASSIUM_COLUMN_COUNT,
  type PotassiumEnemyKind
} from './waves';

export type PotassiumBossPhase = 1 | 2 | 3;

export interface PotassiumBossState {
  phase: PotassiumBossPhase;
  orbitStarted: boolean;
  nextStoneAt: number;
  stoneUntil?: number;
  nextSummonAt: number;
}

export interface PotassiumBossFacts {
  active: boolean;
  dying: boolean;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  velocityX: number;
}

export interface PotassiumBossPatrolBounds {
  left: number;
  right: number;
}

export interface PotassiumBossSummonLayout {
  arenaLeft: number;
  arenaWidth: number;
  safeTop: number;
  safeBottom: number;
}

export interface PotassiumBossSummonFacts {
  kind: PotassiumEnemyKind;
  column: number;
  y: number;
  velocityY: number;
}

export type PotassiumBossCommand =
  | { type: 'setBossPhase'; phase: PotassiumBossPhase }
  | { type: 'setBossVelocity'; velocityY: number; velocityX?: number; x?: number }
  | { type: 'setBossHint'; text: string }
  | { type: 'shakeCamera'; durationMs: number; intensity: number }
  | { type: 'spawnOrbitBlockers' }
  | { type: 'updateOrbitBlockers'; now: number }
  | { type: 'startStone'; stoneUntil: number; nextStoneAt: number }
  | { type: 'endStone' }
  | { type: 'setStoneVisual'; active: boolean }
  | { type: 'spawnSummons'; summons: PotassiumBossSummonFacts[]; nextSummonAt: number }
  | { type: 'clearOrbitBlockers' };

export interface PotassiumBossFrameInput {
  now: number;
  state?: PotassiumBossState;
  boss?: PotassiumBossFacts;
  patrolBounds: PotassiumBossPatrolBounds;
  summonLayout: PotassiumBossSummonLayout;
}

export interface PotassiumBossResult {
  state?: PotassiumBossState;
  commands: PotassiumBossCommand[];
}

export const POTASSIUM_BOSS_PATROL_SPEED = 54;
export const POTASSIUM_BOSS_PHASE_1_DRIFT = 4;
export const POTASSIUM_BOSS_PHASE_2_DRIFT = 6;
export const POTASSIUM_BOSS_PHASE_3_DRIFT = 3;
export const POTASSIUM_BOSS_STONE_DURATION_MS = 1350;
export const POTASSIUM_BOSS_STONE_INTERVAL_MS = 4300;
export const POTASSIUM_BOSS_SUMMON_INTERVAL_MS = 3600;
export const POTASSIUM_BOSS_SUMMON_VELOCITY_Y = 74;

export function createPotassiumBossState(now: number): PotassiumBossState {
  return {
    phase: 1,
    orbitStarted: false,
    nextStoneAt: now + POTASSIUM_BOSS_STONE_INTERVAL_MS,
    stoneUntil: undefined,
    nextSummonAt: now + POTASSIUM_BOSS_SUMMON_INTERVAL_MS
  };
}

export function resolvePotassiumBossFrame(input: PotassiumBossFrameInput): PotassiumBossResult {
  const { boss } = input;
  if (!boss || !boss.active || boss.dying) {
    return { state: undefined, commands: [{ type: 'clearOrbitBlockers' }] };
  }

  let state = input.state ?? createPotassiumBossState(input.now);
  const commands: PotassiumBossCommand[] = [];
  const phase = getPotassiumBossPhase(boss.hp, boss.maxHp);

  if (phase !== state.phase) {
    commands.push({ type: 'setBossPhase', phase });
    commands.push({ type: 'shakeCamera', durationMs: 220, intensity: 0.007 });
    commands.push({
      type: 'setBossHint',
      text: phase === 2
        ? 'Boss phase 2 • Orbiting walls hate angles'
        : 'Boss phase 3 • Stone audits summon witnesses'
    });
    state = { ...state, phase };
  }

  commands.push(resolveBossPatrolCommand(boss, phase, input.patrolBounds));

  if (phase >= 2 && !state.orbitStarted) {
    commands.push({ type: 'spawnOrbitBlockers' });
    state = { ...state, orbitStarted: true };
  }
  if (phase >= 2) {
    commands.push({ type: 'updateOrbitBlockers', now: input.now });
  }

  if (phase >= 3) {
    const stoneResult = resolveBossStone(input.now, state);
    state = stoneResult.state;
    commands.push(...stoneResult.commands);

    if (input.now >= state.nextSummonAt) {
      const nextSummonAt = input.now + POTASSIUM_BOSS_SUMMON_INTERVAL_MS;
      commands.push({
        type: 'spawnSummons',
        summons: getPotassiumBossSummons(boss, input.summonLayout),
        nextSummonAt
      });
      state = { ...state, nextSummonAt };
    }
  } else {
    commands.push({ type: 'setStoneVisual', active: false });
    if (state.stoneUntil !== undefined) {
      commands.push({ type: 'endStone' });
      state = { ...state, stoneUntil: undefined };
    }
  }

  return { state, commands };
}

export function getPotassiumBossPhase(hp: number, maxHp: number): PotassiumBossPhase {
  const ratio = maxHp > 0 ? hp / maxHp : 1;
  if (ratio <= 0.3) return 3;
  if (ratio <= 0.6) return 2;
  return 1;
}

function resolveBossPatrolCommand(
  boss: PotassiumBossFacts,
  phase: PotassiumBossPhase,
  bounds: PotassiumBossPatrolBounds
): Extract<PotassiumBossCommand, { type: 'setBossVelocity' }> {
  const command: Extract<PotassiumBossCommand, { type: 'setBossVelocity' }> = {
    type: 'setBossVelocity',
    velocityY: getBossDrift(phase)
  };
  if (boss.x <= bounds.left) {
    command.x = bounds.left;
    command.velocityX = POTASSIUM_BOSS_PATROL_SPEED;
  } else if (boss.x >= bounds.right) {
    command.x = bounds.right;
    command.velocityX = -POTASSIUM_BOSS_PATROL_SPEED;
  } else if (Math.abs(boss.velocityX) < 10) {
    command.velocityX = POTASSIUM_BOSS_PATROL_SPEED;
  }
  return command;
}

function resolveBossStone(
  now: number,
  state: PotassiumBossState
): { state: PotassiumBossState; commands: PotassiumBossCommand[] } {
  if (state.stoneUntil !== undefined && state.stoneUntil > now) {
    return {
      state,
      commands: [{ type: 'setStoneVisual', active: true }]
    };
  }

  const commands: PotassiumBossCommand[] = [{ type: 'setStoneVisual', active: false }];
  let nextState = state;
  if (state.stoneUntil !== undefined) {
    commands.push({ type: 'endStone' });
    nextState = { ...nextState, stoneUntil: undefined };
  }
  if (now >= state.nextStoneAt) {
    const stoneUntil = now + POTASSIUM_BOSS_STONE_DURATION_MS;
    const nextStoneAt = now + POTASSIUM_BOSS_STONE_INTERVAL_MS;
    commands.push({ type: 'startStone', stoneUntil, nextStoneAt });
    nextState = { ...nextState, stoneUntil, nextStoneAt };
  }
  return { state: nextState, commands };
}

function getPotassiumBossSummons(
  boss: PotassiumBossFacts,
  layout: PotassiumBossSummonLayout
): PotassiumBossSummonFacts[] {
  const centerColumn = clampInteger(
    Math.round(((boss.x - layout.arenaLeft) / layout.arenaWidth) * POTASSIUM_COLUMN_COUNT - 0.5),
    0,
    POTASSIUM_COLUMN_COUNT - 1
  );
  const columns = getPotassiumSplitterSpawnColumns(centerColumn);
  const y = clampNumber(boss.y + 76, layout.safeTop + 24, layout.safeBottom - 120);
  return columns.map((column, index) => ({
    kind: index % 2 === 0 ? 'scope' : 'deadline',
    column,
    y,
    velocityY: POTASSIUM_BOSS_SUMMON_VELOCITY_Y
  }));
}

function getBossDrift(phase: PotassiumBossPhase): number {
  if (phase === 1) return POTASSIUM_BOSS_PHASE_1_DRIFT;
  if (phase === 2) return POTASSIUM_BOSS_PHASE_2_DRIFT;
  return POTASSIUM_BOSS_PHASE_3_DRIFT;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.trunc(clampNumber(value, min, max));
}
