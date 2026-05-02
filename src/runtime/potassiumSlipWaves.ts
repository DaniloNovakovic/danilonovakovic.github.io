export type PotassiumEnemyKind = 'intern' | 'scope' | 'meeting' | 'deadline' | 'wall' | 'boss';
export type PotassiumUpgradeKind = 'split' | 'rubber' | 'magnet';
export type PotassiumBananaModifier = 'normal' | 'poison' | 'bomb';

export interface PotassiumWaveDefinition {
  wave: number;
  title: string;
  enemies: PotassiumEnemyKind[];
  guaranteedUpgrade?: PotassiumUpgradeKind;
  modifierUnlock?: Exclude<PotassiumBananaModifier, 'normal'>;
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
    title: 'Bruise Certification',
    enemies: ['intern', 'scope', 'intern', 'scope'],
    modifierUnlock: 'poison'
  },
  {
    wave: 4,
    title: 'Wall Orientation',
    enemies: ['wall', 'intern', 'scope']
  },
  {
    wave: 5,
    title: 'Peel Bomb Paperwork',
    enemies: ['meeting', 'wall', 'intern'],
    modifierUnlock: 'bomb'
  },
  {
    wave: 6,
    title: 'Banana Split Training',
    enemies: ['deadline', 'scope', 'wall', 'intern'],
    guaranteedUpgrade: 'split'
  },
  {
    wave: 7,
    title: 'Office Blender',
    enemies: ['meeting', 'deadline', 'wall', 'scope', 'intern', 'meeting'],
    guaranteedUpgrade: 'rubber'
  },
  {
    wave: 8,
    title: 'Magnetized Nonsense',
    enemies: ['deadline', 'scope', 'wall', 'meeting', 'deadline', 'intern'],
    guaranteedUpgrade: 'magnet'
  },
  {
    wave: 9,
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

export function getUnlockedPotassiumModifiers(wave: number): PotassiumBananaModifier[] {
  return unique([
    'normal',
    ...POTASSIUM_WAVES
      .filter((definition) => definition.wave <= wave)
      .map((definition) => definition.modifierUnlock)
      .filter((modifier): modifier is Exclude<PotassiumBananaModifier, 'normal'> => modifier !== undefined)
  ]);
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
