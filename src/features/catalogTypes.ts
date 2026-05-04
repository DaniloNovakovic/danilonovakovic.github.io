import type { FeaturePluginDefinition } from '@config/portfolioCompose';
import type { FeatureRuntimeBinding } from '@config/featureRuntimeBindings';

export type FeatureCatalogEntry = FeaturePluginDefinition & {
  runtime: FeatureRuntimeBinding;
};
