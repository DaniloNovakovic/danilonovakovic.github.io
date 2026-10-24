import {
  DEFAULT_STAMPEDE_AUTO_ATTACK_PROFILE,
  type StampedeAutoAttackProfile
} from './autoAttack';
import { STAMPEDE_PLAYER_SPEED } from './movement';
import {
  getStampedeSpellChoices,
  resolveEquippedStampedeSpell,
  resolveOwnedStampedeSpells,
  type StampedeSpellId
} from './spells';

export const STAMPEDE_WEAPON_IDS = ['badSelfie', 'badBreath', 'badSmell', 'fakeGlasses'] as const;
export const STAMPEDE_CHOICE_CAP = 3;

export const STAMPEDE_MOD_IDS = [
  'breathWide',
  'breathLinger',
  'breathCross',
  'smellFar',
  'smellFast',
  'smellTwin',
  'smellFat',
  'selfieGroup',
  'selfiePose',
  'selfieRear',
  'glassesRx',
  'glassesStare',
  'glassesSide'
] as const;

export type StampedeWeaponId = (typeof STAMPEDE_WEAPON_IDS)[number];
export type StampedeModId = (typeof STAMPEDE_MOD_IDS)[number];
export type StampedeWeaponAction = 'unlock' | 'upgrade';

const STAMPEDE_UPGRADE_IDS = [
  'quickPencil',
  'wideSwipe',
  'swiftGuardian',
  ...STAMPEDE_WEAPON_IDS,
  ...STAMPEDE_MOD_IDS
] as const;

export type StampedeUpgradeId = (typeof STAMPEDE_UPGRADE_IDS)[number];

export interface StampedeUpgradeChoiceView {
  id: StampedeUpgradeId;
  title: string;
  description: string;
  color: string;
  action?: StampedeWeaponAction;
}

const STAMPEDE_QUICK_PENCIL_COOLDOWN_MS = 1_800;
const STAMPEDE_WIDE_SWIPE_HALF_WIDTH = 38;
const STAMPEDE_SWIFT_GUARDIAN_SPEED_BONUS = 35;
const SELFIE_COPY = {
  title: 'Bad Selfie',
  description: 'Damages a couple of random chicks nearby. Survivors are left dazed. A situationship will not pose.',
  upgradeDescription: 'More chicks, from farther away, and it fires faster. Survivors stay dazed.',
  color: '#c2410c'
} as const;

const UPGRADE_COPY: Record<StampedeWeaponId, string> = {
  badSelfie: SELFIE_COPY.upgradeDescription,
  badBreath: 'The bubbles change how the breath moves.',
  badSmell: 'The cloud changes how it travels.',
  fakeGlasses: 'The lenses start doing something else.'
};

const MODS_BY_WEAPON: Record<StampedeWeaponId, readonly StampedeModId[]> = {
  badBreath: ['breathWide', 'breathLinger', 'breathCross'],
  badSmell: ['smellFar', 'smellFast', 'smellTwin', 'smellFat'],
  badSelfie: ['selfieGroup', 'selfiePose', 'selfieRear'],
  fakeGlasses: ['glassesRx', 'glassesStare', 'glassesSide']
};

const MOD_COPY: Record<StampedeModId, { title: string; description: string; color: string }> = {
  breathWide: {
    title: 'Wide Belch',
    description: 'The bubbles spread into a wider lane.',
    color: '#3f6212'
  },
  breathLinger: {
    title: 'Lingering Stench',
    description: 'Bubbles stay where you breathed and keep spoiling the air.',
    color: '#3f6212'
  },
  breathCross: {
    title: 'Crosswind',
    description: 'The bubble stream snakes from side to side.',
    color: '#3f6212'
  },
  smellFar: {
    title: 'Far Orbit',
    description: 'The cloud swings farther away from you.',
    color: '#3f6212'
  },
  smellFast: {
    title: 'Fast Spin',
    description: 'The cloud whips around you.',
    color: '#3f6212'
  },
  smellTwin: {
    title: 'Twin Cloud',
    description: 'A second cloud rides the opposite side.',
    color: '#3f6212'
  },
  smellFat: {
    title: 'Fat Cloud',
    description: 'The cloud swells and covers more of whoever it touches.',
    color: '#3f6212'
  },
  selfieGroup: {
    title: 'Group Photo',
    description: 'The flash dazes chicks standing next to the one you snapped.',
    color: '#c2410c'
  },
  selfiePose: {
    title: 'Long Pose',
    description: 'Survivors stay dizzy for longer.',
    color: '#c2410c'
  },
  selfieRear: {
    title: 'Rear Camera',
    description: 'Also snaps whoever is behind you.',
    color: '#c2410c'
  },
  glassesRx: {
    title: 'Prescription',
    description: 'Nerds flinch too.',
    color: '#4b4337'
  },
  glassesStare: {
    title: 'Stare',
    description: 'Chicks who see the lenses freeze in place.',
    color: '#4b4337'
  },
  glassesSide: {
    title: 'Side Eye',
    description: 'The glare also catches a chick beside the target.',
    color: '#4b4337'
  }
};

export function getStampedeStartingWeaponChoices(
  random: () => number = Math.random
): readonly StampedeUpgradeChoiceView[] {
  const count = random() < 0.5 ? 2 : 3;
  return shuffle(STAMPEDE_WEAPON_IDS, random)
    .slice(0, count)
    .map((id) => weaponChoice(id, 'unlock'));
}

export function getStampedeUpgradeChoices(
  ownedUpgradeIds: readonly string[] = [],
  _upgradedWeaponIds: readonly string[] = [],
  random: () => number = Math.random,
  draftsTaken = 0
): readonly StampedeUpgradeChoiceView[] {
  const mods = STAMPEDE_WEAPON_IDS.flatMap((weaponId) => (
    ownedUpgradeIds.includes(weaponId)
      ? MODS_BY_WEAPON[weaponId].filter((modId) => !ownedUpgradeIds.includes(modId))
      : []
  ));
  const unlocks = STAMPEDE_WEAPON_IDS.filter((id) => !ownedUpgradeIds.includes(id));
  const shuffledMods = shuffle(mods, random);
  const shuffledUnlocks = shuffle(unlocks, random);
  const picked: Array<StampedeModId | StampedeWeaponId> = [];
  const allowNewWeapon = draftsTaken >= 2 || shuffledMods.length === 0;
  const offerUnlock = allowNewWeapon
    && shuffledUnlocks.length > 0
    && (shuffledMods.length === 0 || random() < 0.28);
  if (offerUnlock && shuffledUnlocks[0]) picked.push(shuffledUnlocks[0]);
  shuffledMods.forEach((modId) => {
    if (picked.length < STAMPEDE_CHOICE_CAP) picked.push(modId);
  });
  if (allowNewWeapon) {
    shuffledUnlocks.forEach((weaponId) => {
      if (picked.length >= STAMPEDE_CHOICE_CAP || picked.includes(weaponId)) return;
      picked.push(weaponId);
    });
  }
  return picked.slice(0, STAMPEDE_CHOICE_CAP).map((id) => (
    isStampedeModId(id) ? modChoice(id) : weaponChoice(id, 'unlock')
  ));
}

export function getStampedeWeaponRank(
  ownedUpgradeIds: readonly string[],
  upgradedWeaponIds: readonly string[],
  weaponId: StampedeWeaponId
): 0 | 1 | 2 {
  if (upgradedWeaponIds.includes(weaponId)) return 2;
  if (ownedUpgradeIds.includes(weaponId)) return 1;
  return 0;
}

export function formatStampedeKitLabel(
  ownedUpgradeIds: readonly string[],
  upgradedWeaponIds: readonly string[]
): string {
  const owned = STAMPEDE_WEAPON_IDS.filter((id) => ownedUpgradeIds.includes(id));
  if (owned.length === 0) return 'Unarmed';
  return owned
    .map((id) => {
      const title = weaponChoice(id, 'unlock').title;
      const twisted = upgradedWeaponIds.includes(id)
        || MODS_BY_WEAPON[id].some((modId) => ownedUpgradeIds.includes(modId));
      return twisted ? `${title} +` : title;
    })
    .join(' · ');
}

export function resolveOwnedSpells(upgrades: readonly string[]): StampedeSpellId[] {
  return resolveOwnedStampedeSpells(upgrades);
}

export function resolveEquippedSpell(upgrades: readonly string[]): StampedeSpellId | null {
  return resolveEquippedStampedeSpell(upgrades);
}

export function isStampedeModId(value: unknown): value is StampedeModId {
  return typeof value === 'string' && STAMPEDE_MOD_IDS.includes(value as StampedeModId);
}

export function isStampedeWeaponId(value: unknown): value is StampedeWeaponId {
  return typeof value === 'string' && STAMPEDE_WEAPON_IDS.includes(value as StampedeWeaponId);
}

export function isStampedeUpgradeId(value: unknown): value is StampedeUpgradeId {
  return (
    typeof value === 'string' &&
    STAMPEDE_UPGRADE_IDS.includes(value as StampedeUpgradeId)
  );
}

export function resolveStampedeAutoAttackProfile(
  upgrades: readonly StampedeUpgradeId[],
  upgradedWeaponIds: readonly string[] = []
): StampedeAutoAttackProfile {
  const selfieRank = getStampedeWeaponRank(upgrades, upgradedWeaponIds, 'badSelfie');
  const boosted = selfieRank >= 2 || upgrades.includes('quickPencil') || upgrades.includes('wideSwipe');
  return {
    ...DEFAULT_STAMPEDE_AUTO_ATTACK_PROFILE,
    cooldownMs: boosted
      ? STAMPEDE_QUICK_PENCIL_COOLDOWN_MS
      : DEFAULT_STAMPEDE_AUTO_ATTACK_PROFILE.cooldownMs,
    range: selfieRank >= 2 || upgrades.includes('wideSwipe')
      ? 250
      : DEFAULT_STAMPEDE_AUTO_ATTACK_PROFILE.range,
    halfWidth: upgrades.includes('wideSwipe')
      ? STAMPEDE_WIDE_SWIPE_HALF_WIDTH
      : DEFAULT_STAMPEDE_AUTO_ATTACK_PROFILE.halfWidth,
    maxHits: selfieRank >= 2 ? 4 : DEFAULT_STAMPEDE_AUTO_ATTACK_PROFILE.maxHits,
    rear: upgrades.includes('selfieRear'),
    groupDaze: upgrades.includes('selfieGroup'),
    longPose: upgrades.includes('selfiePose')
  };
}

export function resolveStampedeGuardianSpeed(
  upgrades: readonly StampedeUpgradeId[]
): number {
  return upgrades.includes('swiftGuardian')
    ? STAMPEDE_PLAYER_SPEED + STAMPEDE_SWIFT_GUARDIAN_SPEED_BONUS
    : STAMPEDE_PLAYER_SPEED;
}

function modChoice(id: StampedeModId): StampedeUpgradeChoiceView {
  const copy = MOD_COPY[id];
  return {
    id,
    title: copy.title,
    description: copy.description,
    color: copy.color,
    action: 'upgrade'
  };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = copy[index]!;
    copy[index] = copy[swapIndex]!;
    copy[swapIndex] = current;
  }
  return copy;
}

function weaponChoice(id: StampedeWeaponId, action: StampedeWeaponAction): StampedeUpgradeChoiceView {
  if (id === 'badSelfie') {
    return {
      id,
      title: action === 'upgrade' ? `${SELFIE_COPY.title} +` : SELFIE_COPY.title,
      description: action === 'upgrade' ? SELFIE_COPY.upgradeDescription : SELFIE_COPY.description,
      color: SELFIE_COPY.color,
      action
    };
  }

  const spell = getStampedeSpellChoices().find((choice) => choice.id === id);
  const title = spell?.title ?? 'Bad Breath';
  return {
    id,
    title: action === 'upgrade' ? `${title} +` : title,
    description: action === 'upgrade' ? UPGRADE_COPY[id] : spell?.description ?? '',
    color: spell?.color ?? '#1a1a1a',
    action
  };
}
