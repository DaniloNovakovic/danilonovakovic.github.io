import type { MiniGamePlugin } from '@game/runtime/types';
import { OVERWORLD_BUILDING_PLACEMENTS } from '@game/scenes/overworld/worldLayout';
import { composePortfolioSections } from './portfolioCompose';
import { FEATURE_PLUGIN_DEFINITIONS } from './featurePlugins';
import { FEATURE_RUNTIME_BINDINGS } from './featureRuntimeBindings';

/**
 * Single composed catalog: overworld positions from feature layout, bindings and metadata from feature plugins.
 */
export const PORTFOLIO_SECTIONS: MiniGamePlugin[] = composePortfolioSections(
  FEATURE_PLUGIN_DEFINITIONS,
  OVERWORLD_BUILDING_PLACEMENTS,
  FEATURE_RUNTIME_BINDINGS
);
