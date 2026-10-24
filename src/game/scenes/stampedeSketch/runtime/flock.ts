export type StampedeFlockKind = 'chick' | 'hen' | 'rooster';

export interface StampedeFlockProfile {
  kind: StampedeFlockKind;
  maxHp: number;
  scrapValue: number;
  speed: number;
  radius: number;
  respawnMs: number;
}

export const STAMPEDE_HEN_AT_MS = 22_000;
export const STAMPEDE_ROOSTER_AT_MS = 46_000;

const HEN_SLOTS = new Set([4, 7, 11]);
const ROOSTER_SLOTS = new Set([2, 9]);

export function resolveStampedeFlockKind(slot: number, elapsedMs: number): StampedeFlockKind {
  if (elapsedMs >= STAMPEDE_ROOSTER_AT_MS && ROOSTER_SLOTS.has(slot)) return 'rooster';
  if (elapsedMs >= STAMPEDE_HEN_AT_MS && HEN_SLOTS.has(slot)) return 'hen';
  return 'chick';
}

export function getStampedeFlockProfile(kind: StampedeFlockKind): StampedeFlockProfile {
  switch (kind) {
    case 'rooster':
      return { kind, maxHp: 3, scrapValue: 3, speed: 42, radius: 9, respawnMs: 5_600 };
    case 'hen':
      return { kind, maxHp: 2, scrapValue: 2, speed: 15, radius: 8, respawnMs: 4_400 };
    case 'chick':
    default:
      return { kind: 'chick', maxHp: 1, scrapValue: 1, speed: 20, radius: 5, respawnMs: 3_200 };
  }
}
