import { BASEMENT_OVERLAY_DEFINITIONS } from '@/game/scenes/basement/overlayDefinitions';
import { HOBBIES_OVERLAY_DEFINITIONS } from '@/game/scenes/hobbies/overlayDefinitions';
import { GLOBAL_OVERLAY_DEFINITIONS } from './globalOverlayDefinitions';
import { PORTFOLIO_OVERLAY_DEFINITIONS } from './portfolio/overlayDefinitions';
import type { OverlayDefinition } from './types';
import type { OverlayId } from './overlayIds';

export const OVERLAY_DEFINITIONS: readonly OverlayDefinition[] = [
  ...PORTFOLIO_OVERLAY_DEFINITIONS,
  ...HOBBIES_OVERLAY_DEFINITIONS,
  ...BASEMENT_OVERLAY_DEFINITIONS,
  ...GLOBAL_OVERLAY_DEFINITIONS
];

const OVERLAY_BY_ID: ReadonlyMap<OverlayId, OverlayDefinition> = new Map(
  OVERLAY_DEFINITIONS.map((overlay) => [overlay.id, overlay])
);

export function getOverlayDefinition(id: OverlayId): OverlayDefinition {
  const overlay = OVERLAY_BY_ID.get(id);
  if (!overlay) {
    throw new Error(`Unknown overlay id "${id}"`);
  }
  return overlay;
}

export function getDevSwitcherOverlays(): readonly OverlayDefinition[] {
  return OVERLAY_DEFINITIONS.filter((overlay) => overlay.includeInDevSwitcher);
}
