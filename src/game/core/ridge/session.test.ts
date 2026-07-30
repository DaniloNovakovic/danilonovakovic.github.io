import { describe, expect, it } from 'vitest';
import { createBridgeStage, type BridgeDialogueCatalog } from './content/bridgeStage';
import { parseRidgeCommand, parseRidgeScript } from './commands';
import { RidgeConsoleSession } from './session';

const catalog: BridgeDialogueCatalog = {
  speakers: {
    prompt: 'Prompt',
    cicka: 'Cicka',
    bridgeDraftsperson: 'Bridge Draftsperson'
  },
  lines: {
    'bridge.cicka.first_meet.01': 'Sit near Cicka',
    'bridge.cicka.first_meet.02': 'Small chirp.',
    'bridge.cicka.first_meet.03': 'Cicka bats the tiny car back into place.',
    'bridge.draftsperson.missing_span.01': 'Missing span worry.',
    'bridge.draftsperson.missing_span.02': 'Toy car missing.',
    'bridge.draftsperson.missing_span.03': 'Look for the tiny test car',
    'bridge.cicka.parallel_play.01': 'Sit with Cicka',
    'bridge.cicka.parallel_play.02': 'Roll the car back gently',
    'bridge.cicka.parallel_play.03': 'Quiet purr.',
    'bridge.cicka.parallel_play.04': 'Cicka leaves the tiny car beside you.',
    'bridge.draftsperson.toy_car_test.01': 'Set the tiny car on the drawing',
    'bridge.draftsperson.toy_car_test.02': 'Courage line.',
    'bridge.draftsperson.toy_car_test.03': 'The toy car rolls across the new span.',
    'bridge.draftsperson.toy_car_test.04': 'That line holds.',
    'bridge.exit.opened_crossing.01': 'Cross the finished bridge',
    'bridge.exit.opened_crossing.02': 'Thank you.',
    'bridge.exit.opened_crossing.03': 'The page turns toward evening music.'
  }
};

function createSession() {
  return new RidgeConsoleSession({ stage: createBridgeStage(catalog) });
}

describe('parseRidgeCommand', () => {
  it('parses movement shortcuts and scripts', () => {
    expect(parseRidgeCommand('go right 2')).toEqual({
      type: 'go',
      direction: 'right',
      steps: 2
    });
    expect(parseRidgeCommand('left')).toEqual({
      type: 'go',
      direction: 'left',
      steps: 1
    });
    expect(parseRidgeScript('look; right 2; interact').map((c) => c.type)).toEqual([
      'look',
      'go',
      'interact'
    ]);
  });
});

describe('RidgeConsoleSession Bridge playthrough', () => {
  it('walks the Bridge tracer end-to-end through console commands', () => {
    const session = createSession();

    // Reach Cicka and meet her (with Persona-style choice).
    walkTo(session, 0.22);
    expect(session.exec('interact cicka').ok).toBe(true);
    drainConversation(session);
    expect(session.observe().conversation?.awaitingChoice).toBe(true);
    expect(session.exec('choose pet').ok).toBe(true);
    drainConversation(session);
    expect(session.observe().mode).toBe('explore');

    // Learn about the missing span.
    walkTo(session, 0.55);
    expect(session.exec('interact draftsperson').ok).toBe(true);
    drainConversation(session);
    expect(session.observe().beat).toBe('needs_toy_car');

    // Soft wall before the bridge opens.
    const blocked = session.exec('go right 5');
    expect(blocked.ok).toBe(false);
    expect(session.observe().progress).toBeLessThanOrEqual(0.62);

    // Retrieve toy car via parallel play.
    walkTo(session, 0.22);
    expect(session.exec('interact').ok).toBe(true);
    drainConversation(session);
    expect(session.observe().beat).toBe('toy_car_shared');
    expect(session.observe().inventory).toContain('toy-car');

    // Auto-success toy car test opens the crossing.
    walkTo(session, 0.55);
    expect(session.exec('interact').ok).toBe(true);
    drainConversation(session);
    expect(session.observe().beat).toBe('bridge_complete');

    // Exit handoff.
    walkTo(session, 0.9);
    expect(session.exec('interact').ok).toBe(true);
    const events = drainConversation(session);
    expect(events.some((event) => event.type === 'concert_handoff')).toBe(true);
    expect(session.observe().beat).toBe('concert_handoff');
    expect(session.observe().areaId).toBe('concert');
  });

  it('exposes nearby distances useful for AI agents', () => {
    const session = createSession();
    walkTo(session, 0.22);
    const observation = session.observe();
    expect(observation.nearby.some((item) => item.spotId === 'cicka')).toBe(true);
    expect(observation.nearby[0]?.distance).toBeLessThan(0.08);
    expect(session.format()).toContain('Nearby:');
  });
});

function walkTo(session: RidgeConsoleSession, target: number): void {
  for (let i = 0; i < 40; i += 1) {
    const progress = session.observe().progress;
    if (Math.abs(progress - target) <= 0.03) return;
    const direction = progress < target ? 'right' : 'left';
    session.exec(`go ${direction}`);
  }
}

function drainConversation(session: RidgeConsoleSession) {
  const events = [];
  for (let i = 0; i < 12; i += 1) {
    const observation = session.observe();
    if (observation.mode !== 'conversation') break;
    if (observation.conversation?.awaitingChoice) break;
    const result = session.exec('advance');
    events.push(...result.events);
  }
  return events;
}
