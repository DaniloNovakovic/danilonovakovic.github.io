import { describe, expect, it } from 'vitest';
import { OVERLAY_IDS } from './overlayIds';
import { getOverlayDefinition, OVERLAY_DEFINITIONS } from './overlayRegistry';

describe('overlayRegistry', () => {
  it('resolves every overlay id to one component-only overlay definition', () => {
    expect(OVERLAY_DEFINITIONS.map((overlay) => overlay.id).sort()).toEqual([...OVERLAY_IDS].sort());

    for (const id of OVERLAY_IDS) {
      const overlay = getOverlayDefinition(id);
      expect(overlay.id).toBe(id);
      expect(Object.keys(overlay).sort()).toEqual(['component', 'id']);
      expect(typeof overlay.component).toBe('function');
    }
  });
});
