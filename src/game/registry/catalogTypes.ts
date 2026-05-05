import type { FeatureDefinition } from '@/game/registry/portfolioCompose';
import type { FeatureRuntimeBinding } from '@/game/registry/featureRuntimeBindings';

export type FeatureCatalogEntry = FeatureDefinition & {
  runtime: FeatureRuntimeBinding;
};
