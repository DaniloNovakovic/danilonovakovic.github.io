export type StampedeFlockKind =
  | 'chick'
  | 'hen'
  | 'rooster'
  | 'nerd'
  | 'perfume'
  | 'fixer'
  | 'situationship'
  | 'bartender'
  | 'ex'
  | 'boyfriend';

export type StampedeWeaponThreat = 'badSelfie' | 'badBreath' | 'badSmell' | 'fakeGlasses';

export interface StampedeFlockProfile {
  kind: StampedeFlockKind;
  maxHp: number;
  scrapValue: number;
  speed: number;
  /** Body circle in world pixels. The drawn body and the hitbox are the same circle. */
  radius: number;
}

export interface StampedeMendBird {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
}

export const STAMPEDE_NERD_AT_MS = 14_000;
export const STAMPEDE_PERFUME_AT_MS = 18_000;
export const STAMPEDE_HEN_AT_MS = 22_000;
export const STAMPEDE_FIXER_AT_MS = 28_000;
export const STAMPEDE_SITUATIONSHIP_AT_MS = 34_000;
export const STAMPEDE_ROOSTER_AT_MS = 46_000;
export const STAMPEDE_BARTENDER_AT_MS = 54_000;

type StampedeSpawnKind = Exclude<StampedeFlockKind, 'ex' | 'boyfriend'>;

interface StampedeSpawnRule {
  atMs: number;
  cap: number;
  weight: number;
}

const SPAWN_RULES: Record<StampedeSpawnKind, StampedeSpawnRule> = {
  chick: { atMs: 0, cap: Number.POSITIVE_INFINITY, weight: 10 },
  nerd: { atMs: STAMPEDE_NERD_AT_MS, cap: 2, weight: 2 },
  perfume: { atMs: STAMPEDE_PERFUME_AT_MS, cap: 2, weight: 2 },
  hen: { atMs: STAMPEDE_HEN_AT_MS, cap: 4, weight: 3 },
  fixer: { atMs: STAMPEDE_FIXER_AT_MS, cap: 1, weight: 1.2 },
  situationship: { atMs: STAMPEDE_SITUATIONSHIP_AT_MS, cap: 2, weight: 1.5 },
  rooster: { atMs: STAMPEDE_ROOSTER_AT_MS, cap: 2, weight: 1.5 },
  bartender: { atMs: STAMPEDE_BARTENDER_AT_MS, cap: 1, weight: 1 }
};

const SPAWN_KINDS = Object.keys(SPAWN_RULES) as StampedeSpawnKind[];

/**
 * Picks the next arrival. A kind that just unlocked and has never shown up goes
 * first, so every stereotype gets its entrance; after that it is a weighted draw
 * among kinds that are unlocked and under their cap.
 */
export function pickStampedeSpawnKind(
  elapsedMs: number,
  activeCounts: Partial<Record<StampedeFlockKind, number>>,
  introduced: ReadonlySet<StampedeFlockKind>,
  random: () => number = Math.random
): StampedeSpawnKind {
  const open = SPAWN_KINDS.filter((kind) => (
    elapsedMs >= SPAWN_RULES[kind].atMs && (activeCounts[kind] ?? 0) < SPAWN_RULES[kind].cap
  ));
  const debut = open
    .filter((kind) => kind !== 'chick' && !introduced.has(kind))
    .sort((left, right) => SPAWN_RULES[left].atMs - SPAWN_RULES[right].atMs)[0];
  if (debut) return debut;

  const total = open.reduce((sum, kind) => sum + SPAWN_RULES[kind].weight, 0);
  let roll = random() * total;
  for (const kind of open) {
    roll -= SPAWN_RULES[kind].weight;
    if (roll < 0) return kind;
  }
  return 'chick';
}

export function getStampedeFlockProfile(kind: StampedeFlockKind): StampedeFlockProfile {
  switch (kind) {
    case 'boyfriend':
      return { kind, maxHp: 24, scrapValue: 15, speed: 40, radius: 27 };
    case 'ex':
      return { kind, maxHp: 14, scrapValue: 10, speed: 46, radius: 24 };
    case 'bartender':
      return { kind, maxHp: 3, scrapValue: 3, speed: 34, radius: 15 };
    case 'rooster':
      return { kind, maxHp: 3, scrapValue: 3, speed: 50, radius: 16 };
    case 'situationship':
      return { kind, maxHp: 2, scrapValue: 2, speed: 58, radius: 12 };
    case 'fixer':
      return { kind, maxHp: 2, scrapValue: 2, speed: 50, radius: 12 };
    case 'hen':
      return { kind, maxHp: 2, scrapValue: 2, speed: 34, radius: 15 };
    case 'perfume':
      return { kind, maxHp: 2, scrapValue: 2, speed: 52, radius: 12 };
    case 'nerd':
      return { kind, maxHp: 2, scrapValue: 2, speed: 38, radius: 12 };
    case 'chick':
    default:
      return { kind: 'chick', maxHp: 1, scrapValue: 1, speed: 52, radius: 11 };
  }
}

export function isStampedeWeaponImmune(
  kind: StampedeFlockKind,
  weapon: StampedeWeaponThreat,
  rank: 1 | 2
): boolean {
  if (kind === 'nerd' && weapon === 'fakeGlasses' && rank < 2) return true;
  if (kind === 'perfume' && weapon === 'badSmell') return true;
  if (kind === 'situationship' && weapon === 'badSelfie') return true;
  return false;
}

export function resolveStampedeMendTarget(
  fixer: { id: string; x: number; y: number },
  flock: readonly StampedeMendBird[]
): string | null {
  let bestId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  flock.forEach((bird) => {
    if (!bird.alive || bird.id === fixer.id || bird.hp <= 0 || bird.hp >= bird.maxHp) return;
    const distance = Math.hypot(bird.x - fixer.x, bird.y - fixer.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = bird.id;
    }
  });
  return bestId;
}
