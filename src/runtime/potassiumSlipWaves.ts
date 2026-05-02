export type PotassiumEnemyKind = 'intern' | 'scope' | 'meeting' | 'deadline' | 'boss';
export type PotassiumUpgradeKind = 'split' | 'poison' | 'bomb' | 'rubber' | 'magnet';

export interface PotassiumWaveDefinition {
  wave: number;
  title: string;
  enemies: PotassiumEnemyKind[];
  guaranteedUpgrade?: PotassiumUpgradeKind;
}

export const POTASSIUM_WAVES: readonly PotassiumWaveDefinition[] = [
  {
    wave: 1,
    title: 'Bug Orientation',
    enemies: ['intern', 'intern', 'intern']
  },
  {
    wave: 2,
    title: 'Scope Creep',
    enemies: ['scope', 'intern', 'scope']
  },
  {
    wave: 3,
    title: 'Banana Split Training',
    enemies: ['intern', 'scope', 'intern', 'scope'],
    guaranteedUpgrade: 'split'
  },
  {
    wave: 4,
    title: 'Meeting Brick Wall',
    enemies: ['meeting', 'intern', 'meeting'],
    guaranteedUpgrade: 'bomb'
  },
  {
    wave: 5,
    title: 'Deadline Uplink',
    enemies: ['deadline', 'scope', 'deadline', 'intern'],
    guaranteedUpgrade: 'poison'
  },
  {
    wave: 6,
    title: 'Office Blender',
    enemies: ['meeting', 'deadline', 'scope', 'intern', 'meeting'],
    guaranteedUpgrade: 'rubber'
  },
  {
    wave: 7,
    title: 'Magnetized Nonsense',
    enemies: ['deadline', 'scope', 'meeting', 'deadline', 'intern'],
    guaranteedUpgrade: 'magnet'
  },
  {
    wave: 8,
    title: 'Compliance Review',
    enemies: ['boss']
  }
] as const;

export function getPotassiumWave(wave: number): PotassiumWaveDefinition {
  const clampedIndex = Math.max(0, Math.min(POTASSIUM_WAVES.length - 1, wave - 1));
  return POTASSIUM_WAVES[clampedIndex];
}

export function isPotassiumBossWave(wave: number): boolean {
  return getPotassiumWave(wave).enemies.includes('boss');
}

export function getUnlockedPotassiumEnemies(wave: number): PotassiumEnemyKind[] {
  return unique(POTASSIUM_WAVES
    .filter((definition) => definition.wave <= wave)
    .flatMap((definition) => definition.enemies)
    .filter((enemy) => enemy !== 'boss'));
}

export function getUnlockedPotassiumUpgrades(wave: number): PotassiumUpgradeKind[] {
  return unique(POTASSIUM_WAVES
    .filter((definition) => definition.wave <= wave)
    .map((definition) => definition.guaranteedUpgrade)
    .filter((upgrade): upgrade is PotassiumUpgradeKind => upgrade !== undefined));
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
