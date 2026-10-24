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

export type StampedeWeaponId = (typeof STAMPEDE_WEAPON_IDS)[number];
export type StampedeWeaponAction = 'unlock' | 'upgrade';

const STAMPEDE_UPGRADE_IDS = [
  'quickPencil',
  'wideSwipe',
  'swiftGuardian',
  ...STAMPEDE_WEAPON_IDS
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
const STAMPEDE_LEVEL_UP_CHOICE_COUNT = 3;

const SELFIE_COPY = {
  title: 'Bad Selfie',
  description: 'Damages a couple of random chicks nearby.',
  upgradeDescription: 'More chicks, from farther away, and it fires faster.',
  color: '#c2410c'
} as const;

const UPGRADE_COPY: Record<StampedeWeaponId, string> = {
  badSelfie: SELFIE_COPY.upgradeDescription,
  badBreath: 'A wider blast in front of you, and it comes out sooner.',
  badSmell: 'The circle gets bigger and comes back faster.',
  fakeGlasses: 'More chicks flinch, and the flash comes back sooner.'
};

export function getStampedeStartingWeaponChoices(): readonly StampedeUpgradeChoiceView[] {
  return STAMPEDE_WEAPON_IDS.map((id) => weaponChoice(id, 'unlock'));
}

export function getStampedeUpgradeChoices(
  ownedUpgradeIds: readonly string[] = [],
  upgradedWeaponIds: readonly string[] = []
): readonly StampedeUpgradeChoiceView[] {
  const unlocks = STAMPEDE_WEAPON_IDS.filter((id) => !ownedUpgradeIds.includes(id));
  const upgrades = STAMPEDE_WEAPON_IDS.filter((id) => (
    ownedUpgradeIds.includes(id) && !upgradedWeaponIds.includes(id)
  ));
  const picked: StampedeWeaponId[] = [];
  if (upgrades[0]) picked.push(upgrades[0]);
  if (unlocks[0]) picked.push(unlocks[0]);
  for (const id of [...upgrades.slice(1), ...unlocks.slice(1)]) {
    if (picked.length >= STAMPEDE_LEVEL_UP_CHOICE_COUNT) break;
    picked.push(id);
  }
  return picked.map((id) => weaponChoice(id, ownedUpgradeIds.includes(id) ? 'upgrade' : 'unlock'));
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
      return upgradedWeaponIds.includes(id) ? `${title} +` : title;
    })
    .join(' · ');
}

export function resolveOwnedSpells(upgrades: readonly string[]): StampedeSpellId[] {
  return resolveOwnedStampedeSpells(upgrades);
}

export function resolveEquippedSpell(upgrades: readonly string[]): StampedeSpellId | null {
  return resolveEquippedStampedeSpell(upgrades);
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
    maxHits: selfieRank >= 2 ? 4 : DEFAULT_STAMPEDE_AUTO_ATTACK_PROFILE.maxHits
  };
}

export function resolveStampedeGuardianSpeed(
  upgrades: readonly StampedeUpgradeId[]
): number {
  return upgrades.includes('swiftGuardian')
    ? STAMPEDE_PLAYER_SPEED + STAMPEDE_SWIFT_GUARDIAN_SPEED_BONUS
    : STAMPEDE_PLAYER_SPEED;
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
