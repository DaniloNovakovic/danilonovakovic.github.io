import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';

const SHORTCUT_STAMP_IDS: Readonly<Record<string, string>> = {
  stampede_sketch: STAMPEDE_SKETCH_RIDGE_STAMP_ID
};

export function getRidgeBlockoutShortcutRequiredStampId(shortcutId: string): string | undefined {
  return SHORTCUT_STAMP_IDS[shortcutId];
}

export function isRidgeBlockoutShortcutAvailable(
  shortcutId: string,
  progress: { stampIds: readonly string[] }
): boolean {
  const stampId = getRidgeBlockoutShortcutRequiredStampId(shortcutId);
  return stampId ? progress.stampIds.includes(stampId) : false;
}
