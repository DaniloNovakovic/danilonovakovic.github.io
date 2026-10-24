export const STAMPEDE_SPELL_IDS = ['badBreath', 'badSmell', 'fakeGlasses'] as const;

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
}

export interface StampedeSpellCast {
  spellId: StampedeSpellId;
  origin: StampedeSpellPoint;
  direction: StampedeSpellPoint;
  hitIds: readonly string[];
  cooldownMs: number;
  bark: string;
}

export interface StampedeSpellCastInput {
  spellId: StampedeSpellId;
  player: StampedeSpellPoint;
  facing: StampedeSpellPoint;
  candidates: readonly StampedeSpellCandidate[];
  rank?: 1 | 2;
}

const BAD_BREATH_RANGE = 188;
const BAD_BREATH_DOT = 0.45;
const BAD_BREATH_COOLDOWN_MS = 3_400;

const SMELL_RANGE = 118;
const SMELL_COOLDOWN_MS = 4_200;

const GLASSES_MAX_HITS = 4;
const GLASSES_COOLDOWN_MS = 6_800;

const SPELLS: Record<StampedeSpellId, StampedeSpellChoice & {
  cooldownMs: number;
  bark: string;
  bigBark: string;
}> = {
  badBreath: {
    id: 'badBreath',
    title: 'Bad Breath',
    description: 'Damages every chick in front of you, where you are looking.',
    color: '#1a1a1a',
    cooldownMs: BAD_BREATH_COOLDOWN_MS,
    bark: 'haah',
    bigBark: 'HAH'
  },
  badSmell: {
    id: 'badSmell',
    title: 'Bad Smell',
    description: 'A circle around you. Every chick inside takes the hint.',
    color: '#b4533d',
    cooldownMs: SMELL_COOLDOWN_MS,
    bark: 'phew',
    bigBark: 'SCATTER'
  },
  fakeGlasses: {
    id: 'fakeGlasses',
    title: 'Fake Glasses',
    description: 'The nearest chicks see the lenses and fold.',
    color: '#4b4337',
    cooldownMs: GLASSES_COOLDOWN_MS,
    bark: 'nope',
    bigBark: 'NOT IT'
  }
};

export function getStampedeSpellChoices(): readonly StampedeSpellChoice[] {
  return STAMPEDE_SPELL_IDS.map((id) => SPELLS[id]);
}

export function isStampedeSpellId(value: unknown): value is StampedeSpellId {
  return typeof value === 'string' && STAMPEDE_SPELL_IDS.includes(value as StampedeSpellId);
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
  rank
}: StampedeSpellCastInput): StampedeSpellCast {
  const direction = normalizePoint(facing) ?? { x: 1, y: 0 };
  const spell = SPELLS[spellId];
  const tuning = spellTuning(spellId, rank ?? 1);
  const hits = resolveSpellHits(spellId, player, direction, candidates, tuning);
  return {
    spellId,
    origin: { x: player.x, y: player.y },
    direction,
    hitIds: hits.map((candidate) => candidate.id),
    cooldownMs: tuning.cooldownMs,
    bark: hits.length >= 4 ? spell.bigBark : spell.bark
  };
}

function spellTuning(spellId: StampedeSpellId, rank: 1 | 2): {
  range: number;
  dot: number;
  cooldownMs: number;
  maxHits: number;
} {
  const upgraded = rank >= 2;
  if (spellId === 'badSmell') {
    return {
      range: upgraded ? 176 : SMELL_RANGE,
      dot: 1,
      cooldownMs: upgraded ? 2_800 : SMELL_COOLDOWN_MS,
      maxHits: Number.POSITIVE_INFINITY
    };
  }
  if (spellId === 'fakeGlasses') {
    return {
      range: Number.POSITIVE_INFINITY,
      dot: -1,
      cooldownMs: upgraded ? 4_600 : GLASSES_COOLDOWN_MS,
      maxHits: upgraded ? 7 : GLASSES_MAX_HITS
    };
  }
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
  facing: StampedeSpellPoint,
  candidates: readonly StampedeSpellCandidate[],
  tuning: { range: number; dot: number; maxHits: number }
): StampedeSpellCandidate[] {
  if (spellId === 'fakeGlasses') {
    return [...candidates]
      .sort((left, right) => distanceBetween(player, left) - distanceBetween(player, right))
      .slice(0, tuning.maxHits);
  }

  return candidates.filter((candidate) => {
    const distance = distanceBetween(player, candidate);
    if (distance < 1) return spellId === 'badSmell';
    if (distance > tuning.range) return false;
    if (spellId === 'badSmell') return true;
    const dx = candidate.x - player.x;
    const dy = candidate.y - player.y;
    const dot = (dx / distance) * facing.x + (dy / distance) * facing.y;
    return dot >= tuning.dot;
  });
}

function distanceBetween(left: StampedeSpellPoint, right: StampedeSpellPoint): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function normalizePoint(point: StampedeSpellPoint): StampedeSpellPoint | null {
  const length = Math.hypot(point.x, point.y);
  if (length < 0.001) return null;
  return { x: point.x / length, y: point.y / length };
}
