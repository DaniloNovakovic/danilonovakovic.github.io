interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface StampedeEndlessRecord {
  bestMs: number;
  newBest: boolean;
}

const STAMPEDE_ENDLESS_BEST_KEY = 'chick-magnet:endless-best-ms';

function loadStampedeEndlessBestMs(storage: StorageLike | null = getBrowserStorage()): number {
  if (!storage) return 0;
  try {
    const value = Number(storage.getItem(STAMPEDE_ENDLESS_BEST_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

/** Keeps the longest endless run on this device and reports whether this one beat it. */
export function recordStampedeEndlessRun(
  elapsedMs: number,
  storage: StorageLike | null = getBrowserStorage()
): StampedeEndlessRecord {
  const previousBestMs = loadStampedeEndlessBestMs(storage);
  if (elapsedMs <= previousBestMs) return { bestMs: previousBestMs, newBest: false };
  try {
    storage?.setItem(STAMPEDE_ENDLESS_BEST_KEY, `${Math.round(elapsedMs)}`);
  } catch {
    // A full or blocked store still shows the run as a best for this session.
  }
  return { bestMs: elapsedMs, newBest: true };
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}
