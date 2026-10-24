import type { StampedeFlockKind } from './flock';

const STAMPEDE_BARK_GAP_MS = 2_400;

const BARK_LINES: Partial<Record<StampedeFlockKind, string>> = {
  nerd: 'Well, actually.',
  perfume: 'New cologne?',
  fixer: 'I can fix him.',
  situationship: "It's complicated.",
  rooster: 'Square up.',
  bartender: 'Last call.'
};

const BARK_RARITY: Partial<Record<StampedeFlockKind, number>> = {
  nerd: 1,
  perfume: 2,
  fixer: 3,
  situationship: 4,
  rooster: 5,
  bartender: 6
};

const BARK_DELAY_MS: Partial<Record<StampedeFlockKind, number>> = {
  nerd: 3_200,
  perfume: 5_400,
  fixer: 7_200,
  situationship: 4_600,
  rooster: 8_000,
  bartender: 4_000
};

export interface StampedeBarkSpeaker {
  id: string;
  kind: StampedeFlockKind;
  x: number;
  y: number;
}

export interface StampedeBarkPick {
  id: string;
  line: string;
  nextBarkAtMs: number;
}

export function stampedeBarkReadyAt(kind: StampedeFlockKind, nowMs: number): number {
  const delay = BARK_DELAY_MS[kind];
  if (delay === undefined) return Number.POSITIVE_INFINITY;
  return nowMs + delay;
}

export function pickStampedeBark(
  speakers: readonly StampedeBarkSpeaker[],
  nowMs: number,
  nextBarkAtMs: number,
  focus: { x: number; y: number } = { x: 0, y: 0 }
): StampedeBarkPick | null {
  if (nowMs < nextBarkAtMs) return null;

  const byKind = new Map<StampedeFlockKind, StampedeBarkSpeaker>();
  speakers.forEach((speaker) => {
    if (!BARK_LINES[speaker.kind]) return;
    const current = byKind.get(speaker.kind);
    if (!current || distanceTo(speaker, focus) < distanceTo(current, focus)) {
      byKind.set(speaker.kind, speaker);
    }
  });

  const ready = [...byKind.values()].sort((left, right) => (
    (BARK_RARITY[right.kind] ?? 0) - (BARK_RARITY[left.kind] ?? 0)
  ));
  const chosen = ready[0];
  const line = chosen ? BARK_LINES[chosen.kind] : undefined;
  if (!chosen || !line) return null;
  return {
    id: chosen.id,
    line,
    nextBarkAtMs: nowMs + STAMPEDE_BARK_GAP_MS
  };
}

function distanceTo(
  speaker: StampedeBarkSpeaker,
  focus: { x: number; y: number }
): number {
  return Math.hypot(speaker.x - focus.x, speaker.y - focus.y);
}
