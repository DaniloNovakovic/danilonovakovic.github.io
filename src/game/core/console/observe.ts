import type { RidgeObservation } from '../ridge/types';
import { listBasementNearby } from './basementLogic';
import { listHobbiesNearby } from './hobbiesLogic';
import { listOverworldNearby } from './overworldLogic';
import type { GameObservation, GameWorldState, NearbyThing } from './types';

export function observeGameWorld(
  state: GameWorldState,
  ridge: RidgeObservation | null
): GameObservation {
  const nearby = resolveNearby(state, ridge);
  return {
    mode: state.mode,
    sceneId: state.sceneId,
    overlay: state.overlay,
    ownedItemIds: state.ownedItemIds,
    equippedItemIds: state.equippedItemIds,
    discoveredSecretIds: state.discoveredSecretIds,
    nearby,
    prompt: nearby[0]?.prompt ?? state.overlay?.title ?? null,
    lastMessage: state.lastMessage,
    hints: buildHints(state, nearby, ridge),
    overworld: state.mode === 'overworld' || state.mode === 'overlay' ? state.overworld : null,
    basement: state.mode === 'basement' ? state.basement : null,
    hobbies: state.mode === 'hobbies' ? state.hobbies : null,
    potassium: state.mode === 'potassium' ? state.potassium : null,
    ridge: state.mode === 'ridge' ? ridge : null
  };
}

export function formatGameObservation(observation: GameObservation): string {
  const lines: string[] = [];
  lines.push(`mode=${observation.mode} scene=${observation.sceneId}`);

  if (observation.overlay) {
    lines.push(`overlay: ${observation.overlay.title} — ${observation.overlay.blurb}`);
  }

  lines.push(
    `inventory: ${observation.ownedItemIds.length ? observation.ownedItemIds.join(', ') : '(empty)'}`
  );
  lines.push(
    `equipped: ${
      observation.equippedItemIds.length ? observation.equippedItemIds.join(', ') : '(none)'
    }`
  );
  if (observation.discoveredSecretIds.length > 0) {
    lines.push(`secrets: ${observation.discoveredSecretIds.join(', ')}`);
  }

  if (observation.overworld) {
    lines.push(
      `street x=${Math.round(observation.overworld.playerX)} facing=${observation.overworld.facing}`
    );
  }
  if (observation.basement) {
    lines.push(
      `basement x=${Math.round(observation.basement.playerX)} facing=${observation.basement.facing}`
    );
  }
  if (observation.hobbies) {
    lines.push(`hobbies x=${Math.round(observation.hobbies.playerX)}`);
  }
  if (observation.potassium) {
    const k = observation.potassium;
    lines.push(
      `potassium phase=${k.phase} wave=${k.wave}/${k.maxWaves} lives=${k.lives} score=${k.score}`
    );
    if (k.draftChoices.length > 0) {
      lines.push(`draft: ${k.draftChoices.map((c, i) => `${i + 1}:${c}`).join(', ')}`);
    }
  }
  if (observation.ridge) {
    const r = observation.ridge;
    lines.push(
      `ridge beat=${r.beat} progress=${r.progressPercent}% mode=${r.mode} facing=${r.facing}`
    );
    lines.push(`ambience: ${r.ambience}`);
    if (r.conversation) {
      lines.push(
        `talking: ${r.conversation.speaker}: ${r.conversation.text} [${r.conversation.lineIndex + 1}/${r.conversation.lineCount}]`
      );
      if (r.conversation.awaitingChoice && r.conversation.choices) {
        lines.push(
          `choices: ${r.conversation.choices.map((c, i) => `${i + 1}:${c.id}`).join(', ')}`
        );
      }
    }
  }

  if (observation.nearby.length > 0) {
    lines.push('nearby:');
    for (const n of observation.nearby.slice(0, 6)) {
      lines.push(`  - ${n.id} (${n.kind}) d=${Math.round(n.distance)} — ${n.prompt}`);
    }
  } else if (observation.mode !== 'overlay' && observation.mode !== 'potassium') {
    lines.push('nearby: (nothing in range)');
  }

  if (observation.prompt) {
    lines.push(`prompt: ${observation.prompt}`);
  }
  if (observation.lastMessage) {
    lines.push(`last: ${observation.lastMessage}`);
  }
  if (observation.hints.length > 0) {
    lines.push('hints:');
    for (const hint of observation.hints) {
      lines.push(`  · ${hint}`);
    }
  }

  return lines.join('\n');
}

function resolveNearby(state: GameWorldState, ridge: RidgeObservation | null): NearbyThing[] {
  switch (state.mode) {
    case 'overworld':
      return listOverworldNearby(state);
    case 'basement':
      return listBasementNearby(state);
    case 'hobbies':
      return listHobbiesNearby(state);
    case 'ridge':
      return (ridge?.nearby ?? []).map((n) => ({
        id: n.spotId,
        label: n.label,
        distance: n.distance,
        prompt: n.prompt,
        kind: n.kind === 'npc' ? 'npc' : n.kind === 'prop' ? 'prop' : 'building'
      }));
    default:
      return [];
  }
}

function buildHints(
  state: GameWorldState,
  nearby: readonly NearbyThing[],
  ridge: RidgeObservation | null
): string[] {
  const hints: string[] = [];

  if (state.mode === 'overworld') {
    if (!state.ownedItemIds.includes('glasses')) {
      hints.push('Find the basement hatch near the start of the street and pick up the glasses.');
    } else if (!state.equippedItemIds.includes('glasses')) {
      hints.push('equip glasses to reveal the banana peel secret.');
    } else if (!state.discoveredSecretIds.includes('banana-peel-clue')) {
      hints.push('With glasses on, walk near x=650 and interact with the peel.');
    } else if (!state.ownedItemIds.includes('circuit')) {
      hints.push('Interact with the peel again to enter Potassium Slip and win the Circuit.');
    } else {
      hints.push('Walk to the street CRT near x=1650 and insert the Circuit to enter Ridge.');
    }
  }

  if (state.mode === 'basement' && !state.ownedItemIds.includes('glasses')) {
    hints.push('Walk right to the glasses pickup, then interact.');
  }

  if (state.mode === 'potassium') {
    if (state.potassium.phase === 'lobby') hints.push('Type start to begin the discrete campaign.');
    if (state.potassium.phase === 'wave') hints.push('Type fight to clear the current wave.');
    if (state.potassium.phase === 'draft') hints.push('Type draft 1 (or a name) to pick an upgrade.');
  }

  if (state.mode === 'ridge' && ridge) {
    hints.push(...ridge.hints);
  }

  if (state.mode === 'overlay') {
    hints.push('Type close to return.');
  }

  if (nearby[0] && state.mode !== 'ridge') {
    hints.push(`Try: interact ${nearby[0].id}`);
  }

  return hints;
}
