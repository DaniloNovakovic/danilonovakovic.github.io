/**
 * Out of Bounds, Act 3 step 4 (#164, reworked 2026-11-28): the screen
 * destroyer. Danilo's direction: the horde never ends, so the way on is to
 * hit what's behind it. It escalates outward, so the player works it out a
 * step at a time:
 *
 * 1. **labels**: a swing that misses the raccoons hits the building behind
 *    Danilo, and every building label on the street tilts on its bolts, then
 *    they all tumble off.
 * 2. **buildings**: the next hit on any building shakes every building on the
 *    street; the one after brings them all crashing down, and bits of the
 *    sky come loose with them.
 * 3. **street**: what's left standing is the poles and signs. Hitting any of
 *    them wobbles them all, then topples them, and the rest of the street
 *    goes with them: blank paper. "Wait a second... what if..."
 * 4. **card**: the hammer hits the screen. The card that frames the game
 *    cracks, then falls away, and the page is paper edge to edge.
 * 5. **glass**: the browser viewport itself cracks, hit after hit, until it
 *    shatters into black (the Act 4 hand-off).
 *
 * One kind of thing breaks at a time, and a hit on any one of them hits them
 * all, so nobody has to walk the street hunting for the right building.
 *
 * One number again: smashes on the page so far. The shell keeps the count,
 * so it resumes after any remount.
 * Design source: docs/game-design/secrets/out-of-bounds.md (Act 3, step 4).
 */
export type ScreenLayerId = 'labels' | 'buildings' | 'street' | 'card' | 'glass';

interface ScreenLayerShape {
  id: ScreenLayerId;
  /** Smashes it takes to break this layer. */
  hits: number;
  /** For the headless console. */
  name: string;
}

/** The layers, in the order they break: the street first, then the screen around it. */
const SCREEN_LAYERS: readonly ScreenLayerShape[] = [
  { id: 'labels', hits: 2, name: 'the building labels' },
  { id: 'buildings', hits: 2, name: 'the buildings' },
  // The poles and signs, and the rest of the street with them.
  { id: 'street', hits: 2, name: 'the poles and signs' },
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

/**
 * Danilo, a beat after the last of the street is gone: the screen is next.
 * His only line in the whole destroyer: the rest is there to see.
 */
export const SCREEN_WHAT_IF_THOUGHT = 'Wait a second... what if...';

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
    buildings: 'CRUNCH. The building shudders, and every building on the street shudders with it.',
    street: 'CLANG. The hammer hits a pole, and every pole and sign on the street wobbles.',
    card: 'CRACK. The hammer hits the screen: the card framing the game cracks from its corner.',
    glass: 'CRACK. The hammer hits the glass itself. Cracks run across the whole screen.'
  },
  broken: {
    labels: 'Every label slides off its building and tumbles out of the picture.',
    buildings:
      'Every building on the street folds up like paper and crashes down at once. Bits of the sky come loose with them.',
    street:
      'The poles and signs topple, and the rest of the street goes with them: sky, pavement, everything. Just blank paper, and you. Wait a second... what if...',
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
