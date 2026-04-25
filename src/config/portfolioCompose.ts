import type { MiniGameId } from './featureIds';
import type { MiniGamePlugin } from '../runtime/types';
import { MiniGameType } from '../runtime/miniGameKind';

export type FeaturePluginDefinition = MiniGamePlugin extends infer T
  ? T extends MiniGamePlugin
    ? Omit<T, 'x'>
    : never
  : never;

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
  placements: readonly OverworldBuildingTypeObject[]
): MiniGamePlugin[] {
  const worldXById = new Map(placements.map((p) => [p.id, p.x]));
  return defs.map((def): MiniGamePlugin => {
    const x = worldXById.get(def.id);
    if (def.type === MiniGameType.REACT_OVERLAY) {
      return x !== undefined ? { ...def, x } : { ...def };
    }
    return x !== undefined ? { ...def, x } : { ...def };
  });
}
