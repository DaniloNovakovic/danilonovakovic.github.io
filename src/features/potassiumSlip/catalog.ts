import { PHASER_SCENE_KEYS } from '../../config/featureIds';
import type { FeatureCatalogEntry } from '../catalogTypes';

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
