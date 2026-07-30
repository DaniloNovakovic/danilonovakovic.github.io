import type { GameItemId, GameSessionEvent, GameWorldState } from './types';

const DRAFT_POOL = ['wider peel', 'extra life', 'poison drip', 'shield ink'] as const;

export interface PotassiumOutcome {
  ok: boolean;
  message: string;
  events: GameSessionEvent[];
}

export function startPotassium(state: GameWorldState): PotassiumOutcome {
  if (state.mode !== 'potassium') {
    return { ok: false, message: 'You are not in Potassium Slip.', events: [] };
  }
  if (state.potassium.phase !== 'lobby' && state.potassium.phase !== 'lost') {
    return { ok: false, message: 'Campaign already running. fight or draft.', events: [] };
  }

  state.potassium = {
    phase: 'wave',
    wave: 1,
    maxWaves: 5,
    lives: 3,
    score: 0,
    draftChoices: []
  };
  return {
    ok: true,
    message: 'Wave 1 — ink bananas descend. Type fight to clear the wave.',
    events: []
  };
}

export function fightPotassium(state: GameWorldState): PotassiumOutcome {
  if (state.mode !== 'potassium') {
    return { ok: false, message: 'You are not in Potassium Slip.', events: [] };
  }
  if (state.potassium.phase !== 'wave') {
    return {
      ok: false,
      message:
        state.potassium.phase === 'draft'
          ? 'Pick a draft upgrade first (draft 1).'
          : state.potassium.phase === 'lobby'
            ? 'Type start to begin the campaign.'
            : `Campaign is ${state.potassium.phase}.`,
      events: []
    };
  }

  state.potassium.score += 100 * state.potassium.wave;

  if (state.potassium.wave >= state.potassium.maxWaves) {
    return winPotassium(state);
  }

  // Mid-run draft after waves 2 and 4.
  if (state.potassium.wave === 2 || state.potassium.wave === 4) {
    state.potassium.phase = 'draft';
    // Deterministic draft order for AI/scripts (live Phaser scene keeps its own RNG).
    state.potassium.draftChoices = [...DRAFT_POOL].slice(0, 3);
    return {
      ok: true,
      message: `Wave ${state.potassium.wave} cleared. Draft an upgrade: ${formatDraft(state)}`,
      events: []
    };
  }

  state.potassium.wave += 1;
  return {
    ok: true,
    message: `Wave cleared. Wave ${state.potassium.wave} begins — fight again.`,
    events: []
  };
}

export function draftPotassium(state: GameWorldState, choiceIdOrIndex: string): PotassiumOutcome {
  if (state.mode !== 'potassium' || state.potassium.phase !== 'draft') {
    return { ok: false, message: 'No draft open. Clear a wave first.', events: [] };
  }

  const choices = state.potassium.draftChoices;
  const index = Number(choiceIdOrIndex);
  const picked =
    Number.isInteger(index) && index >= 1 && index <= choices.length
      ? choices[index - 1]
      : choices.find((c) => c.toLowerCase() === choiceIdOrIndex.toLowerCase());

  if (!picked) {
    return {
      ok: false,
      message: `Unknown draft choice. Options: ${formatDraft(state)}`,
      events: []
    };
  }

  if (picked === 'extra life') {
    state.potassium.lives += 1;
  }

  state.potassium.phase = 'wave';
  state.potassium.wave += 1;
  state.potassium.draftChoices = [];
  return {
    ok: true,
    message: `Picked "${picked}". Wave ${state.potassium.wave} begins — fight.`,
    events: []
  };
}

function winPotassium(state: GameWorldState): PotassiumOutcome {
  state.potassium.phase = 'won';
  const events: GameSessionEvent[] = [{ type: 'potassium_won' }];
  const itemId: GameItemId = 'circuit';

  if (!state.ownedItemIds.includes(itemId)) {
    state.ownedItemIds = [...state.ownedItemIds, itemId];
    events.push({ type: 'item_collected', itemId });
  }

  state.mode = 'overworld';
  state.sceneId = 'overworld';
  events.push({ type: 'scene_returned', sceneId: 'overworld' });

  return {
    ok: true,
    message:
      'Boss peel collapses. You win the Circuit — a cassette-bright prize. Back on the street; find the CRT.',
    events
  };
}

function formatDraft(state: GameWorldState): string {
  return state.potassium.draftChoices.map((c, i) => `${i + 1}:${c}`).join(', ');
}
