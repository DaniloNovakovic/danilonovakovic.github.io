import { describe, expect, it } from 'vitest';
import { MINI_GAME_IDS } from './featureIds';
import { FEATURE_PLUGIN_DEFINITIONS } from './featurePlugins';
import {
  FEATURE_RUNTIME_BINDINGS,
  getRuntimeBinding
} from './featureRuntimeBindings';
import { PHASER_SCENE_MINIGAME_IDS } from './miniGameCategories';
import { MiniGameType } from '../runtime/miniGameKind';
import { PORTFOLIO_SECTIONS } from './portfolioRegistry';
import { FEATURE_CATALOG_ENTRIES } from '../features/catalog';

describe('feature runtime bindings', () => {
  it('defines exactly one runtime binding for every feature id', () => {
    expect(Object.keys(FEATURE_RUNTIME_BINDINGS).sort()).toEqual([...MINI_GAME_IDS].sort());

    for (const id of MINI_GAME_IDS) {
      const binding = getRuntimeBinding(id);
      expect(binding.kind === 'phaserScene' || binding.kind === 'reactOverlay').toBe(true);
      expect('loadScene' in binding).not.toBe('loadComponent' in binding);
    }
  });

  it('keeps feature metadata and runtime bindings aligned', () => {
    expect(FEATURE_CATALOG_ENTRIES.map((entry) => entry.id).sort()).toEqual([...MINI_GAME_IDS].sort());
    expect(FEATURE_PLUGIN_DEFINITIONS.map((def) => def.id).sort()).toEqual([...MINI_GAME_IDS].sort());
    expect(Object.keys(FEATURE_RUNTIME_BINDINGS).sort()).toEqual([...MINI_GAME_IDS].sort());
  });

  it('derives Phaser scene ids from scene bindings', () => {
    const sceneIds = PORTFOLIO_SECTIONS
      .filter((section) => section.type === MiniGameType.PHASER_SCENE)
      .map((section) => section.id);

    expect(PHASER_SCENE_MINIGAME_IDS).toEqual(sceneIds);
  });
});
