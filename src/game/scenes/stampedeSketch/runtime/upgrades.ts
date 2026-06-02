import {
  DEFAULT_STAMPEDE_AUTO_ATTACK_PROFILE,
  type StampedeAutoAttackProfile
} from './autoAttack';
import { STAMPEDE_PLAYER_SPEED } from './movement';

const STAMPEDE_UPGRADE_IDS = [
  'quickPencil',
  'wideSwipe',
  'swiftGuardian'
] as const;

export type StampedeUpgradeId = (typeof STAMPEDE_UPGRADE_IDS)[number];

export interface StampedeUpgradeChoiceView {
  id: StampedeUpgradeId;
  title: string;
  description: string;
  color: string;
}

const STAMPEDE_QUICK_PENCIL_COOLDOWN_MS = 1_800;
const STAMPEDE_WIDE_SWIPE_HALF_WIDTH = 38;
const STAMPEDE_SWIFT_GUARDIAN_SPEED_BONUS = 35;

const STAMPEDE_UPGRADE_CHOICES: readonly StampedeUpgradeChoiceView[] = [
  {
    id: 'quickPencil',
    title: 'Quick Pencil',
    description: 'Swipe more often.',
    color: '#1a1a1a'
  },
  {
    id: 'wideSwipe',
    title: 'Wider Scribble',
    description: 'Catch ideas with a wider pencil swipe.',
    color: '#2563eb'
  },
  {
    id: 'swiftGuardian',
    title: 'Lighter Shoes',
    description: 'Move the blanket guardian a little faster.',
    color: '#b45309'
  }
];

export function getStampedeUpgradeChoices(): readonly StampedeUpgradeChoiceView[] {
  return STAMPEDE_UPGRADE_CHOICES;
}

export function isStampedeUpgradeId(value: unknown): value is StampedeUpgradeId {
  return (
    typeof value === 'string' &&
    STAMPEDE_UPGRADE_IDS.includes(value as StampedeUpgradeId)
  );
}

export function resolveStampedeAutoAttackProfile(
  upgrades: readonly StampedeUpgradeId[]
): StampedeAutoAttackProfile {
  return {
    ...DEFAULT_STAMPEDE_AUTO_ATTACK_PROFILE,
    cooldownMs: upgrades.includes('quickPencil')
      ? STAMPEDE_QUICK_PENCIL_COOLDOWN_MS
      : DEFAULT_STAMPEDE_AUTO_ATTACK_PROFILE.cooldownMs,
    halfWidth: upgrades.includes('wideSwipe')
      ? STAMPEDE_WIDE_SWIPE_HALF_WIDTH
      : DEFAULT_STAMPEDE_AUTO_ATTACK_PROFILE.halfWidth
  };
}

export function resolveStampedeGuardianSpeed(
  upgrades: readonly StampedeUpgradeId[]
): number {
  return upgrades.includes('swiftGuardian')
    ? STAMPEDE_PLAYER_SPEED + STAMPEDE_SWIFT_GUARDIAN_SPEED_BONUS
    : STAMPEDE_PLAYER_SPEED;
}
