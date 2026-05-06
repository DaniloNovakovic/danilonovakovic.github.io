import { PHASER_SCENE_KEYS } from '@/game/registry/featureIds';
import type { FeatureCatalogEntry } from '@/game/registry/catalogTypes';
import { messages } from '@/shared/i18n';

export const POTASSIUM_SLIP_FEATURE_CATALOG_ENTRIES: FeatureCatalogEntry[] = [
  {
    id: 'potassium',
    name: messages.catalog.potassiumSlip.potassium.name,
    description: messages.catalog.potassiumSlip.potassium.description,
    runtime: {
      kind: 'phaserScene',
      sceneKey: PHASER_SCENE_KEYS.potassium,
      loadScene: () =>
        import('./runtime/PotassiumSlipScene').then((m) => m.PotassiumSlipScene)
    }
  }
];
