/**
 * The street during the Out of Bounds escape (#163): in alarm, and the fight.
 * Geometry, waves and copy live in content/outOfBoundsStreetFight.ts.
 */
import { isSimulationBroken } from './content/outOfBoundsVoid';
import {
  SCREEN_DESTROYER_TEXT,
  screenDestroyerProgress,
  type ScreenDestroyerProgress
} from './content/outOfBoundsScreenDestroyer';
import {
  OUT_OF_BOUNDS_STREET_TEXT,
  STREET_FIGHT_TOTAL_SMASHES,
  streetFightProgress,
  streetFightTarget,
  type StreetFightEnemy,
  type StreetFightProgress,
  type StreetFightTarget
} from './content/outOfBoundsStreetFight';
import type { GameSessionEvent, GameWorldState } from './types';

const SMASHED_TEXT: Record<StreetFightTarget, string> = {
  chick: OUT_OF_BOUNDS_STREET_TEXT.chickSmashed,
  pigeon: OUT_OF_BOUNDS_STREET_TEXT.pigeonSmashed,
  raccoon: OUT_OF_BOUNDS_STREET_TEXT.raccoonSmashed
};

/** The street is in alarm whenever the simulation is broken. */
export function isStreetInAlarm(state: Pick<GameWorldState, 'ownedItemIds'>): boolean {
  return isSimulationBroken(state.ownedItemIds);
}

export interface StreetAlarmObservation {
  doors: 'taped shut';
  fight: StreetFightProgress;
  /** The page coming apart once the fight is won (#164); null before that. */
  destroyer: ScreenDestroyerProgress | null;
  description: string;
}

/** Smashes landed on the page itself, after the fight was won. */
function destroyerHits(screenSmashes: number): number {
  return Math.max(0, screenSmashes - STREET_FIGHT_TOTAL_SMASHES);
}

/** The screen destroyer's progress, or null while the fight is still on. */
export function observeScreenDestroyer(state: Pick<GameWorldState, 'screenSmashes'>): ScreenDestroyerProgress | null {
  if (streetFightProgress(state.screenSmashes).phase !== 'cleared') return null;
  return screenDestroyerProgress(destroyerHits(state.screenSmashes));
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
  if (phase === 'waves') return `${OUT_OF_BOUNDS_STREET_TEXT.alarm} ${OUT_OF_BOUNDS_STREET_TEXT.wavesIncoming}`;
  return OUT_OF_BOUNDS_STREET_TEXT.alarm;
}

export interface SwingOutcome {
  ok: boolean;
  message: string;
  events: GameSessionEvent[];
}

/**
 * One hammer swing. Headless, the enemy comes to you, so a swing during the
 * fight always lands; the live scene only calls this when the hammer connects
 * and says what it hit. A pigeon is only harassment: it drops, another circles
 * in, and the fight doesn't move on.
 */
export function swingHammer(state: GameWorldState, hit?: StreetFightEnemy): SwingOutcome {
  if (!isStreetInAlarm(state))
    return {
      ok: false,
      message: OUT_OF_BOUNDS_STREET_TEXT.noHammer,
      events: []
    };
  if (state.mode !== 'overworld') return { ok: true, message: OUT_OF_BOUNDS_STREET_TEXT.whiff, events: [] };

  const next = streetFightTarget(state.screenSmashes);
  if (!next) return smashThePage(state);
  if (hit === 'pigeon' && next === 'raccoon') return { ok: true, message: SMASHED_TEXT.pigeon, events: [] };
  const target: StreetFightTarget = next;

  const before = streetFightProgress(state.screenSmashes);
  state.screenSmashes += 1;
  const after = streetFightProgress(state.screenSmashes);
  const events: GameSessionEvent[] = [{ type: 'screen_smashed', target, smashes: state.screenSmashes }];

  const lines: string[] = [SMASHED_TEXT[target]];
  if (after.phase === 'cleared') {
    lines.push(OUT_OF_BOUNDS_STREET_TEXT.cleared);
    events.push({ type: 'street_fight_cleared' });
  } else if (before.phase === 'chick') {
    lines.push(OUT_OF_BOUNDS_STREET_TEXT.wavesIncoming);
  } else if (after.wave !== before.wave) {
    lines.push(OUT_OF_BOUNDS_STREET_TEXT.nextWave);
  }
  return { ok: true, message: lines.join(' '), events };
}

/**
 * After the fight, the hammer lands on the page itself (#164): anything hit,
 * an enemy or the bare glass, takes the next layer apart, until the page
 * falls into black.
 */
function smashThePage(state: GameWorldState): SwingOutcome {
  const before = screenDestroyerProgress(destroyerHits(state.screenSmashes));
  const layer = before.breaking;
  if (!layer) return { ok: false, message: SCREEN_DESTROYER_TEXT.nothingLeft, events: [] };

  state.screenSmashes += 1;
  const after = screenDestroyerProgress(destroyerHits(state.screenSmashes));
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
