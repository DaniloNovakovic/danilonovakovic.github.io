// Observation formatting is intentionally branchy for CLI readability.
// fallow-ignore-file complexity
import type { RidgeObservation } from '../ridge/types';
import { listBasementNearby, observeBasement } from './basementLogic';
import { OVERWORLD_BANANA_PEEL } from './content/overworldSpots';
import { isSimulationBroken, outOfBoundsStageAt } from './content/outOfBoundsVoid';
import { listHobbiesNearby, observeHobbies } from './hobbiesLogic';
import { screenLayerName, type ScreenDestroyerProgress } from './content/outOfBoundsScreenDestroyer';
import { isStreetInAlarm, observeScreenDestroyer, observeStreetAlarm } from './streetFightLogic';
import { getOverworldProgress, listOverworldNearby } from './overworldLogic';
import type { GameObservation, GameWorldState, NearbyThing, OverworldProgressStage } from './types';

const OVERWORLD_CONSOLE_HINTS: Record<OverworldProgressStage, string> = {
  'find-glasses': 'Walk to the chick just past Experiences (or the basement hatch) to get glasses.',
  'wear-glasses': 'equip glasses to reveal the litter pile. The street chick will run.',
  'find-peel': `With glasses on, walk near x=${OVERWORLD_BANANA_PEEL.x} and interact with the litter.`,
  'win-circuit':
    'Interact with the litter again to dive into Scrub Rumble and win the Circuit — or win music, fitness and dancing parts in Hobbies (perform) and solder them at the basement workbench.',
  'solder-circuit': 'Drop into the basement and use the workbench near x=790 to solder the Circuit.',
  'use-crt': 'Walk to the street CRT near x=1650 and insert the Circuit to enter Ridge.'
};

export function observeGameWorld(state: GameWorldState, ridge: RidgeObservation | null): GameObservation {
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
    overworld:
      state.mode === 'overworld' || state.mode === 'overlay'
        ? { ...state.overworld, alarm: observeStreetAlarm(state) }
        : null,
    basement: state.mode === 'basement' ? observeBasement(state) : null,
    hobbies: state.mode === 'hobbies' ? observeHobbies(state) : null,
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

  lines.push(`inventory: ${observation.ownedItemIds.length ? observation.ownedItemIds.join(', ') : '(empty)'}`);
  lines.push(`equipped: ${observation.equippedItemIds.length ? observation.equippedItemIds.join(', ') : '(none)'}`);
  if (observation.discoveredSecretIds.length > 0) {
    lines.push(`secrets: ${observation.discoveredSecretIds.join(', ')}`);
  }

  if (observation.overworld) {
    lines.push(`street x=${Math.round(observation.overworld.playerX)} facing=${observation.overworld.facing}`);
    const alarm = observation.overworld.alarm;
    if (alarm) {
      lines.push(`alarm: doors ${alarm.doors} — ${alarm.description}`);
      lines.push(alarm.fight.phase === 'chick' ? 'fight: evil chick' : 'fight: horde (endless)');
      if (alarm.destroyer) lines.push(formatScreenDestroyer(alarm.destroyer));
    }
  }
  if (observation.basement) {
    lines.push(`basement x=${Math.round(observation.basement.playerX)} facing=${observation.basement.facing}`);
    const escape = observation.basement.escape;
    if (escape) lines.push(`escape: ransacked, way back ${escape.wayBack} — ${escape.description}`);
  }
  if (observation.hobbies) {
    lines.push(`hobbies x=${Math.round(observation.hobbies.playerX)}`);
    const edge = observation.hobbies.void;
    if (edge) {
      lines.push(`edge of the page: ${edge.stage}, ${edge.depth}px past the left wall — ${edge.description}`);
      if (edge.sights.length > 0) lines.push(`you notice: ${edge.sights.join('; ')}`);
    }
    const escape = observation.hobbies.escape;
    if (escape) lines.push(`escape: way back ${escape.wayBack} at x=${escape.barrierX} — ${escape.description}`);
    if (observation.hobbies.pointOfNoReturnPending) lines.push('warning: point of no return — confirm or decline');
  }
  if (observation.potassium) {
    const k = observation.potassium;
    lines.push(`potassium phase=${k.phase} wave=${k.wave}/${k.maxWaves} lives=${k.lives} score=${k.score}`);
    if (k.draftChoices.length > 0) {
      lines.push(`draft: ${k.draftChoices.map((c, i) => `${i + 1}:${c}`).join(', ')}`);
    }
  }
  if (observation.ridge) {
    const r = observation.ridge;
    lines.push(`ridge beat=${r.beat} progress=${r.progressPercent}% mode=${r.mode} facing=${r.facing}`);
    lines.push(`ambience: ${r.ambience}`);
    if (r.bridgeBuild) {
      const b = r.bridgeBuild;
      lines.push(`blueprint bridge: ${b.phase} attempt=${b.attempts} ink=${b.ink}/${b.inkBudget} beams=${b.beamCount}`);
      lines.push(`draftsperson: ${b.tipText}`);
    }
    if (r.concertGig) {
      const g = r.concertGig;
      lines.push(
        `concert ${g.mode}: ${g.phase} ${g.section ?? '-'} hype=${Math.round(g.hype * 100)}% combo=${g.combo} ` +
          `perfect=${g.counts.perfect} good=${g.counts.good} miss=${g.counts.miss}/${g.notesTotal} grade=${g.grade}`
      );
      if (g.practice)
        lines.push(
          `practice pass ${g.practice.loop + 1}/${g.practice.loopsTotal}: ${g.practice.hits}/${g.practice.needed}`
        );
      if (g.next) lines.push(`next note: lane ${g.next.lane} in ${g.next.inMs}ms`);
    }
    if (r.conversation) {
      lines.push(
        `talking: ${r.conversation.speaker}: ${r.conversation.text} [${r.conversation.lineIndex + 1}/${r.conversation.lineCount}]`
      );
      if (r.conversation.awaitingChoice && r.conversation.choices) {
        lines.push(`choices: ${r.conversation.choices.map((c, i) => `${i + 1}:${c.id}`).join(', ')}`);
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

function buildHints(state: GameWorldState, nearby: readonly NearbyThing[], ridge: RidgeObservation | null): string[] {
  const hints: string[] = [];

  if (state.mode === 'overworld' && isStreetInAlarm(state)) {
    const destroyer = observeScreenDestroyer(state);
    if (!destroyer) hints.push('Type swing to smash with the hammer.');
    else if (destroyer.blackout)
      hints.push('The page is black. In the browser, Wake up opens the real world (3D, not playable here).');
    else if (destroyer.hits === 0)
      hints.push('The horde never ends: swing smashes a raccoon, swing page hits the building behind them.');
    else hints.push(`Type swing page to keep smashing the page. Next: ${screenLayerName(destroyer.breaking!)}.`);
  } else if (state.mode === 'overworld') {
    hints.push(OVERWORLD_CONSOLE_HINTS[getOverworldProgress(state).stage]);
  }

  if (state.mode === 'basement' && isSimulationBroken(state.ownedItemIds)) {
    hints.push('The breach behind you is shut. The exit ladder on the far left (x=95) climbs out onto the street.');
  } else if (state.mode === 'basement' && !state.ownedItemIds.includes('glasses')) {
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

  if (state.mode === 'hobbies') {
    hints.push(
      isSimulationBroken(state.ownedItemIds)
        ? 'The way back right is scribbled shut. Keep walking left, into the torn opening. leave still works from here.'
        : outOfBoundsStageAt(state.hobbies.playerX)
          ? 'Walk right to get back into the drawn room. leave still works from here.'
          : 'Stations: art x=280, music x=440, fitness x=600, dancing x=760. Interact, then perform.'
    );
  }

  if (state.mode === 'overlay') {
    if (state.sceneId === 'hobbies') hints.push('Type perform to clear the mini-game goal.');
    hints.push('Type close to return.');
  }

  if (nearby[0] && state.mode !== 'ridge') {
    hints.push(`Try: interact ${nearby[0].id}`);
  }

  return hints;
}

/** `screen: breaking=street (4/6) layers left=street, card, glass`, or the blackout. */
function formatScreenDestroyer(destroyer: ScreenDestroyerProgress): string {
  if (destroyer.blackout) return 'screen: black — every layer gone, unplugged (Wake up opens the 3D real world)';
  const breaking = destroyer.layers.find((layer) => layer.id === destroyer.breaking)!;
  return `screen: breaking=${breaking.id} (${breaking.hitsTaken}/${breaking.hits}) layers left=${destroyer.remaining.join(', ')}`;
}
