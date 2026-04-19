import { describe, it, expect } from 'vitest';
import { HOBBY_REACT_OVERLAY_IDS } from './featureIds';
import { composePortfolioSections, type FeaturePluginDefinition } from './portfolioCompose';
import { OVERWORLD_BUILDING_PLACEMENTS } from './worldLayout';
import { MiniGameType } from '../game/miniGameKind';

/** Minimal defs for composition tests (no Phaser / React imports). */
function minimalDefs(): FeaturePluginDefinition[] {
  const street: FeaturePluginDefinition[] = OVERWORLD_BUILDING_PLACEMENTS.map(({ id }) => ({
    id,
    name: id,
    description: id,
    type: id === 'hobbies' ? MiniGameType.PHASER_SCENE : MiniGameType.REACT_OVERLAY
  }));
  const hobbyRooms: FeaturePluginDefinition[] = HOBBY_REACT_OVERLAY_IDS.map((id) => ({
    id,
    name: id,
    description: id,
    type: MiniGameType.REACT_OVERLAY,
    overlayParentId: 'hobbies' as const
  }));
  return [...street, ...hobbyRooms];
}

describe('composePortfolioSections', () => {
  it('merges overworld x from worldLayout', () => {
    const sections = composePortfolioSections(minimalDefs(), OVERWORLD_BUILDING_PLACEMENTS);
    for (const { id, x } of OVERWORLD_BUILDING_PLACEMENTS) {
      const row = sections.find((s) => s.id === id);
      expect(row?.x).toBe(x);
    }
  });

  it('preserves overlayParentId for hobby overlays', () => {
    const sections = composePortfolioSections(minimalDefs(), OVERWORLD_BUILDING_PLACEMENTS);
    for (const id of HOBBY_REACT_OVERLAY_IDS) {
      const row = sections.find((s) => s.id === id);
      expect(row?.overlayParentId).toBe('hobbies');
    }
  });
});
