import type { FeaturePluginDefinition } from './portfolioCompose';
import { FEATURE_CATALOG_ENTRIES } from '@/game/registry/catalog';

export const FEATURE_PLUGIN_DEFINITIONS: FeaturePluginDefinition[] = FEATURE_CATALOG_ENTRIES.map(
  ({ id, name, description, overlayParentId }) => ({
    id,
    name,
    description,
    ...(overlayParentId !== undefined ? { overlayParentId } : {})
  })
);
