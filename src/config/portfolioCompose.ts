import type { MiniGameId } from './featureIds';
import type { MiniGamePlugin } from '../game/types';

export type FeaturePluginDefinition = Omit<MiniGamePlugin, 'x'>;

/**
 * Merges overworld X positions into feature definitions (single composition step).
 */
export function composePortfolioSections(
  defs: FeaturePluginDefinition[],
  placements: ReadonlyArray<{ id: MiniGameId; x: number }>
): MiniGamePlugin[] {
  const worldXById = new Map(placements.map((p) => [p.id, p.x]));
  return defs.map((def) => {
    const x = worldXById.get(def.id);
    return x !== undefined ? { ...def, x } : { ...def };
  });
}
