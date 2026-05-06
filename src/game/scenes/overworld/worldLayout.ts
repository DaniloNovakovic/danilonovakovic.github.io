import type { OverlayId } from '@/game/overlays/overlayIds';
import { HOBBIES_SCENE_ID, type SceneId } from '@/game/scenes/sceneIds';

/**
 * Overworld building triggers (street width `OVERWORLD_WIDTH` in shared scene runtime config).
 * The scene owns where the trigger sits and whether it opens a scene or overlay.
 */
export type OverworldTriggerAction =
  | { kind: 'openOverlay'; overlayId: OverlayId }
  | { kind: 'enterScene'; sceneId: SceneId };

export interface OverworldBuildingTrigger {
  kind: 'overworldBuilding';
  id: string;
  x: number;
  action: OverworldTriggerAction;
}

export const OVERWORLD_BUILDING_TRIGGERS: readonly OverworldBuildingTrigger[] = [
  { kind: 'overworldBuilding', id: 'profile', x: 400, action: { kind: 'openOverlay', overlayId: 'profile' } },
  { kind: 'overworldBuilding', id: 'experiences', x: 900, action: { kind: 'openOverlay', overlayId: 'experiences' } },
  { kind: 'overworldBuilding', id: 'projects', x: 1400, action: { kind: 'openOverlay', overlayId: 'projects' } },
  { kind: 'overworldBuilding', id: 'abilities', x: 1900, action: { kind: 'openOverlay', overlayId: 'abilities' } },
  { kind: 'overworldBuilding', id: HOBBIES_SCENE_ID, x: 2400, action: { kind: 'enterScene', sceneId: HOBBIES_SCENE_ID } },
  { kind: 'overworldBuilding', id: 'contact', x: 2900, action: { kind: 'openOverlay', overlayId: 'contact' } }
];

export function getOverworldBuildingTrigger(id: string): OverworldBuildingTrigger | undefined {
  return OVERWORLD_BUILDING_TRIGGERS.find((trigger) => trigger.id === id);
}
