import type { MiniGamePlugin } from '@/game/runtime/types';
import { OVERWORLD_BUILDING_PLACEMENTS } from '@/game/scenes/overworld';
import { composePortfolioSections } from './portfolioCompose';
import { FEATURE_DEFINITIONS } from './featureDefinitions';
import { FEATURE_RUNTIME_BINDINGS } from './featureRuntimeBindings';

/**
 * Single composed catalog: overworld positions from feature layout plus feature metadata/runtime bindings.
 */
export const PORTFOLIO_SECTIONS: MiniGamePlugin[] = composePortfolioSections(
  FEATURE_DEFINITIONS,
  OVERWORLD_BUILDING_PLACEMENTS,
  FEATURE_RUNTIME_BINDINGS
);
