/** Guitar string number, 1 = high E (top) ... 6 = low E (bottom). */
export type StringNumber = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Margin riff on open strings (E2 D3 G3 B3 G3 E4 B3 G3): a rolling Em7
 * arpeggio that climbs, peaks on the high E and settles back on G.
 */
export const MARGIN_RIFF: readonly StringNumber[] = [6, 4, 3, 2, 3, 1, 2, 3];

/** Appends a picked note, keeping only the last `riff.length` notes. */
export function appendPick(
  history: readonly StringNumber[],
  note: StringNumber,
  riff: readonly StringNumber[] = MARGIN_RIFF
): StringNumber[] {
  const next = [...history, note];
  return next.length > riff.length ? next.slice(next.length - riff.length) : next;
}

/** Longest tail of `history` that matches the start of `riff`. */
export function riffProgress(
  history: readonly StringNumber[],
  riff: readonly StringNumber[] = MARGIN_RIFF
): number {
  for (let length = Math.min(history.length, riff.length); length > 0; length--) {
    const offset = history.length - length;
    let matches = true;
    for (let i = 0; i < length && matches; i++) {
      matches = history[offset + i] === riff[i];
    }
    if (matches) return length;
  }
  return 0;
}
