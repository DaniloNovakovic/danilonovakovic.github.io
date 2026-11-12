/**
 * Brad's arrival. Hearts popped by birds swooning over the player make somebody's
 * boyfriend jealous; he storms in late in the run, inside a fixed window so the
 * finale is predictable, and returns on a beat in endless overtime.
 */

export const STAMPEDE_JEALOUSY_HEARTS = 60;
const FORESHADOW_SHARE = 0.75;
/** Earliest arrival, counted back from the end of the regular clock. */
const EARLIEST_BEFORE_END_MS = 40_000;
/** Latest arrival: the start of Last Call. */
const LATEST_BEFORE_END_MS = 20_000;
const OVERTIME_FIRST_MS = 60_000;
const OVERTIME_EVERY_MS = 90_000;

export interface StampedeJealousy {
  hearts: number;
  foreshadowed: boolean;
  visits: number;
}

export type StampedeJealousyEvent = 'foreshadow' | 'arrive' | null;

export interface StampedeJealousyInput {
  elapsedMs: number;
  durationMs: number;
  heartsAdded: number;
  /** The ex hogs the spotlight; he waits for her to leave until Last Call. */
  exOnField: boolean;
  boyfriendOnField: boolean;
}

export function createStampedeJealousy(): StampedeJealousy {
  return { hearts: 0, foreshadowed: false, visits: 0 };
}

export function stepStampedeJealousy(
  state: StampedeJealousy,
  input: StampedeJealousyInput
): { state: StampedeJealousy; event: StampedeJealousyEvent } {
  const hearts = state.hearts + Math.max(0, input.heartsAdded);
  const next = hearts === state.hearts ? state : { ...state, hearts };

  if (shouldArrive(next, input)) {
    return { state: { ...next, foreshadowed: true, visits: next.visits + 1 }, event: 'arrive' };
  }
  if (!next.foreshadowed && next.visits === 0 && hearts >= STAMPEDE_JEALOUSY_HEARTS * FORESHADOW_SHARE) {
    return { state: { ...next, foreshadowed: true }, event: 'foreshadow' };
  }
  return { state: next, event: null };
}

function shouldArrive(state: StampedeJealousy, input: StampedeJealousyInput): boolean {
  if (input.boyfriendOnField) return false;
  if (state.visits === 0) {
    const earliest = input.durationMs - EARLIEST_BEFORE_END_MS;
    const latest = input.durationMs - LATEST_BEFORE_END_MS;
    if (input.elapsedMs >= latest) return true;
    return input.elapsedMs >= earliest
      && state.hearts >= STAMPEDE_JEALOUSY_HEARTS
      && !input.exOnField;
  }
  const overtimeMs = input.elapsedMs - input.durationMs;
  return overtimeMs >= OVERTIME_FIRST_MS + (state.visits - 1) * OVERTIME_EVERY_MS;
}
