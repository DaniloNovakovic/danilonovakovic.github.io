import type { FeatureDefinition } from './portfolioCompose';
import { FEATURE_CATALOG_ENTRIES } from '@/game/registry/catalog';

export const FEATURE_DEFINITIONS: FeatureDefinition[] = FEATURE_CATALOG_ENTRIES.map(
  ({ id, name, description, overlayParentId }) => ({
    id,
    name,
    description,
    ...(overlayParentId !== undefined ? { overlayParentId } : {})
  })
);
