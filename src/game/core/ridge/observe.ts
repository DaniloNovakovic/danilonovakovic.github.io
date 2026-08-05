// Observation formatting is intentionally branchy for CLI readability.
// fallow-ignore-file complexity
import type {
  RidgeObservation,
  RidgeStageDefinition,
  RidgeWorldState
} from './types';

export function observeRidgeWorld(
  state: RidgeWorldState,
  stage: RidgeStageDefinition
): RidgeObservation {
  const nearby = [...stage.resolveInteractables(state)].sort(
    (a, b) => a.distance - b.distance
  );
  const actors = stage.resolveActors(state);
  const crossingOpen = stage.isCrossingOpen?.(state) ?? true;
  const blockedAhead =
    state.facing === 'right' &&
    stage.blockedProgress !== undefined &&
    !crossingOpen &&
    state.progress >= stage.blockedProgress - 0.001;

  const conversation = state.conversation
    ? (() => {
        const line = state.conversation.lines[state.conversation.lineIndex];
        if (!line) return null;
        return {
          id: state.conversation.id,
          speaker: line.speaker,
          speakerId: line.speakerId,
          text: line.text,
          emotion: line.emotion,
          lineId: line.id,
          lineIndex: state.conversation.lineIndex,
          lineCount: state.conversation.lines.length,
          choices: state.conversation.awaitingChoice
            ? state.conversation.choices
            : null,
          awaitingChoice: state.conversation.awaitingChoice
        };
      })()
    : null;

  const hints = buildHints(state, stage, nearby, blockedAhead);

  return {
    mode: state.mode,
    areaId: state.areaId,
    title: state.title,
    beat: state.beat,
    progress: state.progress,
    progressPercent: Math.round(state.progress * 100),
    facing: state.facing,
    ambience: stage.describeAmbience(state),
    nearby,
    actors,
    inventory: state.inventory,
    conversation,
    canMove: state.mode === 'explore',
    blockedAhead,
    lastMessage: state.lastMessage,
    hints
  };
}

function buildHints(
  state: RidgeWorldState,
  stage: RidgeStageDefinition,
  nearby: RidgeObservation['nearby'],
  blockedAhead: boolean
): string[] {
  if (state.mode === 'conversation') {
    if (state.conversation?.awaitingChoice) {
      return ['choose <number|id> — pick a reply', 'leave — end conversation'];
    }
    return ['advance — continue talking', 'leave — end conversation'];
  }

  const hints = [
    'go left|right [steps] — walk the sketchbook stage',
    'look — describe surroundings',
    'interact [name] — talk or use the nearest thing'
  ];

  if (nearby[0]) {
    hints.unshift(`interact — ${nearby[0].prompt} (${nearby[0].label})`);
  }
  if (blockedAhead) {
    const blockedMessage = stage.blockedMessage;
    hints.unshift(
      (typeof blockedMessage === 'function'
        ? blockedMessage(state)
        : blockedMessage) ??
        'The path east is blocked until the local problem clears.'
    );
  }
  if (state.beat === 'relay_complete') {
    hints.unshift('The dedication fades. The page will return to the Bridge.');
  }

  return hints;
}

export function formatObservation(observation: RidgeObservation): string {
  const lines: string[] = [];
  lines.push(`# ${observation.title}`);
  lines.push(
    `mode=${observation.mode} area=${observation.areaId} beat=${observation.beat} progress=${observation.progressPercent}% facing=${observation.facing}`
  );
  lines.push(observation.ambience);

  if (observation.conversation) {
    const c = observation.conversation;
    lines.push('');
    lines.push(`--- conversation:${c.id} (${c.lineIndex + 1}/${c.lineCount}) ---`);
    lines.push(`${c.speaker}: ${c.text}`);
    if (c.awaitingChoice && c.choices) {
      lines.push('Choices:');
      c.choices.forEach((choice, index) => {
        lines.push(`  ${index + 1}. [${choice.id}] ${choice.label}`);
      });
    }
  } else {
    lines.push('');
    lines.push('Nearby:');
    if (observation.nearby.length === 0) {
      lines.push('  (nothing in reach)');
    } else {
      for (const item of observation.nearby) {
        lines.push(
          `  - ${item.label} [${item.kind}] dist=${item.distance.toFixed(3)} :: ${item.prompt}`
        );
      }
    }

    lines.push('');
    lines.push('Actors:');
    for (const actor of observation.actors.filter((a) => a.visible)) {
      lines.push(
        `  - ${actor.label} @ ${(actor.progress * 100).toFixed(0)}% facing=${actor.facing}`
      );
    }

    if (observation.inventory.length > 0) {
      lines.push('');
      lines.push(`Inventory: ${observation.inventory.join(', ')}`);
    }
  }

  if (observation.lastMessage) {
    lines.push('');
    lines.push(`> ${observation.lastMessage}`);
  }

  if (observation.hints.length > 0) {
    lines.push('');
    lines.push('Hints:');
    for (const hint of observation.hints) {
      lines.push(`  - ${hint}`);
    }
  }

  return lines.join('\n');
}
