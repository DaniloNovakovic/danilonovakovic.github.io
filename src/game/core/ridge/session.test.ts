import { describe, expect, it } from 'vitest';
import { createBridgeStage } from './content/bridgeStage';
import { TEST_BRIDGE_DIALOGUE_CATALOG } from './content/testBridgeCatalog';
import { parseRidgeCommand, parseRidgeScript } from './commands';
import { RidgeConsoleSession } from './session';

function createSession() {
  return new RidgeConsoleSession({ stage: createBridgeStage(TEST_BRIDGE_DIALOGUE_CATALOG) });
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
  it('runs semicolon scripts', () => {
    const session = createSession();
    const results = session.execScript('look; go right 1');
    expect(results.map((r) => r.ok)).toEqual([true, true]);
  });

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
