import { describe, expect, it } from 'vitest';
import { createBridgeStage } from './content/bridgeStage';
import { createRidgeRouteStages } from './content/routeStages';
import { TEST_BRIDGE_DIALOGUE_CATALOG } from './content/testBridgeCatalog';
import { TEST_ROUTE_DIALOGUE_CATALOG } from './content/testRouteCatalog';
import { parseRidgeCommand, parseRidgeScript } from './commands';
import { RidgeConsoleSession } from './session';
import type { RidgeSessionEvent } from './types';

function createBridgeOnlySession() {
  return new RidgeConsoleSession({
    stage: createBridgeStage(TEST_BRIDGE_DIALOGUE_CATALOG)
  });
}

function createRouteSession() {
  return new RidgeConsoleSession({
    stages: createRidgeRouteStages(TEST_ROUTE_DIALOGUE_CATALOG)
  });
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
    const session = createBridgeOnlySession();
    const results = session.execScript('look; go right 1');
    expect(results.map((r) => r.ok)).toEqual([true, true]);
  });

  it('walks the Bridge tracer end-to-end through console commands', () => {
    const session = createBridgeOnlySession();
    playBridge(session);
    const observation = session.observe();
    expect(observation.areaId).toBe('concert');
    expect(observation.beat).toBe('concert_arrival');
  });

  it('exposes nearby distances useful for AI agents', () => {
    const session = createBridgeOnlySession();
    walkTo(session, 0.22);
    const observation = session.observe();
    expect(observation.nearby.some((item) => item.spotId === 'cicka')).toBe(true);
    expect(observation.nearby[0]?.distance).toBeLessThan(0.08);
    expect(session.format()).toContain('Nearby:');
  });
});

describe('RidgeConsoleSession first-playable full route', () => {
  it('plays Bridge → Concert → Dance → Relay farewell → Bridge reset', () => {
    const session = createRouteSession();

    playBridge(session);
    expect(session.observe().areaId).toBe('concert');
    expect(session.observe().title).toContain('Concert');

    playConcert(session);
    expect(session.observe().areaId).toBe('danceFestival');
    expect(session.observe().inventory).toContain('guitar');

    playDance(session);
    expect(session.observe().areaId).toBe('relay');

    const endingEvents = playRelay(session);
    expect(endingEvents.some((event) => event.type === 'route_reset')).toBe(true);
    expect(session.observe().areaId).toBe('bridge');
    expect(session.observe().beat).toBe('intro');
    expect(session.observe().inventory).toEqual([]);
    expect(session.format()).toContain('Bridge Area');
  });
});

function playBridge(session: RidgeConsoleSession): RidgeSessionEvent[] {
  const events: RidgeSessionEvent[] = [];

  walkTo(session, 0.22);
  expect(session.exec('interact cicka').ok).toBe(true);
  events.push(...drainConversation(session));
  expect(session.exec('choose pet').ok).toBe(true);
  events.push(...drainConversation(session));

  walkTo(session, 0.55);
  expect(session.exec('interact draftsperson').ok).toBe(true);
  events.push(...drainConversation(session));
  expect(session.observe().beat).toBe('needs_toy_car');

  const blocked = session.exec('go right 5');
  expect(blocked.ok).toBe(false);

  walkTo(session, 0.22);
  expect(session.exec('interact').ok).toBe(true);
  events.push(...drainConversation(session));
  expect(session.observe().inventory).toContain('toy-car');

  walkTo(session, 0.55);
  expect(session.exec('interact').ok).toBe(true);
  events.push(...drainConversation(session));
  expect(session.observe().beat).toBe('bridge_complete');

  walkTo(session, 0.9);
  expect(session.exec('interact').ok).toBe(true);
  events.push(...drainConversation(session));
  expect(events.some((event) => event.type === 'area_handoff')).toBe(true);
  return events;
}

function playConcert(session: RidgeConsoleSession): void {
  walkTo(session, 0.55);
  expect(session.exec('interact crowd').ok).toBe(true);
  drainConversation(session);

  walkTo(session, 0.28);
  expect(session.exec('interact guitarist').ok).toBe(true);
  drainConversation(session);

  expect(session.exec('interact guitarist').ok).toBe(true);
  drainConversation(session);
  expect(session.observe().beat).toBe('concert_practiced');

  walkTo(session, 0.42);
  expect(session.exec('interact stage').ok).toBe(true);
  drainConversation(session);
  expect(session.observe().beat).toBe('concert_cleared');
  expect(session.observe().inventory).toContain('guitar');

  walkTo(session, 0.9);
  expect(session.exec('interact').ok).toBe(true);
  drainConversation(session);
}

function playDance(session: RidgeConsoleSession): void {
  walkTo(session, 0.14);
  expect(session.exec('interact traveler').ok).toBe(true);
  drainConversation(session);

  walkTo(session, 0.56);
  expect(session.exec('interact operations').ok).toBe(true);
  drainConversation(session);

  walkTo(session, 0.4);
  expect(session.exec('interact teacher').ok).toBe(true);
  drainConversation(session);
  expect(session.observe().beat).toBe('dance_ready');

  // Nearest interact at the soft wall should prefer the gate over the steward.
  walkTo(session, 0.68);
  expect(session.exec('interact').ok).toBe(true);
  expect(session.observe().conversation?.id).toBe('dance.setup_clearance');
  drainConversation(session);
  expect(session.observe().beat).toBe('dance_cleared');

  walkTo(session, 0.9);
  expect(session.exec('interact shuttle').ok).toBe(true);
  drainConversation(session);
}

function playRelay(session: RidgeConsoleSession): RidgeSessionEvent[] {
  walkTo(session, 0.55);
  expect(session.exec('interact').ok).toBe(true);
  const events = drainConversation(session);
  expect(session.observe().conversation?.awaitingChoice).toBe(true);
  expect(session.exec('choose let-song-end').ok).toBe(true);
  events.push(...drainConversation(session));
  return events;
}

function walkTo(session: RidgeConsoleSession, target: number): void {
  for (let i = 0; i < 40; i += 1) {
    const progress = session.observe().progress;
    if (Math.abs(progress - target) <= 0.03) return;
    const direction = progress < target ? 'right' : 'left';
    session.exec(`go ${direction}`);
  }
}

function drainConversation(session: RidgeConsoleSession) {
  const events: RidgeSessionEvent[] = [];
  for (let i = 0; i < 20; i += 1) {
    const observation = session.observe();
    if (observation.mode !== 'conversation') break;
    if (observation.conversation?.awaitingChoice) break;
    const result = session.exec('advance');
    events.push(...result.events);
  }
  return events;
}
