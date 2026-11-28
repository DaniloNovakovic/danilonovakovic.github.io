/**
 * Out of Bounds, Act 3 step 4 (#164, reworked 2026-11-28): the screen
 * destroyer. Danilo's direction: the horde never ends, so the way on is to
 * hit what's behind it. It escalates outward, so the player works it out a
 * step at a time:
 *
 * 1. **labels**: a swing that misses the raccoons hits the building behind
 *    Danilo, and the building labels tilt on their bolts, then tumble off.
 * 2. **street**: now a building he hits crashes down, one per hit, and bits of
 *    the rest of the street come loose with it. The last one takes everything
 *    else down: blank paper. "Wait a second... what if..."
 * 3. **card**: the hammer hits the screen. The card that frames the game
 *    cracks, then falls away, and the page is paper edge to edge.
 * 4. **glass**: the browser viewport itself cracks, hit after hit, until it
 *    shatters into black (the Act 4 hand-off).
 *
 * One number again: smashes on the page so far. The shell keeps the count,
 * so it resumes after any remount.
 * Design source: docs/game-design/secrets/out-of-bounds.md (Act 3, step 4).
 */
import { OVERWORLD_BUILDING_SPOTS } from './overworldSpots';

export type ScreenLayerId = 'labels' | 'street' | 'card' | 'glass';

interface ScreenLayerShape {
  id: ScreenLayerId;
  /** Smashes it takes to break this layer. */
  hits: number;
  /** For the headless console. */
  name: string;
}

/** The layers, in the order they break: the street first, then the screen around it. */
const SCREEN_LAYERS: readonly ScreenLayerShape[] = [
  { id: 'labels', hits: 3, name: 'the building labels' },
  // One hit per building: each one crashes down.
  { id: 'street', hits: OVERWORLD_BUILDING_SPOTS.length, name: 'the street' },
  { id: 'card', hits: 4, name: 'the card around the game' },
  { id: 'glass', hits: 6, name: 'the screen' }
];

/** Smashes on the page from the first label hit to the page falling into black. */
export const SCREEN_DESTROYER_TOTAL_HITS = SCREEN_LAYERS.reduce((sum, layer) => sum + layer.hits, 0);

export interface ScreenLayerState {
  id: ScreenLayerId;
  hits: number;
  hitsTaken: number;
  /** 0 (untouched) to 1 (gone). */
  damage: number;
  gone: boolean;
}

export interface ScreenDestroyerProgress {
  /** Smashes landed on the page so far. */
  hits: number;
  layers: readonly ScreenLayerState[];
  /** The layer the next smash lands on; null once everything is gone. */
  breaking: ScreenLayerId | null;
  /** Layers still (at least partly) there, in breaking order. */
  remaining: readonly ScreenLayerId[];
  /**
   * The hammer hits the screen now, not the drawing: a click or tap anywhere
   * is a smash, and a swing at nothing hits the glass in front of Danilo.
   */
  onTheScreen: boolean;
  /** Every layer is gone: the page has fallen into black. */
  blackout: boolean;
}

export function screenDestroyerProgress(destroyerHits: number): ScreenDestroyerProgress {
  const hits = Math.max(0, Math.min(Math.floor(destroyerHits), SCREEN_DESTROYER_TOTAL_HITS));
  let left = hits;
  const layers = SCREEN_LAYERS.map((shape): ScreenLayerState => {
    const hitsTaken = Math.min(left, shape.hits);
    left -= hitsTaken;
    return {
      id: shape.id,
      hits: shape.hits,
      hitsTaken,
      damage: hitsTaken / shape.hits,
      gone: hitsTaken === shape.hits
    };
  });
  const remaining = layers.filter((layer) => !layer.gone).map((layer) => layer.id);
  const breaking = remaining[0] ?? null;
  return {
    hits,
    layers,
    breaking,
    remaining,
    onTheScreen: breaking === 'card' || breaking === 'glass',
    blackout: remaining.length === 0
  };
}

/** Smashes on the page before this layer takes its first. */
export function screenHitsBefore(id: ScreenLayerId): number {
  const index = SCREEN_LAYERS.findIndex((layer) => layer.id === id);
  return SCREEN_LAYERS.slice(0, index).reduce((sum, layer) => sum + layer.hits, 0);
}

/** One layer's state, by id. */
export function screenLayer(progress: ScreenDestroyerProgress, id: ScreenLayerId): ScreenLayerState {
  return progress.layers.find((layer) => layer.id === id)!;
}

export function screenLayerName(id: ScreenLayerId): string {
  return SCREEN_LAYERS.find((layer) => layer.id === id)!.name;
}

/** Danilo, the first time the hammer lands on a building. */
export const SCREEN_FIRST_HIT_THOUGHT = '...did that sign just move?';
/** Danilo, the first time a building crashes down. */
export const SCREEN_FIRST_COLLAPSE_THOUGHT = 'It just... fell over.';
/** Danilo, a beat after the last of the street is gone: the screen is next. */
export const SCREEN_WHAT_IF_THOUGHT = 'Wait a second... what if...';

/** Danilo, as each layer goes. */
export const SCREEN_LAYER_BROKEN_THOUGHTS: Record<ScreenLayerId, string> = {
  labels: 'They were only ever labels. ...I can break this stuff?',
  street: 'There was never a street. Just paper.',
  card: 'There was a box around me the whole time.',
  glass: ''
};

/** The Act 4 hand-off, once the page has fallen into black. */
export const UNPLUGGED_TEXT = {
  title: 'Unplugged',
  lines: ['...signal lost.', 'Somewhere that isn’t a drawing, something opens its eyes.'],
  wakeUp: 'Wake up'
} as const;

/** The screen destroyer, for the headless console. */
export const SCREEN_DESTROYER_TEXT = {
  hit: {
    labels:
      'CLANG. The hammer misses the raccoons and hits the building behind them. Every sign on the street tilts on its bolts.',
    street: 'CRASH. The building folds up like paper and crashes down. Bits of the street come loose and fall with it.',
    card: 'CRACK. The hammer hits the screen: the card framing the game cracks from its corner.',
    glass: 'CRACK. The hammer hits the glass itself. Cracks run across the whole screen.'
  },
  broken: {
    labels: 'The signs slide off their buildings and tumble out of the picture.',
    street:
      'The last building falls, and the rest of the street with it: sky, pavement, everything. Just blank paper, and you. Wait a second... what if...',
    card: 'The card around the game cracks apart and falls away. It’s paper edge to edge now. Only the static-mode button hangs on, by a strip of tape.',
    glass: 'The screen shatters.'
  },
  blackout: 'The page falls into black. ...signal lost. Somewhere that isn’t a drawing, something opens its eyes.',
  nothingLeft: 'There is nothing left to hit. Only black.'
} satisfies {
  hit: Record<ScreenLayerId, string>;
  broken: Record<ScreenLayerId, string>;
  blackout: string;
  nothingLeft: string;
};
