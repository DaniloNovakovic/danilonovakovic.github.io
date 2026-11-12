import { describe, expect, it } from 'vitest';
import { recordStampedeEndlessRun } from './endlessRecord';

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    }
  };
}

describe('stampede endless record', () => {
  it('saves the first endless run as the best', () => {
    const storage = memoryStorage();
    expect(recordStampedeEndlessRun(200_400, storage)).toEqual({ bestMs: 200_400, newBest: true });
    expect(recordStampedeEndlessRun(180_000, storage)).toEqual({ bestMs: 200_400, newBest: false });
  });

  it('replaces the best only when beaten', () => {
    const storage = memoryStorage();
    recordStampedeEndlessRun(200_000, storage);
    expect(recordStampedeEndlessRun(260_000, storage)).toEqual({ bestMs: 260_000, newBest: true });
    expect(recordStampedeEndlessRun(260_000, storage).newBest).toBe(false);
  });

  it('ignores corrupt values and survives a store that refuses writes', () => {
    const storage = memoryStorage({ 'chick-magnet:endless-best-ms': 'nope' });
    expect(recordStampedeEndlessRun(90_000, storage).newBest).toBe(true);

    const refusing = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      }
    };
    expect(recordStampedeEndlessRun(90_000, refusing)).toEqual({ bestMs: 90_000, newBest: true });
  });
});
