import { describe, expect, it } from 'vitest';
import {
  formatPotassiumLeaderboardRecords,
  getPotassiumLeaderboardOverlayText,
  getPotassiumLeaderboardTop,
  loadPotassiumLeaderboard,
  savePotassiumRunRecord,
  type PotassiumRunRecord
} from './potassiumSlipLeaderboard';

class MemoryStorage {
  private readonly items = new Map<string, string>();

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

describe('potassium slip leaderboard', () => {
  it('saves top five records by score', () => {
    const storage = new MemoryStorage();
    [10, 40, 20, 60, 30, 50].forEach((score, index) => {
      savePotassiumRunRecord(makeRecord(score, index), storage);
    });

    expect(getPotassiumLeaderboardTop(5, storage).map((record) => record.score)).toEqual([60, 50, 40, 30, 20]);
  });

  it('handles missing and corrupt storage', () => {
    const storage = new MemoryStorage();
    storage.setItem('potassium-slip:leaderboard', '{nope');

    expect(loadPotassiumLeaderboard(null)).toEqual([]);
    expect(loadPotassiumLeaderboard(storage)).toEqual([]);
  });

  it('updates a continued endless run without duplicating it', () => {
    const storage = new MemoryStorage();
    const completedAt = '2026-05-03T00:00:00.000Z';
    savePotassiumRunRecord(makeRecord(25, 0, { completedAt, mode: 'campaign', outcome: 'won', wave: 11 }), storage);
    savePotassiumRunRecord(makeRecord(80, 1, { completedAt, mode: 'endless', outcome: 'game_over', wave: 14 }), storage);

    expect(loadPotassiumLeaderboard(storage)).toEqual([
      makeRecord(80, 1, { completedAt, mode: 'endless', outcome: 'game_over', wave: 14 })
    ]);
  });

  it('formats terminal records text for empty and populated leaderboards', () => {
    const storage = new MemoryStorage();
    expect(getPotassiumLeaderboardOverlayText(3, storage)).toBe('RECORDS\nNo banana paperwork filed yet.');

    const records = [
      makeRecord(80, 0, { mode: 'endless', outcome: 'game_over', wave: 14 }),
      makeRecord(40, 1, { mode: 'campaign', outcome: 'won', wave: 11 })
    ];

    expect(formatPotassiumLeaderboardRecords(records)).toBe([
      'RECORDS',
      '1. 80 • W14 • endless',
      '2. 40 • W11 • won'
    ].join('\n'));
  });
});

function makeRecord(score: number, index: number, overrides: Partial<PotassiumRunRecord> = {}): PotassiumRunRecord {
  return {
    score,
    wave: 1 + index,
    mode: 'campaign',
    outcome: 'game_over',
    completedAt: `2026-05-03T00:00:0${index}.000Z`,
    ...overrides
  };
}
