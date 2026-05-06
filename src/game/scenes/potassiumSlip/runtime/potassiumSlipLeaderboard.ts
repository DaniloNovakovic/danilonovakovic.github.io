import { messages } from '@/shared/i18n';

export type PotassiumRunMode = 'campaign' | 'endless';
export type PotassiumRunOutcome = 'won' | 'game_over';

export interface PotassiumRunRecord {
  score: number;
  wave: number;
  mode: PotassiumRunMode;
  outcome: PotassiumRunOutcome;
  completedAt: string;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const POTASSIUM_LEADERBOARD_KEY = 'potassium-slip:leaderboard';
const POTASSIUM_LEADERBOARD_LIMIT = 5;

export function loadPotassiumLeaderboard(storage: StorageLike | null = getBrowserStorage()): PotassiumRunRecord[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(POTASSIUM_LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return sanitizePotassiumRecords(parsed).slice(0, POTASSIUM_LEADERBOARD_LIMIT);
  } catch {
    return [];
  }
}

export function savePotassiumRunRecord(
  record: PotassiumRunRecord,
  storage: StorageLike | null = getBrowserStorage()
): PotassiumRunRecord[] {
  const records = normalizePotassiumRecords([
    ...loadPotassiumLeaderboard(storage).filter((entry) => entry.completedAt !== record.completedAt),
    record
  ]);
  if (!storage) return records;
  try {
    storage.setItem(POTASSIUM_LEADERBOARD_KEY, JSON.stringify(records));
  } catch {
    return [];
  }
  return records;
}

export function getPotassiumLeaderboardTop(
  limit: number = POTASSIUM_LEADERBOARD_LIMIT,
  storage: StorageLike | null = getBrowserStorage()
): PotassiumRunRecord[] {
  return loadPotassiumLeaderboard(storage).slice(0, limit);
}

export function getPotassiumLeaderboardOverlayText(
  limit: number = 3,
  storage: StorageLike | null = getBrowserStorage()
): string {
  return formatPotassiumLeaderboardRecords(getPotassiumLeaderboardTop(limit, storage));
}

export function formatPotassiumLeaderboardRecords(records: readonly PotassiumRunRecord[]): string {
  if (records.length === 0) return `${messages.potassiumSlip.leaderboard.title}\n${messages.potassiumSlip.leaderboard.empty}`;
  return [
    messages.potassiumSlip.leaderboard.title,
    ...records.map((record, index) => (
      messages.potassiumSlip.leaderboard.recordLine(
        index + 1,
        record.score,
        record.wave,
        messages.potassiumSlip.leaderboard.modeLabel(record.mode, record.outcome)
      )
    ))
  ].join('\n');
}

function sanitizePotassiumRecords(records: unknown[]): PotassiumRunRecord[] {
  return normalizePotassiumRecords(records.filter(isPotassiumRunRecord));
}

function normalizePotassiumRecords(records: PotassiumRunRecord[]): PotassiumRunRecord[] {
  return [...records]
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return Date.parse(right.completedAt) - Date.parse(left.completedAt);
    })
    .slice(0, POTASSIUM_LEADERBOARD_LIMIT);
}

function isPotassiumRunRecord(record: unknown): record is PotassiumRunRecord {
  if (typeof record !== 'object' || record === null) return false;
  const candidate = record as Partial<PotassiumRunRecord>;
  return typeof candidate.score === 'number'
    && Number.isFinite(candidate.score)
    && typeof candidate.wave === 'number'
    && Number.isFinite(candidate.wave)
    && (candidate.mode === 'campaign' || candidate.mode === 'endless')
    && (candidate.outcome === 'won' || candidate.outcome === 'game_over')
    && typeof candidate.completedAt === 'string'
    && !Number.isNaN(Date.parse(candidate.completedAt));
}

function getBrowserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}
