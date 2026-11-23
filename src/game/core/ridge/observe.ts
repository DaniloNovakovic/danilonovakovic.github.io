// Observation formatting is intentionally branchy for CLI readability.
// fallow-ignore-file complexity
import type { BridgeWorkbench } from './bridgeBuilder';
import type { CickaDuel } from './cickaDuel';
import { GIG_START_HYPE, type ConcertGig } from './concertGig';
import { bachataStepOf } from './bachata';
import type { RidgeObservation, RidgeStageDefinition, RidgeStageRegistry, RidgeWorldState } from './types';

/** The live mini-game objects a session may be running. */
export interface RidgeMiniGames {
  workbench?: BridgeWorkbench | null;
  duel?: CickaDuel | null;
  gig?: ConcertGig | null;
  /** The bachata lesson's judge. */
  lesson?: ConcertGig | null;
}

export function observeRidgeWorld(
  state: RidgeWorldState,
  stage: RidgeStageDefinition,
  games: RidgeMiniGames = {},
  stages: RidgeStageRegistry | null = null
): RidgeObservation {
  const workbench = games.workbench ?? null;
  const duel = games.duel ?? null;
  const gig = games.gig ?? null;
  const lesson = games.lesson ?? null;
  const nearby = [...stage.resolveInteractables(state)].sort((a, b) => a.distance - b.distance);
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
          choices: state.conversation.awaitingChoice ? state.conversation.choices : null,
          awaitingChoice: state.conversation.awaitingChoice
        };
      })()
    : null;

  const hints =
    state.mode === 'cickaDuel'
      ? duelHints(duel)
      : state.mode === 'concertGig'
        ? gigHints(gig)
        : state.mode === 'bachataLesson'
          ? lessonHints(lesson)
          : buildHints(state, stage, nearby, blockedAhead, workbench);
  const cickaDuel = state.mode === 'cickaDuel' && duel ? observeDuel(duel) : null;
  const concertGig = state.mode === 'concertGig' && gig ? observeGig(gig) : null;
  const bachataLesson = state.mode === 'bachataLesson' && lesson ? observeLesson(lesson) : null;
  const bridgeBuild =
    state.mode === 'bridgeBuild' && workbench
      ? {
          phase: workbench.phase,
          attempts: workbench.attempts,
          beamCount: workbench.design.length,
          canUndo: workbench.canUndo,
          ink: workbench.ink,
          inkBudget: workbench.puzzle.inkBudget,
          tip: workbench.tip,
          tipText:
            stage.describeBridgeTip?.(workbench.tip, {
              variant: workbench.tipVariant,
              sketchNudge: workbench.sketchNudge
            }) ?? workbench.tip,
          hintVisible: workbench.hintVisible,
          sketchOffered: workbench.sketchOffered
        }
      : null;

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
    bridgeBuild,
    cickaDuel,
    concertGig,
    bachataLesson,
    sceneryMarks: stage.resolveSceneryMarks?.(state) ?? [],
    memory: observeMemory(state, stage, stages),
    builtBridge: state.builtBridge,
    canMove: state.mode === 'explore',
    blockedAhead,
    lastMessage: state.lastMessage,
    hints
  };
}

/**
 * The remembered scene the current line cuts to. That area stages itself as
 * it would look at the shot's beat; the player is not in the memory.
 */
function observeMemory(
  state: RidgeWorldState,
  stage: RidgeStageDefinition,
  stages: RidgeStageRegistry | null
): RidgeObservation['memory'] {
  const conversation = state.conversation;
  const shot = conversation?.lines[conversation.lineIndex]?.memory;
  if (!shot) return null;
  const remembered = stages?.[shot.areaId] ?? (stage.areaId === shot.areaId ? stage : null);
  if (!remembered) return null;
  const then: RidgeWorldState = {
    ...state,
    areaId: shot.areaId,
    beat: shot.beat,
    progress: shot.focus,
    facing: 'right',
    mode: 'explore',
    conversation: null,
    flags: new Set([...state.flags, ...(shot.flags ?? [])])
  };
  return {
    areaId: shot.areaId,
    beat: shot.beat,
    focus: shot.focus,
    actors: remembered.resolveActors(then).map((actor) => {
      // You are up at the overlook, and Cicka is sitting beside you.
      if (actor.id === 'player') return { ...actor, progress: shot.focus, visible: false };
      if (actor.id === 'cicka') return { ...actor, visible: false };
      return actor;
    }),
    sceneryMarks: remembered.resolveSceneryMarks?.(then) ?? [],
    dancers: shot.dancers ?? [],
    shotKey: `${conversation.id}:${conversation.lineIndex}`
  };
}

function buildHints(
  state: RidgeWorldState,
  stage: RidgeStageDefinition,
  nearby: RidgeObservation['nearby'],
  blockedAhead: boolean,
  workbench: BridgeWorkbench | null
): string[] {
  if (state.mode === 'bridgeBuild') {
    return bridgeBuildHints(workbench);
  }
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
      (typeof blockedMessage === 'function' ? blockedMessage(state) : blockedMessage) ??
        'The path east is blocked until the local problem clears.'
    );
  }
  if (state.beat === 'relay_complete') {
    hints.unshift('The dedication fades. The page will return to the Bridge.');
  }

  return hints;
}

function observeDuel(duel: CickaDuel): NonNullable<RidgeObservation['cickaDuel']> {
  const telegraph = duel.telegraph;
  return {
    phase: duel.phase,
    hearts: duel.hearts,
    maxHearts: duel.maxHearts,
    strikesDone: duel.strikesDone,
    strikesTotal: duel.strikesTotal,
    perfectCount: duel.perfectCount,
    canDodge: duel.canDodge,
    telegraph: telegraph ? { kind: telegraph.kind, framesToImpact: telegraph.framesToImpact } : null,
    lastResult: duel.lastResult?.result ?? null
  };
}

function observeGig(gig: ConcertGig): NonNullable<RidgeObservation['concertGig']> {
  const next = gig.nextPendingNote();
  return {
    mode: gig.mode,
    phase: gig.phase,
    timeMs: Math.round(gig.timeMs),
    section: gig.section?.kind ?? null,
    hype: gig.hype,
    combo: gig.combo,
    bestCombo: gig.bestCombo,
    score: gig.score,
    counts: { ...gig.counts },
    notesTotal: gig.song.notes.length,
    lastJudgment: gig.lastHit?.judgment ?? null,
    next: next ? { lane: next.lane, inMs: Math.round(next.timeMs - gig.timeMs) } : null,
    grade: gig.grade,
    practice:
      gig.mode === 'practice'
        ? { loop: gig.loop, loopsTotal: gig.loopsTotal, hits: gig.loopHits, needed: gig.loopNeeded, passed: gig.passed }
        : null,
    warmStart: gig.startHype > GIG_START_HYPE
  };
}

function observeLesson(lesson: ConcertGig): NonNullable<RidgeObservation['bachataLesson']> {
  const next = lesson.nextPendingNote();
  return {
    phase: lesson.phase,
    timeMs: Math.round(lesson.timeMs),
    section: lesson.section?.kind ?? null,
    nerve: lesson.hype,
    combo: lesson.combo,
    bestCombo: lesson.bestCombo,
    counts: { ...lesson.counts },
    notesTotal: lesson.song.notes.length,
    lastJudgment: lesson.lastHit?.judgment ?? null,
    next: next ? { step: bachataStepOf(next.lane), inMs: Math.round(next.timeMs - lesson.timeMs) } : null,
    grade: lesson.grade
  };
}

function lessonHints(lesson: ConcertGig | null): string[] {
  if (lesson?.phase === 'finished') return ['dance done — hear how the driver feels about it'];
  return [
    'dance step — dance the next step right on the count (or dance left|tap|right now)',
    'dance wait [ms] — let the Profe keep counting',
    'dance auto — dance the rest cleanly | dance skip — just count it for him'
  ];
}

function gigHints(gig: ConcertGig | null): string[] {
  if (gig?.phase === 'finished') {
    return [
      gig.mode === 'serenade'
        ? 'gig done — see if the cat comes out'
        : 'gig done — take a bow and hear what Steve thinks'
    ];
  }
  return [
    'gig hit — strum the next note right on time (or gig hit 0|1|2 to strum a lane now)',
    'gig wait [ms] — let the song play on',
    'gig auto — play the rest cleanly | gig skip — let it pass'
  ];
}

function duelHints(duel: CickaDuel | null): string[] {
  if (duel && duel.phase !== 'fighting') return ['duel done — see how Cicka takes it'];
  return [
    'duel wait — let time pass until the next paw lands',
    'duel dodge — hop clear (a feint stops short; wait it out)'
  ];
}

function bridgeBuildHints(workbench: BridgeWorkbench | null): string[] {
  switch (workbench?.phase) {
    case 'testing':
      return ['build edit — stop the run and keep drawing'];
    case 'failed':
      return [
        'build edit — back to drawing',
        workbench.sketchOffered ? 'build sketch — trace the Draftsperson sketch' : 'build hint — peek at the sketch'
      ];
    case 'passed':
      return ['build done — open the crossing'];
    default:
      return [
        'build road|wood X,Y X,Y — draw from a bolt or joint (max ~2 squares)',
        'build test — send the toy car across',
        'build show | undo | erase <n> | hint | leave'
      ];
  }
}

export function formatObservation(observation: RidgeObservation): string {
  const lines: string[] = [];
  lines.push(`# ${observation.title}`);
  lines.push(
    `mode=${observation.mode} area=${observation.areaId} beat=${observation.beat} progress=${observation.progressPercent}% facing=${observation.facing}`
  );
  lines.push(observation.ambience);
  if (observation.memory) {
    const m = observation.memory;
    const cast = m.actors
      .filter((actor) => actor.visible)
      .map((actor) => actor.label)
      .join(', ');
    const dancing = m.dancers.length > 0 ? `; dancing: ${m.dancers.join(', ')}` : '';
    lines.push(`(memory) ${m.areaId} at ${Math.round(m.focus * 100)}%: ${cast}${dancing}`);
  }

  if (observation.bridgeBuild) {
    const b = observation.bridgeBuild;
    lines.push('');
    lines.push(
      `--- blueprint bridge: ${b.phase} (attempt ${b.attempts}) ink ${b.ink}/${b.inkBudget} beams=${b.beamCount} ---`
    );
    lines.push(`Bridge Draftsperson: ${b.tipText}`);
  } else if (observation.cickaDuel) {
    const d = observation.cickaDuel;
    lines.push('');
    lines.push(
      `--- cicka standoff: ${d.phase} hearts ${d.hearts}/${d.maxHearts} strikes ${d.strikesDone}/${d.strikesTotal} perfect ${d.perfectCount} ---`
    );
    if (d.telegraph) lines.push(`Cicka winds up a ${d.telegraph.kind}: lands in ${d.telegraph.framesToImpact} frames`);
    if (d.lastResult) lines.push(`Last landing: ${d.lastResult}`);
  } else if (observation.concertGig) {
    const g = observation.concertGig;
    lines.push('');
    lines.push(
      `--- ${g.mode === 'serenade' ? 'guitar' : 'concert'} ${g.mode}: ${g.phase} ${g.section ?? ''} t=${g.timeMs}ms hype ${Math.round(g.hype * 100)}% combo ${g.combo} score ${g.score} ---`
    );
    lines.push(
      `perfect ${g.counts.perfect} good ${g.counts.good} miss ${g.counts.miss} of ${g.notesTotal} — grade ${g.grade}`
    );
    if (g.practice) {
      lines.push(
        `practice pass ${g.practice.loop + 1}/${g.practice.loopsTotal}: ${g.practice.hits}/${g.practice.needed} landed`
      );
    }
    if (g.next) lines.push(`Next note: lane ${g.next.lane} in ${g.next.inMs}ms`);
    if (g.lastJudgment) lines.push(`Last note: ${g.lastJudgment}`);
  } else if (observation.bachataLesson) {
    const d = observation.bachataLesson;
    lines.push('');
    lines.push(
      `--- bachata lesson: ${d.phase} ${d.section ?? ''} t=${d.timeMs}ms nerve ${Math.round(d.nerve * 100)}% combo ${d.combo} ---`
    );
    lines.push(
      `perfect ${d.counts.perfect} good ${d.counts.good} miss ${d.counts.miss} of ${d.notesTotal} — grade ${d.grade}`
    );
    if (d.next) lines.push(`Next step: ${d.next.step} in ${d.next.inMs}ms`);
    if (d.lastJudgment) lines.push(`Last step: ${d.lastJudgment}`);
  } else if (observation.conversation) {
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
        lines.push(`  - ${item.label} [${item.kind}] dist=${item.distance.toFixed(3)} :: ${item.prompt}`);
      }
    }

    lines.push('');
    lines.push('Actors:');
    for (const actor of observation.actors.filter((a) => a.visible)) {
      lines.push(`  - ${actor.label} @ ${(actor.progress * 100).toFixed(0)}% facing=${actor.facing}`);
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
