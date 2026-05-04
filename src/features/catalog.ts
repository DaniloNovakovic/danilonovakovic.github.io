import { BASEMENT_FEATURE_CATALOG_ENTRIES } from './basement/catalog';
import type { FeatureCatalogEntry } from './catalogTypes';
import { HOBBIES_FEATURE_CATALOG_ENTRIES } from './hobbies/catalog';
import { PORTFOLIO_FEATURE_CATALOG_ENTRIES } from './portfolio/catalog';
import { POTASSIUM_SLIP_FEATURE_CATALOG_ENTRIES } from './potassiumSlip/catalog';

export type { FeatureCatalogEntry } from './catalogTypes';

export const FEATURE_CATALOG_ENTRIES: FeatureCatalogEntry[] = [
  ...PORTFOLIO_FEATURE_CATALOG_ENTRIES,
  ...HOBBIES_FEATURE_CATALOG_ENTRIES,
  ...BASEMENT_FEATURE_CATALOG_ENTRIES,
  ...POTASSIUM_SLIP_FEATURE_CATALOG_ENTRIES
];
