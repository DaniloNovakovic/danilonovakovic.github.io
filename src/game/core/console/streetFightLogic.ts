/**
 * The street during the Out of Bounds escape (#163): in alarm, and the fight.
 * Geometry, waves and copy live in content/outOfBoundsStreetFight.ts.
 */
import { isSimulationBroken } from './content/outOfBoundsVoid';
import {
  OUT_OF_BOUNDS_STREET_TEXT,
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
  description: string;
}

export function observeStreetAlarm(state: GameWorldState): StreetAlarmObservation | null {
  if (!isStreetInAlarm(state)) return null;
  return {
    doors: 'taped shut',
    fight: streetFightProgress(state.screenSmashes),
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
  if (!next) return { ok: true, message: OUT_OF_BOUNDS_STREET_TEXT.whiff, events: [] };
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
