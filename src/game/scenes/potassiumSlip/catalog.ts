import { PHASER_SCENE_KEYS } from '@game/registry/featureIds';
import type { FeatureCatalogEntry } from '@game/registry/catalogTypes';

export const POTASSIUM_SLIP_FEATURE_CATALOG_ENTRIES: FeatureCatalogEntry[] = [
  {
    id: 'potassium',
    name: 'Potassium Slip',
    description: 'Slip the incoming stakeholders and dodge the deadlines in this slippery challenge.',
    runtime: {
      kind: 'phaserScene',
      sceneKey: PHASER_SCENE_KEYS.potassium,
      loadScene: () =>
        import('./runtime/PotassiumSlipScene').then((m) => m.PotassiumSlipScene)
    }
  }
];
