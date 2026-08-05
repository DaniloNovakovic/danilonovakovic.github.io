export const PAPER = 0xfbfbf9;
export const PAPER_WARM = 0xf4f1ea;
export const INK = 0x1a1a1a;
export const FAINT = 0x4b4337;
export const WASH = 0x2a241c;

/** CSS twins of {@link PAPER} / {@link INK} for Phaser Text styles. */
export const PAPER_CSS = '#fbfbf9';
export const INK_CSS = '#1a1a1a';

export const STAGE_WIDTH = 1600;
export const STAGE_HEIGHT = 720;
export const GROUND_Y = 520;

/**
 * Parallax bands. Scenery bakes into one texture per band, so each band costs a
 * single quad per frame no matter how dense the drawing is.
 */
/**
 * Vertical composition, in world units around {@link GROUND_Y}. Camera zoom is
 * derived from this so the same slice of world is framed on every screen, and
 * scenery can be authored against a window that is actually visible.
 *
 * Sized for a phone-friendly walk: enough sky and fore verge that the route
 * reads as a place, not a close-up talking head.
 */
export const VIEW_ABOVE_GROUND = 250;
export const VIEW_BELOW_GROUND = 90;
export const VIEW_HEIGHT = VIEW_ABOVE_GROUND + VIEW_BELOW_GROUND;
export const SKY_TOP = GROUND_Y - VIEW_ABOVE_GROUND;
export const VIEW_BOTTOM = GROUND_Y + VIEW_BELOW_GROUND;

export const LAYERS = {
  // Runs all the way to the ground line so the distant fill passes behind the
  // canopy instead of ending in a visible tonal seam above it.
  far: { top: 0, width: STAGE_WIDTH, height: GROUND_Y, scrollFactor: 0.35, depth: 5 },
  near: { top: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT, scrollFactor: 1, depth: 14 },
  // Tall enough for fore corn to frame the lane. Wider than the stage: a
  // scroll factor above 1 outruns the right edge otherwise.
  fore: { top: 458, width: 2000, height: 170, scrollFactor: 1.22, depth: 30 }
} as const;

/** Bottom of the far band — distant silhouettes rest on this line. */
export const HORIZON_Y = LAYERS.far.height;

/** Bridge campfire, in world X. Shared so drifting smoke lands on the tent. */
export const BRIDGE_CAMP_X = 742;

export type RidgeLayerId = keyof typeof LAYERS;

export const DEPTH = {
  ambientFar: 8,
  ambientNear: 16,
  actor: 20,
  presence: 36,
  crt: 50
} as const;

/**
 * Nameplate fade window, in stage progress. Wide enough that anyone clearly on
 * screen is labelled, with a short ramp at the edge: a plate lingering at half
 * opacity looks like a rendering fault rather than a deliberate fade.
 */
export const PRESENCE_NEAR = 0.27;
export const PRESENCE_FAR = 0.33;
