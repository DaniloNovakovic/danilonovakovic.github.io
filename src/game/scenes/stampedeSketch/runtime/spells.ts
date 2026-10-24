import { isStampedeWeaponImmune, type StampedeFlockKind } from './flock';

const STAMPEDE_SPELL_IDS = ['badBreath', 'badSmell', 'fakeGlasses'] as const;

export type StampedeSpellId = (typeof STAMPEDE_SPELL_IDS)[number];

export interface StampedeSpellChoice {
  id: StampedeSpellId;
  title: string;
  description: string;
  color: string;
}

export interface StampedeSpellPoint {
  x: number;
  y: number;
}

export interface StampedeSpellCandidate {
  id: string;
  x: number;
  y: number;
  kind?: StampedeFlockKind;
}

export interface StampedeSpellCast {
  spellId: StampedeSpellId;
  origin: StampedeSpellPoint;
  direction: StampedeSpellPoint;
  hitIds: readonly string[];
  resistedIds: readonly string[];
  cooldownMs: number;
  bark: string;
}

export interface StampedeSpellCastInput {
  spellId: StampedeSpellId;
  player: StampedeSpellPoint;
  facing: StampedeSpellPoint;
  candidates: readonly StampedeSpellCandidate[];
  rank?: 1 | 2;
  mods?: readonly string[];
}

const BAD_BREATH_RANGE = 188;
const BAD_BREATH_DOT = 0.45;
const BAD_BREATH_COOLDOWN_MS = 3_400;

const SMELL_RANGE = 118;
const SMELL_COOLDOWN_MS = 4_200;

const GLASSES_MAX_HITS = 2;
const GLASSES_COOLDOWN_MS = 6_800;

const SPELLS: Record<StampedeSpellId, StampedeSpellChoice & {
  cooldownMs: number;
  bark: string;
  bigBark: string;
}> = {
  badBreath: {
    id: 'badBreath',
    title: 'Bad Breath',
    description: 'Green bubbles pour out in front of you, where you are looking.',
    color: '#1a1a1a',
    cooldownMs: BAD_BREATH_COOLDOWN_MS,
    bark: 'haah',
    bigBark: 'HAH'
  },
  badSmell: {
    id: 'badSmell',
    title: 'Bad Smell',
    description: 'A stink cloud orbits you and spoils whoever it touches. Perfume does not.',
    color: '#b4533d',
    cooldownMs: SMELL_COOLDOWN_MS,
    bark: 'phew',
    bigBark: 'SCATTER'
  },
  fakeGlasses: {
    id: 'fakeGlasses',
    title: 'Fake Glasses',
    description: 'The nearest couple of chicks fold. Nerds see right through them.',
    color: '#4b4337',
    cooldownMs: GLASSES_COOLDOWN_MS,
    bark: 'nope',
    bigBark: 'NOT IT'
  }
};

export function getStampedeSpellChoices(): readonly StampedeSpellChoice[] {
  return STAMPEDE_SPELL_IDS.map((id) => SPELLS[id]);
}

export function resolveOwnedStampedeSpells(
  upgrades: readonly string[]
): StampedeSpellId[] {
  return STAMPEDE_SPELL_IDS.filter((id) => upgrades.includes(id));
}

export function resolveEquippedStampedeSpell(
  upgrades: readonly string[]
): StampedeSpellId | null {
  const owned = resolveOwnedStampedeSpells(upgrades);
  return owned[owned.length - 1] ?? null;
}

export function resolveStampedeSpellCast({
  spellId,
  player,
  facing,
  candidates,
  rank,
  mods = []
}: StampedeSpellCastInput): StampedeSpellCast {
  const direction = normalizePoint(facing) ?? { x: 1, y: 0 };
  const spell = SPELLS[spellId];
  const spellRank = rank ?? 1;
  const tuning = spellTuning(spellId, spellRank);
  const resolved = resolveSpellHits(spellId, player, candidates, tuning, spellRank, mods);
  return {
    spellId,
    origin: { x: player.x, y: player.y },
    direction,
    hitIds: resolved.hits.map((candidate) => candidate.id),
    resistedIds: resolved.resisted.map((candidate) => candidate.id),
    cooldownMs: tuning.cooldownMs,
    bark: resolved.hits.length >= 4 ? spell.bigBark : spell.bark
  };
}

function spellTuning(spellId: StampedeSpellId, rank: 1 | 2): {
  range: number;
  dot: number;
  cooldownMs: number;
  maxHits: number;
} {
  if (spellId === 'badSmell') return smellTuning(rank >= 2);
  if (spellId === 'fakeGlasses') return glassesTuning(rank >= 2);
  return breathTuning(rank >= 2);
}

function smellTuning(upgraded: boolean) {
  return {
    range: upgraded ? 176 : SMELL_RANGE,
    dot: 1,
    cooldownMs: upgraded ? 2_800 : SMELL_COOLDOWN_MS,
    maxHits: Number.POSITIVE_INFINITY
  };
}

function glassesTuning(upgraded: boolean) {
  return {
    range: Number.POSITIVE_INFINITY,
    dot: -1,
    cooldownMs: upgraded ? 4_600 : GLASSES_COOLDOWN_MS,
    maxHits: upgraded ? 4 : GLASSES_MAX_HITS
  };
}

function breathTuning(upgraded: boolean) {
  return {
    range: upgraded ? 260 : BAD_BREATH_RANGE,
    dot: upgraded ? 0.22 : BAD_BREATH_DOT,
    cooldownMs: upgraded ? 2_200 : BAD_BREATH_COOLDOWN_MS,
    maxHits: Number.POSITIVE_INFINITY
  };
}

function resolveSpellHits(
  spellId: StampedeSpellId,
  player: StampedeSpellPoint,
  candidates: readonly StampedeSpellCandidate[],
  tuning: { range: number; maxHits: number },
  rank: 1 | 2,
  mods: readonly string[]
): { hits: StampedeSpellCandidate[]; resisted: StampedeSpellCandidate[] } {
  if (spellId === 'badBreath' || spellId === 'badSmell') {
    return { hits: [], resisted: [] };
  }

  if (spellId === 'fakeGlasses') {
    const hits: StampedeSpellCandidate[] = [];
    const resisted: StampedeSpellCandidate[] = [];
    [...candidates]
      .sort((left, right) => distanceBetween(player, left) - distanceBetween(player, right))
      .forEach((candidate) => {
        const pierce = rank >= 2 || mods.includes('glassesRx');
        const immune = !pierce && isStampedeWeaponImmune(candidate.kind ?? 'chick', 'fakeGlasses', 1);
        if (immune) {
          if (distanceBetween(player, candidate) <= 220) resisted.push(candidate);
          return;
        }
        if (hits.length < tuning.maxHits) hits.push(candidate);
      });
    if (mods.includes('glassesSide')) {
      const neighbor = [...candidates]
        .filter((candidate) => !hits.includes(candidate) && !resisted.includes(candidate))
        .filter((candidate) => hits.some((hit) => distanceBetween(hit, candidate) <= 70))
        .sort((left, right) => {
          const leftDistance = Math.min(...hits.map((hit) => distanceBetween(hit, left)));
          const rightDistance = Math.min(...hits.map((hit) => distanceBetween(hit, right)));
          return leftDistance - rightDistance;
        })[0];
      if (neighbor && !isStampedeWeaponImmune(neighbor.kind ?? 'chick', 'fakeGlasses', pierceRank(rank, mods))) {
        hits.push(neighbor);
      }
    }
    return { hits, resisted };
  }

  const hits: StampedeSpellCandidate[] = [];
  const resisted: StampedeSpellCandidate[] = [];
  candidates.forEach((candidate) => {
    const distance = distanceBetween(player, candidate);
    if (distance < 1 || distance > tuning.range) return;
    if (isStampedeWeaponImmune(candidate.kind ?? 'chick', spellId, rank)) {
      resisted.push(candidate);
      return;
    }
    hits.push(candidate);
  });
  return { hits, resisted };
}

function pierceRank(rank: 1 | 2, mods: readonly string[]): 1 | 2 {
  return rank >= 2 || mods.includes('glassesRx') ? 2 : 1;
}

function distanceBetween(left: StampedeSpellPoint, right: StampedeSpellPoint): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function normalizePoint(point: StampedeSpellPoint): StampedeSpellPoint | null {
  const length = Math.hypot(point.x, point.y);
  if (length < 0.001) return null;
  return { x: point.x / length, y: point.y / length };
}
