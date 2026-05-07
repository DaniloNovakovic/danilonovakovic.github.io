import { describe, expect, it } from 'vitest';
import { SCENE_IDS } from './sceneIds';
import { getDevSwitcherScenes, getLoadableScene, getSceneDefinition, SCENE_DEFINITIONS } from './sceneRegistry';

describe('sceneRegistry', () => {
  it('resolves every scene id to one scene definition', () => {
    expect(SCENE_DEFINITIONS.map((scene) => scene.id).sort()).toEqual([...SCENE_IDS].sort());

    for (const id of SCENE_IDS) {
      const scene = getSceneDefinition(id);
      expect(scene.id).toBe(id);
      expect(scene.title.length).toBeGreaterThan(0);
      expect(scene.sceneKey.length).toBeGreaterThan(0);
    }
  });

  it('marks only Phaser-loaded child scenes as loadable', () => {
    expect(getLoadableScene('overworld')).toBeUndefined();
    expect(getLoadableScene('hobbies')?.loadScene).toBeDefined();
    expect(getLoadableScene('basement')?.loadScene).toBeDefined();
    expect(getLoadableScene('potassium')?.loadScene).toBeDefined();
    expect(getLoadableScene('ridge')?.loadScene).toBeDefined();
    expect(getLoadableScene('stampedeSketch')?.loadScene).toBeDefined();
  });

  it('exposes scene targets for the dev switcher', () => {
    expect(getDevSwitcherScenes().map((scene) => scene.id)).toEqual([...SCENE_IDS]);
  });
});
