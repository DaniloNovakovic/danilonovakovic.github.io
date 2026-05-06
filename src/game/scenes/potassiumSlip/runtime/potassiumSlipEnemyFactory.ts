import {
  getPotassiumShieldSide,
  getPotassiumSplitterSpawnColumns,
  getScaledPotassiumEnemyHp,
  POTASSIUM_COLUMN_COUNT,
  type PotassiumEnemyKind,
  type PotassiumShieldSide
} from './potassiumSlipWaves';
import { POTASSIUM_DATA_KEYS } from './potassiumSlipPhaserData';
import { getMessages } from '@/shared/i18n';

const messages = getMessages();

export interface PotassiumEnemyConfig {
  label: string;
  hp: number;
  score: number;
  speed: number;
  texture: string;
  scale: number;
  indestructible?: boolean;
  splitsOnDeath?: boolean;
  shielded?: boolean;
}

export interface PotassiumEnemySpawnLayout {
  arenaLeft: number;
  arenaRight: number;
  safeTop: number;
}

export interface PotassiumEnemySpawnFacts {
  x: number;
  y: number;
  texture: string;
}

export interface PotassiumEnemyAttachmentFacts {
  kind: PotassiumEnemyKind;
  label: string;
  hp: number;
  shieldSide?: PotassiumShieldSide;
}

export interface PotassiumEnemyBodyProfile {
  width: number;
  height: number;
}

export interface PotassiumEnemySetupFacts {
  depth: number;
  scale: number;
  hp: number;
  data: Record<string, unknown>;
  attachment: PotassiumEnemyAttachmentFacts;
  bodyProfile?: PotassiumEnemyBodyProfile;
  angularVelocityRange?: { min: number; max: number };
  immovable: boolean;
  isBoss: boolean;
}

export const POTASSIUM_NON_BOSS_ENEMY_SPEED = 54;
export const POTASSIUM_SPLITTER_CHILD_SPEED = POTASSIUM_NON_BOSS_ENEMY_SPEED + 18;

const ENEMY_CONFIGS: Record<PotassiumEnemyKind, PotassiumEnemyConfig> = {
  intern: {
    label: messages.potassiumSlip.enemies.intern,
    hp: 2,
    score: 1,
    speed: 74,
    texture: 'potassium_enemy_intern',
    scale: 0.92
  },
  scope: {
    label: messages.potassiumSlip.enemies.scope,
    hp: 4,
    score: 2,
    speed: 54,
    texture: 'potassium_enemy_scope',
    scale: 0.95
  },
  deadline: {
    label: messages.potassiumSlip.enemies.deadline,
    hp: 3,
    score: 2,
    speed: 104,
    texture: 'potassium_enemy_deadline',
    scale: 0.9
  },
  wall: {
    label: messages.potassiumSlip.enemies.wall,
    hp: 14,
    score: 4,
    speed: 30,
    texture: 'potassium_enemy_wall',
    scale: 0.78
  },
  hardWall: {
    label: messages.potassiumSlip.enemies.hardWall,
    hp: 999,
    score: 0,
    speed: 30,
    texture: 'potassium_enemy_hard_wall',
    scale: 0.78,
    indestructible: true
  },
  splitter: {
    label: messages.potassiumSlip.enemies.splitter,
    hp: 5,
    score: 3,
    speed: 54,
    texture: 'potassium_enemy_splitter',
    scale: 0.9,
    splitsOnDeath: true
  },
  shield: {
    label: messages.potassiumSlip.enemies.shield,
    hp: 7,
    score: 4,
    speed: 46,
    texture: 'potassium_enemy_shield',
    scale: 0.92,
    shielded: true
  },
  boss: {
    label: messages.potassiumSlip.enemies.boss,
    hp: 92,
    score: 12,
    speed: 8,
    texture: 'potassium_enemy_boss',
    scale: 0.72
  }
};

export function getPotassiumEnemyConfig(kind: PotassiumEnemyKind): PotassiumEnemyConfig {
  return ENEMY_CONFIGS[kind];
}

export function getPotassiumLaneCenterX(
  layout: Pick<PotassiumEnemySpawnLayout, 'arenaLeft' | 'arenaRight'>,
  columnIndex: number
): number {
  return linear(layout.arenaLeft + 64, layout.arenaRight - 64, (columnIndex + 0.5) / POTASSIUM_COLUMN_COUNT);
}

export function resolvePotassiumEnemySpawnX(
  layout: Pick<PotassiumEnemySpawnLayout, 'arenaLeft' | 'arenaRight'>,
  kind: PotassiumEnemyKind,
  columnIndex: number
): number {
  const clampedColumn = clamp(columnIndex, 0, POTASSIUM_COLUMN_COUNT - 1);
  if (kind === 'splitter') {
    const nextColumn = Math.min(POTASSIUM_COLUMN_COUNT - 1, clampedColumn + 1);
    return (getPotassiumLaneCenterX(layout, clampedColumn) + getPotassiumLaneCenterX(layout, nextColumn)) / 2;
  }
  return getPotassiumLaneCenterX(layout, clampedColumn);
}

export function resolvePotassiumEnemySpawnFacts(input: {
  layout: PotassiumEnemySpawnLayout;
  kind: PotassiumEnemyKind;
  columnIndex?: number;
  yOverride?: number;
}): PotassiumEnemySpawnFacts {
  const config = getPotassiumEnemyConfig(input.kind);
  return {
    x: resolvePotassiumEnemySpawnX(input.layout, input.kind, input.columnIndex ?? 0),
    y: input.yOverride ?? (input.kind === 'boss' ? input.layout.safeTop + 60 : input.layout.safeTop + 12),
    texture: config.texture
  };
}

export function resolvePotassiumEnemySetupFacts(input: {
  kind: PotassiumEnemyKind;
  wave: number;
  columnIndex: number;
  rowIndex: number;
}): PotassiumEnemySetupFacts {
  const { kind, wave, columnIndex, rowIndex } = input;
  const config = getPotassiumEnemyConfig(kind);
  const hp = kind === 'boss' ? config.hp : getScaledPotassiumEnemyHp(config.hp, wave);
  const shieldSide = config.shielded
    ? getPotassiumShieldSide(wave, rowIndex, columnIndex)
    : undefined;

  return {
    depth: kind === 'boss' ? 80 : 60,
    scale: config.scale,
    hp,
    data: {
      [POTASSIUM_DATA_KEYS.kind]: kind,
      [POTASSIUM_DATA_KEYS.hp]: hp,
      [POTASSIUM_DATA_KEYS.maxHp]: hp,
      [POTASSIUM_DATA_KEYS.poisoned]: false,
      [POTASSIUM_DATA_KEYS.columnIndex]: columnIndex,
      [POTASSIUM_DATA_KEYS.rowIndex]: rowIndex,
      [POTASSIUM_DATA_KEYS.columnSpan]: kind === 'splitter' ? 2 : 1,
      [POTASSIUM_DATA_KEYS.occupiedColumns]: kind === 'splitter'
        ? getPotassiumSplitterSpawnColumns(columnIndex)
        : [columnIndex],
      [POTASSIUM_DATA_KEYS.indestructible]: config.indestructible ?? false,
      [POTASSIUM_DATA_KEYS.splitsOnDeath]: config.splitsOnDeath ?? false,
      ...(kind === 'boss' ? { [POTASSIUM_DATA_KEYS.bossPhase]: 1 } : {})
    },
    attachment: {
      kind,
      label: config.label,
      hp,
      shieldSide
    },
    bodyProfile: getPotassiumEnemyBodyProfile(kind),
    angularVelocityRange: kind === 'scope' ? { min: -70, max: 70 } : undefined,
    immovable: kind === 'wall' || kind === 'hardWall',
    isBoss: kind === 'boss'
  };
}

export function resolvePotassiumSplitterChildFacts(input: { hp: number }): {
  scale: number;
  hp: number;
  speed: number;
} {
  return {
    scale: 0.62,
    hp: Math.max(1, Math.ceil(input.hp * 0.55)),
    speed: POTASSIUM_SPLITTER_CHILD_SPEED
  };
}

function getPotassiumEnemyBodyProfile(kind: PotassiumEnemyKind): PotassiumEnemyBodyProfile | undefined {
  if (kind === 'wall' || kind === 'hardWall') return { width: 68, height: 52 };
  if (kind === 'splitter') return { width: 118, height: 52 };
  if (kind === 'shield') return { width: 54, height: 54 };
  return undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function linear(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
