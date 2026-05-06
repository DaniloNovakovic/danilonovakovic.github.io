import { describe, expect, it } from 'vitest';
import { OVERLAY_IDS } from './overlayIds';
import { getDevSwitcherOverlays, getOverlayDefinition, OVERLAY_DEFINITIONS } from './overlayRegistry';

describe('overlayRegistry', () => {
  it('resolves every overlay id to one overlay definition', () => {
    expect(OVERLAY_DEFINITIONS.map((overlay) => overlay.id).sort()).toEqual([...OVERLAY_IDS].sort());

    for (const id of OVERLAY_IDS) {
      const overlay = getOverlayDefinition(id);
      expect(overlay.id).toBe(id);
      expect(overlay.title.length).toBeGreaterThan(0);
      expect(typeof overlay.component).toBe('function');
      expect(typeof overlay.loadComponent).toBe('function');
    }
  });

  it('keeps shell-only overlays out of dev target overlays', () => {
    const ids = getDevSwitcherOverlays().map((overlay) => overlay.id);
    expect(ids).toContain('profile');
    expect(ids).toContain('games');
    expect(ids).not.toContain('inventory');
    expect(ids).not.toContain('devSwitcher');
  });
});
