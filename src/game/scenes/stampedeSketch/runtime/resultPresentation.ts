export type StampedeResultPhase = 'cleared' | 'failed';
export type StampedeResultActionId = 'backToRidge' | 'retry';
export type StampedeResultActionPriority = 'primary' | 'secondary';
export type StampedeRewardStatus = 'earned' | 'alreadyOwned' | 'unavailable';

export interface StampedeResultViewModelInput {
  phase: StampedeResultPhase;
  elapsedMs: number;
  durationMs: number;
  contacts: number;
  rewardStatus?: StampedeRewardStatus;
}

export interface StampedeResultStatViewModel {
  id: 'time' | 'contacts';
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

  return {
    phase: input.phase,
    eyebrow: clear ? 'Run complete' : 'Run ended',
    title: clear ? 'Blanket held' : 'Page got crowded',
    body: clear
      ? 'The sketch stayed calm through the whole stampede.'
      : 'Too many marks landed before the timer ran out.',
    rewardNote: getRewardNote(input.rewardStatus ?? 'unavailable', clear),
    stats: [
      {
        id: 'time',
        label: 'Time',
        value: formatResultTime(input.elapsedMs, input.durationMs)
      },
      {
        id: 'contacts',
        label: 'Contacts',
        value: `${Math.max(0, input.contacts)}`
      }
    ],
    actions: clear
      ? [
          {
            id: 'backToRidge',
            label: 'Back to Ridge',
            priority: 'primary'
          },
          {
            id: 'retry',
            label: 'Retry',
            priority: 'secondary'
          }
        ]
      : [
          {
            id: 'retry',
            label: 'Retry',
            priority: 'primary'
          },
          {
            id: 'backToRidge',
            label: 'Back to Ridge',
            priority: 'secondary'
          }
        ]
  };
}

function getRewardNote(status: StampedeRewardStatus, clear: boolean): string {
  if (!clear) {
    return 'Hold the blanket to earn the Stampede stamp and glide pip.';
  }
  switch (status) {
    case 'earned':
      return 'Stamp earned. One glide pip tucked into the Ridge.';
    case 'alreadyOwned':
      return 'Stamp already owned. Glide pip already tucked into the Ridge.';
    case 'unavailable':
      return 'No stamp yet. Rewards are still taped over.';
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
