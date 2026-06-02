const PORTFOLIO_OVERLAY_IDS = [
  'profile',
  'experiences',
  'projects',
  'abilities',
  'contact'
] as const;

export const HOBBIES_OVERLAY_IDS = ['art', 'music', 'fitness', 'dancing'] as const;
const BASEMENT_OVERLAY_IDS = ['games'] as const;
const GLOBAL_OVERLAY_IDS = ['inventory', 'devSwitcher', 'trailCard', 'manualPage'] as const;

export const OVERLAY_IDS = [
  ...PORTFOLIO_OVERLAY_IDS,
  ...HOBBIES_OVERLAY_IDS,
  ...BASEMENT_OVERLAY_IDS,
  ...GLOBAL_OVERLAY_IDS
] as const;

export type PortfolioOverlayId = (typeof PORTFOLIO_OVERLAY_IDS)[number];
export type HobbiesOverlayId = (typeof HOBBIES_OVERLAY_IDS)[number];
export type BasementOverlayId = (typeof BASEMENT_OVERLAY_IDS)[number];
export type GlobalOverlayId = (typeof GLOBAL_OVERLAY_IDS)[number];
export type OverlayId = (typeof OVERLAY_IDS)[number];

export const DEV_SWITCHER_OVERLAY_ID = 'devSwitcher' satisfies OverlayId;
export const BASEMENT_CONSOLE_OVERLAY_ID = 'games' satisfies BasementOverlayId;
