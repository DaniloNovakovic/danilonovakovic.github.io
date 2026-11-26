/**
 * Out of Bounds, Act 3 step 4 (#164): the screen destroyer. Once the street
 * fight is won, every smash lands on the page itself, and the portfolio comes
 * apart layer after layer, from the chrome around the game inward: the header
 * peels, the building labels slide, the drawn street falls away, and last of
 * all Danilo's own drawing is erased. When nothing is left the page falls
 * into black (the Act 4 hand-off, not built yet: an "unplugged" placeholder).
 *
 * Like the fight, it is one number: how many smashes have landed since the
 * fight was cleared. The shell keeps one dent per smash, so it resumes from
 * them after any remount.
 * Design source: docs/game-design/secrets/out-of-bounds.md (Act 3, step 4).
 */

export type ScreenLayerId = 'header' | 'labels' | 'street' | 'danilo';

interface ScreenLayerShape {
  id: ScreenLayerId;
  /** Smashes it takes to break this layer. */
  hits: number;
  /** For the headless console. */
  name: string;
}

/** The layers, in the order they break: outside in, Danilo last. */
const SCREEN_LAYERS: readonly ScreenLayerShape[] = [
  { id: 'header', hits: 6, name: 'the header' },
  { id: 'labels', hits: 6, name: 'the building labels' },
  { id: 'street', hits: 10, name: 'the drawn street' },
  { id: 'danilo', hits: 6, name: "Danilo's drawing" }
];

/** Smashes from a cleared fight to the page falling into black. */
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
  /** Smashes landed on the page since the fight was cleared. */
  hits: number;
  layers: readonly ScreenLayerState[];
  /** The layer the next smash lands on; null once everything is gone. */
  breaking: ScreenLayerId | null;
  /** Layers still (at least partly) on the page, outermost first. */
  remaining: readonly ScreenLayerId[];
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
  return { hits, layers, breaking: remaining[0] ?? null, remaining, blackout: remaining.length === 0 };
}

/** One layer's state, by id. */
export function screenLayer(progress: ScreenDestroyerProgress, id: ScreenLayerId): ScreenLayerState {
  return progress.layers.find((layer) => layer.id === id)!;
}

export function screenLayerName(id: ScreenLayerId): string {
  return SCREEN_LAYERS.find((layer) => layer.id === id)!.name;
}

/** Danilo, once the fight is won: the screen is just a drawing, so... (once per visit). */
export const SCREEN_DESTROYER_START_THOUGHT = "It's all just a drawing. ...what if I keep hitting it?";

/** Danilo, as each layer goes. */
export const SCREEN_LAYER_BROKEN_THOUGHTS: Record<ScreenLayerId, string> = {
  header: 'The header came right off.',
  labels: 'They were only ever labels.',
  street: 'There was never a street. Just paper.',
  danilo: ''
};

/** The Act 4 hand-off placeholder, once the page has fallen into black. */
export const UNPLUGGED_TEXT = {
  title: 'Unplugged',
  lines: ['...signal lost.', 'Somewhere that isn’t a drawing, something opens its eyes.'],
  wakeUp: 'Wake up'
} as const;

/** The screen destroyer, for the headless console. */
export const SCREEN_DESTROYER_TEXT = {
  hit: {
    header: 'CRASH. The hammer goes through the glass and the header at the top of the page tears loose.',
    labels: 'CRASH. The building labels shudder and slide down their buildings.',
    street: 'CRASH. A chunk of the drawn street falls away, into blank paper.',
    danilo: 'CRASH. Your own outline starts to go, erased from the top down.'
  },
  broken: {
    header: 'The header peels off the page and drops away. Only the static-mode button hangs on, by a strip of tape.',
    labels: 'The labels slide off the buildings and tumble out of the picture.',
    street: 'The street is gone: buildings, sky and pavement. Just blank paper, and you.',
    danilo: 'The last line of you is gone.'
  },
  blackout:
    'The page falls into black. ...signal lost. Somewhere that isn’t a drawing, something opens its eyes. (Act 4 isn’t built yet.)',
  nothingLeft: 'There is nothing left to hit. Only black.'
} satisfies {
  hit: Record<ScreenLayerId, string>;
  broken: Record<ScreenLayerId, string>;
  blackout: string;
  nothingLeft: string;
};
