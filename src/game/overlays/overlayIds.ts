export const PORTFOLIO_OVERLAY_IDS = [
  'profile',
  'experiences',
  'projects',
  'abilities',
  'contact'
] as const;

export const HOBBIES_OVERLAY_IDS = ['art', 'music', 'fitness', 'dancing'] as const;
export const BASEMENT_OVERLAY_IDS = ['games'] as const;
export const GLOBAL_OVERLAY_IDS = ['inventory', 'devSwitcher', 'trailCard'] as const;

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

export const INVENTORY_OVERLAY_ID = 'inventory' satisfies OverlayId;
export const DEV_SWITCHER_OVERLAY_ID = 'devSwitcher' satisfies OverlayId;
export const TRAIL_CARD_OVERLAY_ID = 'trailCard' satisfies GlobalOverlayId;
export const BASEMENT_CONSOLE_OVERLAY_ID = 'games' satisfies BasementOverlayId;

export function isOverlayId(id: string | null | undefined): id is OverlayId {
  return id !== null && id !== undefined && (OVERLAY_IDS as readonly string[]).includes(id);
}
