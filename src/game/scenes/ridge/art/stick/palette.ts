export const PAPER = 0xfbfbf9;
export const PAPER_WARM = 0xf4f1ea;
export const INK = 0x1a1a1a;
export const WASH = 0x2a241c;

/**
 * Opaque grey: {@link INK} laid over {@link PAPER} at `amount` (0..1).
 *
 * Translucent ink stacks wherever marks overlap, so a field of leaves turns
 * into blotchy darker patches. An opaque tone keeps a mass one flat value,
 * which is how a printed sketchbook grey actually behaves.
 */
export function inkTone(amount: number): number {
  const t = Math.min(1, Math.max(0, amount));
  const mix = (shift: number) => {
    const paper = (PAPER >> shift) & 0xff;
    const ink = (INK >> shift) & 0xff;
    return Math.round(paper + (ink - paper) * t);
  };
  return (mix(16) << 16) | (mix(8) << 8) | mix(0);
}

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

/** Height of the Concert stage deck above the lane; performers stand on it. */
export const CONCERT_STAGE_RISE = 28;

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

/** Residents within this stage progress of the player count as on screen for barks. */
export const PRESENCE_RANGE = 0.3;
