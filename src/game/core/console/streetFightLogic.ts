/**
 * The street during the Out of Bounds escape (#163): in alarm, and the fight.
 * Geometry, the horde and copy live in content/outOfBoundsStreetFight.ts; the
 * page coming apart in content/outOfBoundsScreenDestroyer.ts.
 */
import { isSimulationBroken } from './content/outOfBoundsVoid';
import {
  SCREEN_DESTROYER_TEXT,
  screenDestroyerProgress,
  type ScreenDestroyerProgress
} from './content/outOfBoundsScreenDestroyer';
import {
  OUT_OF_BOUNDS_STREET_TEXT,
  streetFightProgress,
  type StreetFightEnemy,
  type StreetFightProgress
} from './content/outOfBoundsStreetFight';
import type { GameSessionEvent, GameWorldState } from './types';

/** What a swing is aimed at: an enemy, or the page behind them (a building, then the screen). */
export type HammerTarget = StreetFightEnemy | 'page';

/** The street is in alarm whenever the simulation is broken. */
export function isStreetInAlarm(state: Pick<GameWorldState, 'ownedItemIds'>): boolean {
  return isSimulationBroken(state.ownedItemIds);
}

export interface StreetAlarmObservation {
  doors: 'taped shut';
  fight: StreetFightProgress;
  /** The page coming apart (#164), from the moment the chick is down; null before that. */
  destroyer: ScreenDestroyerProgress | null;
  description: string;
}

/** The screen destroyer's progress, or null while the evil chick still stands. */
export function observeScreenDestroyer(state: Pick<GameWorldState, 'screenSmashes'>): ScreenDestroyerProgress | null {
  if (streetFightProgress(state.screenSmashes).phase === 'chick') return null;
  // Smash 1 was the chick; every later one landed on the page.
  return screenDestroyerProgress(state.screenSmashes - 1);
}

export function observeStreetAlarm(state: GameWorldState): StreetAlarmObservation | null {
  if (!isStreetInAlarm(state)) return null;
  return {
    doors: 'taped shut',
    fight: streetFightProgress(state.screenSmashes),
    destroyer: observeScreenDestroyer(state),
    description: OUT_OF_BOUNDS_STREET_TEXT.alarm
  };
}

/** What Danilo finds coming up the hatch while the simulation is broken. */
export function streetAlarmArrivalText(state: GameWorldState): string {
  const { phase } = streetFightProgress(state.screenSmashes);
  if (phase === 'chick') return `${OUT_OF_BOUNDS_STREET_TEXT.alarm} ${OUT_OF_BOUNDS_STREET_TEXT.confront}`;
  return `${OUT_OF_BOUNDS_STREET_TEXT.alarm} ${OUT_OF_BOUNDS_STREET_TEXT.hordeIncoming}`;
}

export interface SwingOutcome {
  ok: boolean;
  message: string;
  events: GameSessionEvent[];
}

/**
 * One hammer swing. Headless, the enemy comes to you, so a plain swing always
 * lands: on the chick, then on a raccoon of the endless horde (which never
 * moves anything on). `swing page` aims past them, at the page. The live
 * scene only calls this when the hammer connects and says what it hit.
 */
export function swingHammer(state: GameWorldState, hit?: HammerTarget): SwingOutcome {
  if (!isStreetInAlarm(state))
    return {
      ok: false,
      message: OUT_OF_BOUNDS_STREET_TEXT.noHammer,
      events: []
    };
  if (state.mode !== 'overworld') return { ok: true, message: OUT_OF_BOUNDS_STREET_TEXT.whiff, events: [] };

  if (streetFightProgress(state.screenSmashes).phase === 'chick') {
    state.screenSmashes = 1;
    return {
      ok: true,
      message: `${OUT_OF_BOUNDS_STREET_TEXT.chickSmashed} ${OUT_OF_BOUNDS_STREET_TEXT.hordeIncoming}`,
      events: [{ type: 'evil_chick_smashed' }]
    };
  }
  if (hit === 'page') return smashThePage(state);
  const text = hit === 'pigeon' ? OUT_OF_BOUNDS_STREET_TEXT.pigeonSmashed : OUT_OF_BOUNDS_STREET_TEXT.raccoonSmashed;
  return { ok: true, message: text, events: [] };
}

/**
 * The hammer lands on the page itself (#164): the next layer takes it, from
 * the building labels out to the glass, until the page falls into black.
 */
function smashThePage(state: GameWorldState): SwingOutcome {
  const before = observeScreenDestroyer(state)!;
  const layer = before.breaking;
  if (!layer) return { ok: false, message: SCREEN_DESTROYER_TEXT.nothingLeft, events: [] };

  state.screenSmashes += 1;
  const after = observeScreenDestroyer(state)!;
  const events: GameSessionEvent[] = [{ type: 'screen_layer_hit', layer, hits: after.hits }];
  const lines: string[] = [SCREEN_DESTROYER_TEXT.hit[layer]];
  if (after.breaking !== layer) {
    events.push({ type: 'screen_layer_broken', layer });
    lines.push(SCREEN_DESTROYER_TEXT.broken[layer]);
  }
  if (after.blackout) {
    events.push({ type: 'screen_blackout' });
    lines.push(SCREEN_DESTROYER_TEXT.blackout);
  }
  return { ok: true, message: lines.join(' '), events };
}
