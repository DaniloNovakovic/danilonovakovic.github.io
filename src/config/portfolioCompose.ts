import type { MiniGameId } from './featureIds';
import type { MiniGamePlugin } from '../runtime/types';
import { MiniGameType } from '../runtime/miniGameKind';
import type { FeatureRuntimeBinding } from './featureRuntimeBindings';

export interface FeaturePluginDefinition {
  id: MiniGameId;
  name: string;
  description: string;
  overlayParentId?: MiniGameId;
}

export type OverworldBuildingTypeObject = {
  kind: 'overworldBuilding';
  id: MiniGameId;
  x: number;
};

/**
 * Merges overworld X positions into feature definitions (single composition step).
 */
export function composePortfolioSections(
  defs: FeaturePluginDefinition[],
  placements: readonly OverworldBuildingTypeObject[],
  bindings: Readonly<Record<MiniGameId, FeatureRuntimeBinding>>
): MiniGamePlugin[] {
  const worldXById = new Map(placements.map((p) => [p.id, p.x]));
  return defs.map((def): MiniGamePlugin => {
    const x = worldXById.get(def.id);
    const binding = bindings[def.id];
    const metadata = x !== undefined ? { ...def, x } : { ...def };

    if (binding.kind === 'phaserScene') {
      return {
        id: metadata.id,
        name: metadata.name,
        description: metadata.description,
        ...(x !== undefined ? { x } : {}),
        type: MiniGameType.PHASER_SCENE,
        sceneKey: binding.sceneKey,
        loadScene: binding.loadScene
      };
    }

    return {
      ...metadata,
      type: MiniGameType.REACT_OVERLAY,
      loadComponent: binding.loadComponent
    };
  });
}
