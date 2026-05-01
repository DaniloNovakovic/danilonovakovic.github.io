import { describe, it, expect } from 'vitest';
import { BASEMENT_REACT_OVERLAY_IDS, HOBBY_REACT_OVERLAY_IDS } from './featureIds';
import { composePortfolioSections, type FeaturePluginDefinition } from './portfolioCompose';
import type { FeatureRuntimeBinding } from './featureRuntimeBindings';
import type { MiniGameId } from './featureIds';
import { OVERWORLD_BUILDING_PLACEMENTS } from './worldLayout';
import { MiniGameType } from '../runtime/miniGameKind';

function minimalDefs(): FeaturePluginDefinition[] {
  const street: FeaturePluginDefinition[] = OVERWORLD_BUILDING_PLACEMENTS.map(({ id }) => ({
    id,
    name: id,
    description: id
  }));
  const hobbyRooms: FeaturePluginDefinition[] = HOBBY_REACT_OVERLAY_IDS.map((id) => ({
    id,
    name: id,
    description: id,
    overlayParentId: 'hobbies' as const
  }));
  const basementOverlays: FeaturePluginDefinition[] = BASEMENT_REACT_OVERLAY_IDS.map((id) => ({
    id,
    name: id,
    description: id,
    overlayParentId: 'basement' as const
  }));
  return [...street, ...hobbyRooms, ...basementOverlays];
}

function minimalBindings(): Record<MiniGameId, FeatureRuntimeBinding> {
  return Object.fromEntries(
    minimalDefs().map((def) => [
      def.id,
      def.id === 'hobbies'
        ? {
            kind: 'phaserScene',
            sceneKey: 'hobbies',
            loadScene: async () => class {}
          }
        : {
            kind: 'reactOverlay',
            loadComponent: async () => ({ default: () => null })
          }
    ])
  ) as Record<MiniGameId, FeatureRuntimeBinding>;
}

describe('composePortfolioSections', () => {
  it('merges overworld x from worldLayout', () => {
    const sections = composePortfolioSections(
      minimalDefs(),
      OVERWORLD_BUILDING_PLACEMENTS,
      minimalBindings()
    );
    for (const { id, x } of OVERWORLD_BUILDING_PLACEMENTS) {
      const row = sections.find((s) => s.id === id);
      expect(row?.x).toBe(x);
    }
  });

  it('preserves overlayParentId for hobby overlays', () => {
    const sections = composePortfolioSections(
      minimalDefs(),
      OVERWORLD_BUILDING_PLACEMENTS,
      minimalBindings()
    );
    for (const id of HOBBY_REACT_OVERLAY_IDS) {
      const row = sections.find((s) => s.id === id);
      expect(row?.overlayParentId).toBe('hobbies');
    }
    for (const id of BASEMENT_REACT_OVERLAY_IDS) {
      const row = sections.find((s) => s.id === id);
      expect(row?.overlayParentId).toBe('basement');
    }
  });

  it('derives runtime type from bindings', () => {
    const sections = composePortfolioSections(
      minimalDefs(),
      OVERWORLD_BUILDING_PLACEMENTS,
      minimalBindings()
    );

    expect(sections.find((s) => s.id === 'hobbies')?.type).toBe(MiniGameType.PHASER_SCENE);
    expect(sections.find((s) => s.id === 'profile')?.type).toBe(MiniGameType.REACT_OVERLAY);
  });
});
