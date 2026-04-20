import type { MiniGamePlugin } from '../game/types';
import { composePortfolioSections } from './portfolioCompose';
import { FEATURE_PLUGIN_DEFINITIONS } from './featurePlugins';
import { OVERWORLD_BUILDING_PLACEMENTS } from './worldLayout';

/**
 * Single composed catalog: world positions from `worldLayout`, bindings and copy from `featurePlugins`.
 */
export const PORTFOLIO_SECTIONS: MiniGamePlugin[] = composePortfolioSections(
  FEATURE_PLUGIN_DEFINITIONS,
  OVERWORLD_BUILDING_PLACEMENTS
);
