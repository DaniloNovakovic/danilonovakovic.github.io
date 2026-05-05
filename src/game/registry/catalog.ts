import { BASEMENT_FEATURE_CATALOG_ENTRIES } from '@/game/scenes/basement';
import type { FeatureCatalogEntry } from './catalogTypes';
import { HOBBIES_FEATURE_CATALOG_ENTRIES } from '@/game/scenes/hobbies';
import { PORTFOLIO_FEATURE_CATALOG_ENTRIES } from '@/game/portfolio/catalog';
import { POTASSIUM_SLIP_FEATURE_CATALOG_ENTRIES } from '@/game/scenes/potassiumSlip';

export type { FeatureCatalogEntry } from './catalogTypes';

export const FEATURE_CATALOG_ENTRIES: FeatureCatalogEntry[] = [
  ...PORTFOLIO_FEATURE_CATALOG_ENTRIES,
  ...HOBBIES_FEATURE_CATALOG_ENTRIES,
  ...BASEMENT_FEATURE_CATALOG_ENTRIES,
  ...POTASSIUM_SLIP_FEATURE_CATALOG_ENTRIES
];
