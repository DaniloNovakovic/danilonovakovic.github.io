import type { FeaturePluginDefinition } from '@/game/registry/portfolioCompose';
import type { FeatureRuntimeBinding } from '@/game/registry/featureRuntimeBindings';

export type FeatureCatalogEntry = FeaturePluginDefinition & {
  runtime: FeatureRuntimeBinding;
};
