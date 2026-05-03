export type PotassiumEnemyKind =
  | 'intern'
  | 'scope'
  | 'meeting'
  | 'deadline'
  | 'wall'
  | 'hardWall'
  | 'splitter'
  | 'shield'
  | 'boss';
export type PotassiumWaveCell = PotassiumEnemyKind | null;
export type PotassiumEnemyHealthState = 'healthy' | 'cracked' | 'critical';
export type PotassiumShieldSide = 'bottom' | 'left' | 'right';
export type PotassiumUpgradeKind =
  | 'fire'
  | 'poison'
  | 'explosion'
  | 'duplicate'
  | 'ghostHorizontal'
  | 'ghostVertical';
export type PotassiumSkillRank = 0 | 1 | 2;
export type PotassiumSkillRanks = Partial<Record<PotassiumUpgradeKind, PotassiumSkillRank>>;
export type PotassiumSkillDraftAction = 'unlock' | 'upgrade';
export type PotassiumGenericUpgradeKind =
  | 'damage'
  | 'poison'
  | 'explosion'
  | 'cloneTime'
  | 'bananaSpeed'
  | 'bonusLife';
export type PotassiumGenericUpgradeRanks = Partial<Record<PotassiumGenericUpgradeKind, number>>;

export interface PotassiumSkillDraftOption {
  type?: 'skill';
  kind: PotassiumUpgradeKind;
  action: PotassiumSkillDraftAction;
}

export interface PotassiumGenericDraftOption {
  type: 'generic';
  kind: PotassiumGenericUpgradeKind;
}

export type PotassiumDraftOption = PotassiumSkillDraftOption | PotassiumGenericDraftOption;

export interface PotassiumWaveDefinition {
  wave: number;
  title: string;
  rows: PotassiumWaveCell[][];
}

type RowTemplate = 'single' | 'pair' | 'spread' | 'wallGate' | 'deadlineLane' | 'mixedPressure';

export const POTASSIUM_COLUMN_COUNT = 5;
export const POTASSIUM_NON_BOSS_WAVE_COUNT = 10;
export const POTASSIUM_BOSS_WAVE = POTASSIUM_NON_BOSS_WAVE_COUNT + 1;
export const POTASSIUM_ENDLESS_START_WAVE = POTASSIUM_BOSS_WAVE + 1;

export const POTASSIUM_UPGRADES: readonly PotassiumUpgradeKind[] = [
  'fire',
  'poison',
  'explosion',
  'duplicate',
  'ghostHorizontal',
  'ghostVertical'
] as const;

export const POTASSIUM_GENERIC_UPGRADES: readonly PotassiumGenericUpgradeKind[] = [
  'damage',
  'poison',
  'explosion',
  'cloneTime',
  'bananaSpeed',
  'bonusLife'
] as const;

export const POTASSIUM_WAVES: readonly PotassiumWaveDefinition[] = [
  ...Array.from({ length: POTASSIUM_NON_BOSS_WAVE_COUNT }, (_, index) => generatePotassiumWave(index + 1)),
  {
    wave: POTASSIUM_BOSS_WAVE,
    title: 'Compliance Review',
    rows: [['boss']]
  }
] as const;

export function getPotassiumWave(wave: number): PotassiumWaveDefinition {
  if (wave === POTASSIUM_BOSS_WAVE) return POTASSIUM_WAVES[POTASSIUM_WAVES.length - 1];
  if (wave > POTASSIUM_BOSS_WAVE) return generatePotassiumWave(wave);
  const clampedIndex = Math.max(0, Math.min(POTASSIUM_NON_BOSS_WAVE_COUNT - 1, wave - 1));
  return POTASSIUM_WAVES[clampedIndex];
}

export function isPotassiumBossWave(wave: number): boolean {
  return wave === POTASSIUM_BOSS_WAVE;
}

export function isPotassiumCampaignBossWave(wave: number): boolean {
  return isPotassiumBossWave(wave);
}

export function getUnlockedPotassiumEnemies(wave: number): PotassiumEnemyKind[] {
  return unique(POTASSIUM_WAVES
    .filter((definition) => definition.wave <= Math.min(wave, POTASSIUM_NON_BOSS_WAVE_COUNT))
    .flatMap((definition) => definition.rows.flat())
    .filter((enemy): enemy is PotassiumEnemyKind => enemy !== null && enemy !== 'boss'));
}

export function getPotassiumUpgradeChoices(
  skillRanks: PotassiumSkillRanks,
  completedWave: number,
  random: () => number = Math.random
): PotassiumSkillDraftOption[] {
  if (completedWave >= 2) {
    return getStructuredPotassiumUpgradeChoices(skillRanks, random);
  }
  return shufflePotassiumDraftOptions(getPotassiumDraftPool(skillRanks), random).slice(0, 2);
}

export function getPotassiumDraftChoices(
  skillRanks: PotassiumSkillRanks,
  genericRanks: PotassiumGenericUpgradeRanks,
  completedWave: number,
  random: () => number = Math.random
): PotassiumDraftOption[] {
  const skillChoices = getPotassiumUpgradeChoices(skillRanks, completedWave, random);
  if (skillChoices.length > 0) return skillChoices;
  return shufflePotassiumGenericOptions(
    POTASSIUM_GENERIC_UPGRADES.map((kind) => ({ type: 'generic' as const, kind })),
    random
  )
    .sort((left, right) => getPotassiumGenericUpgradeRank(genericRanks, left.kind) - getPotassiumGenericUpgradeRank(genericRanks, right.kind))
    .slice(0, 2);
}

export function getUnlockedPotassiumUpgrades(skillRanks: PotassiumSkillRanks): PotassiumUpgradeKind[] {
  return POTASSIUM_UPGRADES.filter((upgrade) => getPotassiumSkillRank(skillRanks, upgrade) > 0);
}

export function getPotassiumSkillRank(
  skillRanks: PotassiumSkillRanks,
  upgrade: PotassiumUpgradeKind
): PotassiumSkillRank {
  return skillRanks[upgrade] ?? 0;
}

export function getPotassiumDraftPool(skillRanks: PotassiumSkillRanks): PotassiumSkillDraftOption[] {
  return POTASSIUM_UPGRADES.flatMap<PotassiumSkillDraftOption>((upgrade) => {
    const rank = getPotassiumSkillRank(skillRanks, upgrade);
    if (rank === 0) return [{ kind: upgrade, action: 'unlock' as const }];
    if (rank === 1) return [{ kind: upgrade, action: 'upgrade' as const }];
    return [];
  });
}

export function getPotassiumGenericUpgradeRank(
  genericRanks: PotassiumGenericUpgradeRanks,
  upgrade: PotassiumGenericUpgradeKind
): number {
  return genericRanks[upgrade] ?? 0;
}

export function applyPotassiumGenericDraftOption(
  genericRanks: PotassiumGenericUpgradeRanks,
  option: PotassiumGenericDraftOption
): PotassiumGenericUpgradeRanks {
  return {
    ...genericRanks,
    [option.kind]: getPotassiumGenericUpgradeRank(genericRanks, option.kind) + 1
  };
}

function getStructuredPotassiumUpgradeChoices(
  skillRanks: PotassiumSkillRanks,
  random: () => number
): PotassiumSkillDraftOption[] {
  const upgradeOptions = shufflePotassiumDraftOptions(
    getPotassiumDraftPool(skillRanks).filter((option) => option.action === 'upgrade'),
    random
  );
  const unlockOptions = shufflePotassiumDraftOptions(
    getPotassiumDraftPool(skillRanks).filter((option) => option.action === 'unlock'),
    random
  );
  const choices = [
    upgradeOptions[0],
    unlockOptions[0]
  ].filter((option): option is PotassiumSkillDraftOption => option !== undefined);

  if (choices.length >= 2) return choices;

  const selectedKeys = new Set(choices.map((option) => `${option.kind}:${option.action}`));
  const fallbackOptions = shufflePotassiumDraftOptions(getPotassiumDraftPool(skillRanks), random)
    .filter((option) => !selectedKeys.has(`${option.kind}:${option.action}`));
  return [...choices, ...fallbackOptions].slice(0, 2);
}

export function applyPotassiumDraftOption(
  skillRanks: PotassiumSkillRanks,
  option: PotassiumSkillDraftOption
): PotassiumSkillRanks {
  const currentRank = getPotassiumSkillRank(skillRanks, option.kind);
  const nextRank = option.action === 'unlock' ? Math.max(1, currentRank) : Math.min(2, currentRank + 1);
  return {
    ...skillRanks,
    [option.kind]: nextRank as PotassiumSkillRank
  };
}

export function getPotassiumDuplicateCloneCount(rank: PotassiumSkillRank): number {
  return rank >= 2 ? 3 : 2;
}

export function getPotassiumExplosionRadius(rank: PotassiumSkillRank): number {
  return rank >= 2 ? 86 : 66;
}

export function getPotassiumScaledExplosionRadius(
  rank: PotassiumSkillRank,
  radiusMultiplier: number = 1
): number {
  return getPotassiumExplosionRadius(rank) * radiusMultiplier;
}

export function getPotassiumExplosionDamage(
  distance: number,
  radius: number,
  effectMultiplier: number = 1
): number {
  if (distance > radius) return 0;
  const normalizedDistance = Math.max(0, Math.min(1, distance / radius));
  const baseDamage = normalizedDistance <= 0.35 ? 2 : 1;
  return baseDamage * effectMultiplier;
}

export function getPotassiumEnemyHpMultiplier(wave: number): number {
  if (wave > POTASSIUM_BOSS_WAVE) return Math.min(3, 1.7 + (wave - POTASSIUM_ENDLESS_START_WAVE) * 0.1);
  if (wave >= 9) return 1.6;
  if (wave >= 7) return 1.45;
  if (wave >= 5) return 1.3;
  if (wave >= 3) return 1.15;
  return 1;
}

export function getScaledPotassiumEnemyHp(baseHp: number, wave: number): number {
  return Math.ceil(baseHp * getPotassiumEnemyHpMultiplier(wave));
}

export function getPotassiumEnemyHealthState(hp: number, maxHp: number): PotassiumEnemyHealthState {
  if (maxHp <= 0) return 'healthy';
  const ratio = hp / maxHp;
  if (ratio <= 0.3) return 'critical';
  if (ratio <= 0.6) return 'cracked';
  return 'healthy';
}

export function getPotassiumShieldSide(
  wave: number,
  rowIndex: number,
  columnIndex: number
): PotassiumShieldSide {
  return (['bottom', 'left', 'right'] as const)[Math.abs(wave + rowIndex * 2 + columnIndex) % 3];
}

export function isPotassiumShieldedHit(
  shieldSide: PotassiumShieldSide,
  deltaX: number,
  deltaY: number
): boolean {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  if (shieldSide === 'bottom') return deltaY >= absX;
  if (shieldSide === 'left') return -deltaX >= absY;
  return deltaX >= absY;
}

export function getPotassiumSplitterSpawnColumns(columnIndex: number): number[] {
  return [columnIndex, columnIndex + 1]
    .filter((column) => column >= 0 && column < POTASSIUM_COLUMN_COUNT);
}

export function getPotassiumFireCellKey(
  x: number,
  y: number,
  arena: { left: number; width: number; top: number; bottom: number },
  rowHeight: number
): string {
  const column = clampInteger(
    Math.floor(((x - arena.left) / arena.width) * POTASSIUM_COLUMN_COUNT),
    0,
    POTASSIUM_COLUMN_COUNT - 1
  );
  const row = clampInteger(
    Math.floor((y - arena.top) / rowHeight),
    0,
    Math.ceil((arena.bottom - arena.top) / rowHeight)
  );
  return `${column}:${row}`;
}

function generatePotassiumWave(wave: number): PotassiumWaveDefinition {
  const rowCount = getGeneratedRowCount(wave);
  const templates = getTemplateCycle(wave);
  const rows = Array.from({ length: rowCount }, (_, index) => {
    const template = templates[(index + wave) % templates.length];
    return buildTemplateRow(template, wave, index);
  });
  return {
    wave,
    title: getGeneratedWaveTitle(wave),
    rows
  };
}

function getGeneratedRowCount(wave: number): number {
  if (wave > POTASSIUM_BOSS_WAVE) return Math.min(42, 24 + (wave - POTASSIUM_ENDLESS_START_WAVE) * 2);
  if (wave === 1) return 7;
  if (wave <= 2) return 8 + wave * 2;
  if (wave <= 6) return 12 + wave * 2;
  if (wave >= 9) return 28;
  return Math.min(34, 18 + wave * 2);
}

function getTemplateCycle(wave: number): RowTemplate[] {
  if (wave <= 1) return ['single', 'single', 'pair'];
  if (wave <= 2) return ['single', 'pair', 'spread'];
  if (wave <= 4) return ['pair', 'spread', 'wallGate', 'single'];
  if (wave <= 6) return ['spread', 'wallGate', 'pair', 'mixedPressure'];
  return ['spread', 'deadlineLane', 'wallGate', 'mixedPressure', 'pair'];
}

function buildTemplateRow(template: RowTemplate, wave: number, rowIndex: number): PotassiumWaveCell[] {
  const row = emptyRow();
  if (template === 'single') {
    placeEnemyInRow(row, pickLane(wave, rowIndex, 0), pickBasicEnemy(wave, rowIndex));
  } else if (template === 'pair') {
    const first = pickLane(wave, rowIndex, 1);
    const second = (first + 2 + ((wave + rowIndex) % 2)) % POTASSIUM_COLUMN_COUNT;
    placeEnemyInRow(row, first, pickBasicEnemy(wave, rowIndex));
    placeEnemyInRow(row, second, pickBasicEnemy(wave, rowIndex + 1));
  } else if (template === 'spread') {
    const lanes = (wave + rowIndex) % 2 === 0 ? [0, 2, 4] : [1, 3, 4];
    lanes.forEach((lane, index) => {
      placeEnemyInRow(row, lane, pickBasicEnemy(wave, rowIndex + index));
    });
  } else if (template === 'wallGate') {
    const wallLane = pickLane(wave, rowIndex, 2);
    placeEnemyInRow(row, wallLane, 'wall');
    if (wave >= 5 && (wave + rowIndex) % 3 === 0) {
      placeEnemyInRow(row, (wallLane + 2) % POTASSIUM_COLUMN_COUNT, 'wall');
    }
    placeEnemyInRow(row, (wallLane + 1) % POTASSIUM_COLUMN_COUNT, pickBasicEnemy(wave, rowIndex));
  } else if (template === 'deadlineLane') {
    const deadlineLane = pickLane(wave, rowIndex, 3);
    placeEnemyInRow(row, deadlineLane, 'deadline');
    placeEnemyInRow(row, (deadlineLane + 2) % POTASSIUM_COLUMN_COUNT, pickBasicEnemy(wave, rowIndex));
    if ((wave + rowIndex) % 2 === 0) {
      placeEnemyInRow(row, (deadlineLane + 4) % POTASSIUM_COLUMN_COUNT, 'deadline');
    }
  } else {
    const lanes = [0, 1, 3, 4].filter((lane) => lane !== ((wave + rowIndex) % POTASSIUM_COLUMN_COUNT));
    lanes.slice(0, wave >= 8 ? 4 : 3).forEach((lane, index) => {
      placeEnemyInRow(row, lane, pickPressureEnemy(wave, rowIndex + index));
    });
  }
  return enforceRowSafety(row);
}

function placeEnemyInRow(row: PotassiumWaveCell[], lane: number, kind: PotassiumEnemyKind): boolean {
  if (lane < 0 || lane >= POTASSIUM_COLUMN_COUNT || row[lane] !== null || isReservedBySplitter(row, lane)) {
    return false;
  }
  if (kind !== 'splitter') {
    row[lane] = kind;
    return true;
  }
  if (lane >= POTASSIUM_COLUMN_COUNT - 1 || row[lane + 1] !== null) {
    row[lane] = 'scope';
    return true;
  }
  row[lane] = 'splitter';
  return true;
}

function pickBasicEnemy(wave: number, seed: number): PotassiumEnemyKind {
  if (wave <= 1) return 'intern';
  if (wave <= 4) return (seed + wave) % 3 === 0 ? 'scope' : 'intern';
  if (wave <= 6) return ['intern', 'scope', 'meeting', 'splitter'][(seed + wave) % 4] as PotassiumEnemyKind;
  if (wave <= 7) return ['intern', 'scope', 'meeting', 'deadline', 'splitter'][(seed + wave) % 5] as PotassiumEnemyKind;
  return ['intern', 'scope', 'meeting', 'deadline', 'splitter', 'shield'][(seed + wave) % 6] as PotassiumEnemyKind;
}

function pickPressureEnemy(wave: number, seed: number): PotassiumEnemyKind {
  const pool: PotassiumEnemyKind[] = wave >= 8
    ? ['scope', 'meeting', 'deadline', 'wall', 'hardWall', 'splitter', 'shield']
    : wave >= 7
      ? ['scope', 'meeting', 'deadline', 'wall', 'splitter', 'shield']
      : ['intern', 'scope', 'meeting', 'wall', 'splitter'];
  return pool[(seed * 3 + wave) % pool.length];
}

function pickLane(wave: number, rowIndex: number, salt: number): number {
  return (wave * 2 + rowIndex * 3 + salt) % POTASSIUM_COLUMN_COUNT;
}

function enforceRowSafety(row: PotassiumWaveCell[]): PotassiumWaveCell[] {
  const safeRow = [...row];
  safeRow.forEach((cell, index) => {
    if (cell === 'splitter' && (index >= POTASSIUM_COLUMN_COUNT - 1 || safeRow[index + 1] !== null)) {
      safeRow[index] = 'scope';
    }
  });
  while (safeRow.filter((cell) => cell === 'wall' || cell === 'hardWall').length > 2) {
    const hardWallIndex = safeRow.lastIndexOf('hardWall');
    if (hardWallIndex >= 0) {
      safeRow[hardWallIndex] = null;
    } else {
      safeRow[safeRow.lastIndexOf('wall')] = null;
    }
  }
  while (safeRow.filter((cell) => cell === 'deadline').length > 2) {
    safeRow[safeRow.lastIndexOf('deadline')] = 'scope';
  }
  const hasOpenLane = safeRow.some((cell, index) => cell === null && !isReservedBySplitter(safeRow, index));
  if (!hasOpenLane) {
    safeRow[2] = null;
  }
  return safeRow;
}

function isReservedBySplitter(row: readonly PotassiumWaveCell[], lane: number): boolean {
  return lane > 0 && row[lane - 1] === 'splitter';
}

function emptyRow(): PotassiumWaveCell[] {
  return Array.from({ length: POTASSIUM_COLUMN_COUNT }, () => null);
}

function getGeneratedWaveTitle(wave: number): string {
  if (wave > POTASSIUM_BOSS_WAVE) return `Endless Audit ${wave - POTASSIUM_BOSS_WAVE}`;
  if (wave <= 2) return `Orientation Stack ${wave}`;
  if (wave <= 4) return `Wall Pattern ${wave}`;
  if (wave <= 6) return `Office Pressure ${wave}`;
  return `Deadline Weather ${wave}`;
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function shufflePotassiumDraftOptions(
  options: readonly PotassiumSkillDraftOption[],
  random: () => number
): PotassiumSkillDraftOption[] {
  const shuffled = [...options];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(clampRandomUnit(random) * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function shufflePotassiumGenericOptions(
  options: readonly PotassiumGenericDraftOption[],
  random: () => number
): PotassiumGenericDraftOption[] {
  const shuffled = [...options];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(clampRandomUnit(random) * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function clampRandomUnit(random: () => number): number {
  const value = random();
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(0.999999, value));
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
