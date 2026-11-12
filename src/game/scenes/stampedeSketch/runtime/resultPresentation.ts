import { getMessages } from '@/shared/i18n';

export type StampedeResultPhase = 'cleared' | 'failed';
export type StampedeResultActionId = 'backToRidge' | 'retry' | 'keepGoing';
export type StampedeResultActionPriority = 'primary' | 'secondary';
export type StampedeRewardStatus = 'earned' | 'alreadyOwned' | 'unavailable';
export type StampedeResultCopy = ReturnType<typeof getMessages>['scenes']['stampedeSketch']['result'];

export interface StampedeResultViewModelInput {
  phase: StampedeResultPhase;
  elapsedMs: number;
  durationMs: number;
  contacts: number;
  rewardStatus?: StampedeRewardStatus;
  /** Present when an endless run ended. */
  endless?: { bestMs: number; newBest: boolean };
}

export interface StampedeResultStatViewModel {
  id: 'time' | 'contacts' | 'best';
  label: string;
  value: string;
}

export interface StampedeResultActionViewModel {
  id: StampedeResultActionId;
  label: string;
  priority: StampedeResultActionPriority;
}

export interface StampedeResultViewModel {
  phase: StampedeResultPhase;
  eyebrow: string;
  title: string;
  body: string;
  rewardNote: string;
  stats: readonly StampedeResultStatViewModel[];
  actions: readonly StampedeResultActionViewModel[];
}

export interface StampedeResultButtonBounds {
  id: StampedeResultActionId;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function createStampedeResultViewModel(
  input: StampedeResultViewModelInput
): StampedeResultViewModel {
  const clear = input.phase === 'cleared';
  const copy = getMessages().scenes.stampedeSketch.result;
  if (input.endless) return createEndlessResultViewModel(input, input.endless, copy);

  return {
    phase: input.phase,
    eyebrow: clear ? copy.eyebrow.cleared : copy.eyebrow.failed,
    title: clear ? copy.title.cleared : copy.title.failed,
    body: clear
      ? copy.body.cleared
      : copy.body.failed,
    rewardNote: getRewardNote(input.rewardStatus ?? 'unavailable', clear, copy),
    stats: [
      {
        id: 'time',
        label: copy.stats.time,
        value: formatResultTime(input.elapsedMs, input.durationMs)
      },
      {
        id: 'contacts',
        label: copy.stats.contacts,
        value: `${Math.max(0, input.contacts)}`
      }
    ],
    actions: clear
      ? [
          {
            id: 'keepGoing',
            label: copy.actions.keepGoing,
            priority: 'primary'
          },
          {
            id: 'backToRidge',
            label: copy.actions.backToRidge,
            priority: 'secondary'
          },
          {
            id: 'retry',
            label: copy.actions.retry,
            priority: 'secondary'
          }
        ]
      : [
          {
            id: 'retry',
            label: copy.actions.retry,
            priority: 'primary'
          },
          {
            id: 'backToRidge',
            label: copy.actions.backToRidge,
            priority: 'secondary'
          }
        ]
  };
}

function createEndlessResultViewModel(
  input: StampedeResultViewModelInput,
  endless: { bestMs: number; newBest: boolean },
  copy: StampedeResultCopy
): StampedeResultViewModel {
  const bestTime = formatResultTime(endless.bestMs, Number.POSITIVE_INFINITY);
  return {
    phase: input.phase,
    eyebrow: copy.eyebrow.endless,
    title: copy.title.endless,
    body: copy.body.endless,
    rewardNote: endless.newBest ? copy.endless.newBest : copy.endless.best(bestTime),
    stats: [
      {
        id: 'time',
        label: copy.stats.time,
        value: formatResultTime(input.elapsedMs, Number.POSITIVE_INFINITY)
      },
      { id: 'best', label: copy.stats.best, value: bestTime }
    ],
    actions: [
      { id: 'retry', label: copy.actions.retry, priority: 'primary' },
      { id: 'backToRidge', label: copy.actions.backToRidge, priority: 'secondary' }
    ]
  };
}

function getRewardNote(
  status: StampedeRewardStatus,
  clear: boolean,
  copy: StampedeResultCopy
): string {
  if (!clear) {
    return copy.rewardNote.failed;
  }
  switch (status) {
    case 'earned':
      return copy.rewardNote.earned;
    case 'alreadyOwned':
      return copy.rewardNote.alreadyOwned;
    case 'unavailable':
      return copy.rewardNote.unavailable;
  }
}

function formatResultTime(elapsedMs: number, durationMs: number): string {
  const boundedElapsedMs = clamp(elapsedMs, 0, Math.max(0, durationMs));
  const wholeSeconds = Math.max(0, Math.ceil(boundedElapsedMs / 1000));
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = `${wholeSeconds % 60}`.padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
