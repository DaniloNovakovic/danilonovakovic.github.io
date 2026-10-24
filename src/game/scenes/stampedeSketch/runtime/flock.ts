export type StampedeFlockKind =
  | 'chick'
  | 'hen'
  | 'rooster'
  | 'nerd'
  | 'perfume'
  | 'fixer'
  | 'situationship'
  | 'bartender';

export type StampedeWeaponThreat = 'badSelfie' | 'badBreath' | 'badSmell' | 'fakeGlasses';

export interface StampedeFlockProfile {
  kind: StampedeFlockKind;
  maxHp: number;
  scrapValue: number;
  speed: number;
  radius: number;
  respawnMs: number;
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

const NERD_SLOTS = new Set([1]);
const PERFUME_SLOTS = new Set([6]);
const HEN_SLOTS = new Set([4, 7, 11]);
const FIXER_SLOTS = new Set([8]);
const SITUATIONSHIP_SLOTS = new Set([3]);
const ROOSTER_SLOTS = new Set([2, 9]);
const BARTENDER_SLOTS = new Set([5]);

export function resolveStampedeFlockKind(slot: number, elapsedMs: number): StampedeFlockKind {
  if (elapsedMs >= STAMPEDE_BARTENDER_AT_MS && BARTENDER_SLOTS.has(slot)) return 'bartender';
  if (elapsedMs >= STAMPEDE_ROOSTER_AT_MS && ROOSTER_SLOTS.has(slot)) return 'rooster';
  if (elapsedMs >= STAMPEDE_SITUATIONSHIP_AT_MS && SITUATIONSHIP_SLOTS.has(slot)) return 'situationship';
  if (elapsedMs >= STAMPEDE_FIXER_AT_MS && FIXER_SLOTS.has(slot)) return 'fixer';
  if (elapsedMs >= STAMPEDE_HEN_AT_MS && HEN_SLOTS.has(slot)) return 'hen';
  if (elapsedMs >= STAMPEDE_PERFUME_AT_MS && PERFUME_SLOTS.has(slot)) return 'perfume';
  if (elapsedMs >= STAMPEDE_NERD_AT_MS && NERD_SLOTS.has(slot)) return 'nerd';
  return 'chick';
}

export function getStampedeFlockProfile(kind: StampedeFlockKind): StampedeFlockProfile {
  switch (kind) {
    case 'bartender':
      return { kind, maxHp: 3, scrapValue: 3, speed: 0, radius: 6, respawnMs: 6_400 };
    case 'rooster':
      return { kind, maxHp: 3, scrapValue: 3, speed: 42, radius: 9, respawnMs: 5_600 };
    case 'situationship':
      return { kind, maxHp: 2, scrapValue: 2, speed: 28, radius: 6, respawnMs: 4_200 };
    case 'fixer':
      return { kind, maxHp: 2, scrapValue: 2, speed: 24, radius: 6, respawnMs: 4_600 };
    case 'hen':
      return { kind, maxHp: 2, scrapValue: 2, speed: 15, radius: 8, respawnMs: 4_400 };
    case 'perfume':
      return { kind, maxHp: 2, scrapValue: 2, speed: 20, radius: 9, respawnMs: 4_000 };
    case 'nerd':
      return { kind, maxHp: 2, scrapValue: 2, speed: 13, radius: 6, respawnMs: 4_200 };
    case 'chick':
    default:
      return { kind: 'chick', maxHp: 1, scrapValue: 1, speed: 20, radius: 5, respawnMs: 3_200 };
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
