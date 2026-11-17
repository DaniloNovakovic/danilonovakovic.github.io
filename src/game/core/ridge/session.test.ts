import { describe, expect, it } from 'vitest';
import { createBridgeStage } from './content/bridgeStage';
import { createRidgeRouteStages } from './content/routeStages';
import { TEST_BRIDGE_DIALOGUE_CATALOG } from './content/testBridgeCatalog';
import { TEST_ROUTE_DIALOGUE_CATALOG } from './content/testRouteCatalog';
import { parseRidgeCommand, parseRidgeScript } from './commands';
import { RidgeConsoleSession } from './session';
import type { RidgeObservation, RidgeSessionEvent } from './types';

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

const choiceIds = (session: RidgeConsoleSession) =>
  session.observe().conversation?.choices?.map((choice) => choice.id) ?? [];

describe('Bridge conversations', () => {
  it('lets the player try to grab the car without Cicka handing it over', () => {
    const session = createBridgeOnlySession();
    walkTo(session, 0.22);
    session.exec('interact cicka');
    talk(session, 'reach');
    // Back at the topic menu, minus the topic just asked.
    expect(choiceIds(session)).toEqual(['pet', 'watch', 'leave']);
    talk(session, 'leave');

    walkTo(session, 0.55);
    session.exec('interact draftsperson');
    // The car line remembers meeting Cicka.
    talk(session, 'car');
    expect(session.observe().conversation?.lineId).toBe('bridge.draftsperson.missing_span.car.03_cat');
    expect(session.observe().beat).toBe('needs_toy_car');
    expect(choiceIds(session)).toEqual(['who', 'why', 'leave']);
    session.exec('leave');

    walkTo(session, 0.22);
    session.exec('interact cicka');
    talk(session, 'grab', 'ask', 'leaf', 'pocket');
    expect(session.observe().inventory).not.toContain('toy-car');
    expect(choiceIds(session)).toEqual(['grab', 'leaf', 'leave']);
    talk(session, 'leaf', 'roll', 'roll_again');
    expect(session.observe().inventory).toContain('toy-car');
    expect(session.observe().beat).toBe('toy_car_shared');
  });

  it('remembers asked Draftsperson topics and lets the player hold on to the car', () => {
    const session = createBridgeOnlySession();
    walkTo(session, 0.55);
    session.exec('interact draftsperson');
    talk(session, 'who', 'car', 'leave');

    session.exec('interact draftsperson');
    drainConversation(session);
    expect(choiceIds(session)).toEqual(['cicka', 'why', 'still_looking']);
    talk(session, 'still_looking');

    walkTo(session, 0.22);
    session.exec('interact cicka');
    talk(session, 'leaf', 'roll', 'roll_again');
    walkTo(session, 0.55);
    session.exec('interact draftsperson');
    talk(session, 'not_yet');
    expect(session.observe().mode).toBe('explore');
    expect(session.observe().inventory).toContain('toy-car');

    session.exec('interact draftsperson');
    talk(session, 'hand_over');
    expect(session.observe().mode).toBe('bridgeBuild');
    session.exec('build road 0,0 2,0');
    session.exec('build leave');
    expect(session.observe().mode).toBe('explore');

    // Returning to an unfinished drawing asks before opening the table.
    session.exec('interact draftsperson');
    drainConversation(session);
    expect(choiceIds(session)).toEqual(['resume', 'advice', 'later']);
    talk(session, 'advice', 'resume');
    expect(session.observe().mode).toBe('bridgeBuild');
  });
});

describe("Cicka's Standoff from keeping the car", () => {
  function reachKeep(session: RidgeConsoleSession) {
    walkTo(session, 0.55);
    session.exec('interact draftsperson');
    talk(session, 'car', 'leave');
    walkTo(session, 0.22);
    session.exec('interact cicka');
    talk(session, 'leaf', 'roll', 'keep');
  }

  it('earns the car and her respect by outlasting her', () => {
    const session = createBridgeOnlySession();
    reachKeep(session);
    expect(session.observe().mode).toBe('cickaDuel');
    expect(session.exec('go right').ok).toBe(false);
    expect(session.exec('duel done').ok).toBe(false);

    for (let i = 0; i < 40 && session.observe().cickaDuel?.phase === 'fighting'; i += 1) {
      session.exec('duel wait');
      const telegraph = session.observe().cickaDuel?.telegraph;
      if (telegraph && telegraph.kind !== 'feint') session.exec('duel dodge');
      session.exec('duel wait 3');
    }
    while (session.observe().cickaDuel?.phase === 'fighting') session.exec('duel wait 10');
    expect(session.observe().cickaDuel?.phase).toBe('won');

    const done = session.exec('duel done');
    expect(done.events.some((event) => event.type === 'cicka_duel_closed' && event.won)).toBe(true);
    expect(session.observe().conversation?.id).toBe('bridge.cicka.duel_won');
    drainConversation(session);
    expect(session.observe().inventory).toContain('toy-car');
    expect(session.observe().beat).toBe('toy_car_shared');

    session.exec('interact cicka');
    expect(session.observe().conversation?.lineId).toBe('bridge.cicka.after_share.01_respect');
    talk(session, 'promise');

    // The won car opens the bridge exactly like the friendly one.
    walkTo(session, 0.55);
    session.exec('interact draftsperson');
    talk(session, 'hand_over');
    expect(session.observe().mode).toBe('bridgeBuild');
  });

  it('keeps the car with Cicka after a loss and offers a rematch', () => {
    const session = createBridgeOnlySession();
    reachKeep(session);
    while (session.observe().cickaDuel?.phase === 'fighting') session.exec('duel wait 30');
    expect(session.observe().cickaDuel?.phase).toBe('lost');
    session.exec('duel done');
    expect(session.observe().conversation?.id).toBe('bridge.cicka.duel_lost');
    drainConversation(session);
    expect(session.observe().mode).toBe('explore');
    expect(session.observe().inventory).not.toContain('toy-car');

    session.exec('interact cicka');
    drainConversation(session);
    expect(choiceIds(session)).toContain('rematch');
    talk(session, 'rematch');
    expect(session.observe().mode).toBe('cickaDuel');
  });

  it('still lets you roll the car back after a loss', () => {
    const session = createBridgeOnlySession();
    reachKeep(session);
    while (session.observe().cickaDuel?.phase === 'fighting') session.exec('duel wait 30');
    session.exec('duel done');
    drainConversation(session);

    session.exec('interact cicka');
    drainConversation(session);
    talk(session, 'leaf', 'roll', 'roll_again');
    expect(session.observe().inventory).toContain('toy-car');
  });
});

describe('RidgeConsoleSession playtest skips', () => {
  it('warps and skips across Compact Ridge Areas with guitar when needed', () => {
    const session = createRouteSession();
    expect(session.exec('warp dance').ok).toBe(true);
    expect(session.observe().areaId).toBe('danceFestival');
    expect(session.observe().inventory).toContain('guitar');

    expect(session.exec('skip').ok).toBe(true);
    expect(session.observe().areaId).toBe('relay');

    expect(session.exec('skip').ok).toBe(false);
    expect(session.exec('warp bridge').ok).toBe(true);
    expect(session.observe().areaId).toBe('bridge');
    expect(session.observe().inventory).toEqual([]);
  });
});

describe('Last-Stop Plaza', () => {
  function danceSession() {
    const session = createRouteSession();
    session.exec('warp dance');
    return session;
  }

  it('parses dance verbs as steps', () => {
    expect(parseRidgeCommand('dance left')).toEqual({ type: 'dance', action: { kind: 'hit', lane: 0 } });
    expect(parseRidgeCommand('dance tap')).toEqual({ type: 'dance', action: { kind: 'hit', lane: 1 } });
    expect(parseRidgeCommand('dance step right')).toEqual({ type: 'dance', action: { kind: 'hit', lane: 2 } });
    expect(parseRidgeCommand('dance step')).toEqual({ type: 'dance', action: { kind: 'hit' } });
    expect(parseRidgeCommand('dance skip')).toEqual({ type: 'dance', action: { kind: 'skip' } });
  });

  it('keeps the dance talk quiet until you ask why the shuttle waits', () => {
    const session = danceSession();
    walkTo(session, 0.22);
    session.exec('interact driver');
    drainConversation(session);
    const ids = () => session.observe().conversation?.choices?.map((option) => option.id) ?? [];
    expect(ids()).not.toContain('dance');
    talk(session, 'when', 'leave');
    session.exec('interact driver');
    drainConversation(session);
    expect(ids()).toContain('dance');
  });

  it('still counts the driver in when you just let the lesson play', () => {
    const session = danceSession();
    walkTo(session, 0.22);
    session.exec('interact driver');
    talk(session, 'when', 'leave');
    session.exec('interact driver');
    talk(session, 'dance', 'learn');
    walkTo(session, 0.35);
    session.exec('interact teacher');
    talk(session, 'lesson', 'go');
    expect(session.exec('dance skip').ok).toBe(true);
    expect(session.observe().bachataLesson?.grade).toBe('rough');
    session.exec('dance done');
    expect(session.observe().conversation?.text).toBe('dance.lesson.done.teacher.rough');
    drainConversation(session);
    // He has his step either way: the driver's talk moves on.
    session.exec('interact driver');
    expect(session.observe().conversation?.id).toBe('dance.driver.practiced');
  });

  it('steadies the driver when you encouraged him first', () => {
    const session = danceSession();
    walkTo(session, 0.22);
    session.exec('interact driver');
    talk(session, 'when', 'leave');
    session.exec('interact driver');
    talk(session, 'dance', 'learn');
    session.exec('interact driver');
    talk(session, 'encourage');
    walkTo(session, 0.35);
    session.exec('interact teacher');
    talk(session, 'lesson', 'go');
    expect(session.observe().bachataLesson?.nerve).toBeCloseTo(0.45);
  });

  it('serenades the shy cat out from under the chairs', () => {
    const session = danceSession();
    const catVisible = () => session.observe().actors.find((actor) => actor.id === 'counterpart-cat')?.visible;
    expect(catVisible()).toBe(false);
    expect(session.observe().sceneryMarks).toContain('cat-hiding');
    walkTo(session, 0.49);
    expect(session.exec('interact chairs').ok).toBe(true);
    talk(session, 'play');
    expect(session.observe().concertGig?.mode).toBe('serenade');
    session.exec('gig auto');
    session.exec('gig done');
    expect(session.observe().conversation?.id).toBe('dance.cats.serenade_done');
    drainConversation(session);
    expect(catVisible()).toBe(true);
    expect(session.observe().sceneryMarks).not.toContain('cat-hiding');
    expect(session.observe().beat).toBe('dance_arrival');
  });
});

describe('Concert Crossing', () => {
  function concertSession() {
    const session = createRouteSession();
    session.exec('warp concert');
    return session;
  }

  function startShow(session: RidgeConsoleSession) {
    walkTo(session, 0.35);
    session.exec('interact guitarist');
    talk(session, 'help', 'learn');
    session.exec('gig skip');
    session.exec('gig done');
    // Running out of practice passes still opens the show; Steve notices.
    expect(session.observe().beat).toBe('concert_practiced');
    drainConversation(session);
    walkTo(session, 0.49);
    expect(session.exec('interact stage').ok).toBe(true);
    talk(session, 'show');
    expect(session.observe().mode).toBe('concertGig');
  }

  it('judges console strums and never lets the show fail', () => {
    const session = concertSession();
    startShow(session);
    expect(session.exec('gig hit').message).toContain('perfect');
    expect(session.exec('leave').ok).toBe(false);
    session.exec('gig skip');
    expect(session.observe().concertGig?.phase).toBe('finished');
    expect(session.observe().concertGig?.grade).toBe('rough');
    session.exec('gig done');
    expect(session.observe().beat).toBe('concert_cleared');
    session.exec('advance');
    // A rough show still gets cheered: nobody remembers the clean notes.
    expect(session.observe().conversation?.text).toBe('concert.gig.show_done.crowd.rough');
  });

  it('a kid hype man warms the crowd before the first note', () => {
    const session = concertSession();
    walkTo(session, 0.15);
    session.exec('interact kid');
    talk(session, 'sticker', 'hype');
    expect(session.observe().nearby.some((spot) => spot.spotId === 'kid')).toBe(false);
    startShow(session);
    expect(session.observe().concertGig?.hype).toBeGreaterThan(0.6);
  });

  it('lets you put the practice riff down and pick it back up', () => {
    const session = concertSession();
    walkTo(session, 0.35);
    session.exec('interact guitarist');
    talk(session, 'help', 'learn');
    expect(session.exec('leave').ok).toBe(true);
    expect(session.observe().mode).toBe('explore');
    expect(session.observe().beat).toBe('concert_arrival');
    session.exec('interact guitarist');
    talk(session, 'learn');
    expect(session.observe().concertGig?.mode).toBe('practice');
  });

  it('offers an encore once the crossing is open', () => {
    const session = concertSession();
    startShow(session);
    session.exec('gig auto');
    session.exec('gig done');
    drainConversation(session);
    walkTo(session, 0.49);
    session.exec('interact stage');
    talk(session, 'encore');
    expect(session.observe().concertGig?.mode).toBe('show');
    session.exec('gig auto');
    session.exec('gig done');
    expect(session.observe().conversation?.id).toBe('concert.gig.show_done');
    expect(session.observe().conversation?.text).toBe('concert.gig.show_done.encore.01');
  });
});

describe('Relay overlook', () => {
  it('keeps you where you stand while inspecting, with one sit-and-play prompt', () => {
    const session = createRouteSession();
    session.exec('warp relay');
    walkTo(session, 0.2);
    expect(session.exec('interact').ok).toBe(true);
    const you = () => session.observe().actors.find((actor) => actor.id === 'player')!;
    expect(you().progress).toBeCloseTo(session.observe().progress);
    expect(you().progress).toBeLessThan(0.3);
    drainConversation(session);
    walkTo(session, 0.56);
    const sitPrompts = session.observe().nearby.filter((item) => item.conversationId === 'relay.sit_and_play.prompt');
    expect(sitPrompts).toHaveLength(1);
  });
});

describe('Relay memory cinematic', () => {
  it('cuts back down the route while you play, ending on the night dance', () => {
    const session = createRouteSession();
    session.exec('warp relay');
    walkTo(session, 0.55);
    expect(session.exec('interact').ok).toBe(true);
    const shots: NonNullable<RidgeObservation['memory']>[] = [];
    for (let i = 0; i < 30 && !session.observe().conversation?.awaitingChoice; i += 1) {
      const memory = session.observe().memory;
      if (memory) shots.push(memory);
      session.exec('advance');
    }
    expect(shots.map((shot) => shot.areaId)).toEqual([
      'bridge', 'concert', 'danceFestival', 'danceFestival', 'danceFestival', 'danceFestival', 'danceFestival'
    ]);
    // The player is up the hill; Cicka went with them.
    for (const shot of shots) {
      expect(shot.actors.find((actor) => actor.id === 'player')?.visible).toBe(false);
      expect(shot.actors.find((actor) => actor.id === 'cicka')?.visible ?? false).toBe(false);
    }
    // The Concert cut is the line's own picture: Steve and the kid, side by side.
    const concert = shots[1]!;
    const steve = concert.actors.find((actor) => actor.id === 'guitarist')!;
    const kid = concert.actors.find((actor) => actor.id === 'kid')!;
    expect(Math.abs(steve.progress - kid.progress)).toBeLessThan(0.05);
    expect(kid.facing).toBe('right');
    expect(shots[2]!.sceneryMarks).toContain('sky-night');
    expect(shots[5]!.dancers).toEqual(['driver', 'operations-helper']);
    expect(shots.at(-1)!.dancers).toEqual(expect.arrayContaining(['traveler', 'steward']));
    expect(new Set(shots.map((shot) => shot.shotKey)).size).toBe(shots.length);
    // The plaza itself is never at night outside the memory.
    expect(session.observe().memory).toBeNull();
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
  events.push(...talk(session, 'pet', 'leave'));

  walkTo(session, 0.55);
  expect(session.exec('interact draftsperson').ok).toBe(true);
  events.push(...talk(session, 'car', 'leave'));
  expect(session.observe().beat).toBe('needs_toy_car');

  const blocked = session.exec('go right 5');
  expect(blocked.ok).toBe(false);

  walkTo(session, 0.22);
  expect(session.exec('interact').ok).toBe(true);
  events.push(...talk(session, 'leaf', 'roll', 'roll_again'));
  expect(session.observe().inventory).toContain('toy-car');

  walkTo(session, 0.55);
  expect(session.exec('interact draftsperson').ok).toBe(true);
  events.push(...talk(session, 'hand_over'));
  expect(session.observe().mode).toBe('bridgeBuild');
  expect(session.exec('build test').ok).toBe(false);

  // A bare deck sags into the river; the Draftsperson's sketch holds.
  for (const x of [0, 2, 4, 6]) {
    expect(session.exec(`build road ${x},0 ${x + 2},0`).ok).toBe(true);
  }
  expect(session.exec('build test').ok).toBe(false);
  expect(session.observe().bridgeBuild?.phase).toBe('failed');
  expect(session.exec('build edit').ok).toBe(true);
  expect(session.exec('build sketch').ok).toBe(true);
  expect(session.exec('build test').ok).toBe(true);
  const done = session.exec('build done');
  events.push(...done.events);
  expect(done.events.some((event) => event.type === 'bridge_built')).toBe(true);
  expect(session.observe().beat).toBe('bridge_complete');
  expect(session.observe().builtBridge?.length).toBeGreaterThan(0);
  // The Draftsperson thanks you before the crossing opens up.
  expect(session.observe().conversation?.id).toBe('bridge.draftsperson.bridge_built');
  events.push(...drainConversation(session));

  walkTo(session, 0.9);
  expect(session.exec('interact').ok).toBe(true);
  events.push(...drainConversation(session));
  expect(events.some((event) => event.type === 'area_handoff')).toBe(true);
  return events;
}

function playConcert(session: RidgeConsoleSession): void {
  // The crowd won't budge before the music starts.
  walkTo(session, 0.55);
  expect(session.exec('go right 3').ok).toBe(false);
  expect(session.exec('interact crowd').ok).toBe(true);
  talk(session, 'holdup', 'leave');

  // Steve teaches the phrase: the forgiving practice riff.
  walkTo(session, 0.35);
  expect(session.exec('interact guitarist').ok).toBe(true);
  talk(session, 'help', 'learn');
  expect(session.observe().mode).toBe('concertGig');
  expect(session.observe().concertGig?.mode).toBe('practice');
  expect(session.exec('go right').ok).toBe(false);
  expect(session.exec('gig auto').ok).toBe(true);
  const practiced = session.exec('gig done');
  expect(practiced.events.some((event) => event.type === 'concert_gig_closed')).toBe(true);
  expect(session.observe().beat).toBe('concert_practiced');
  expect(session.observe().conversation?.id).toBe('concert.gig.practice_done');
  drainConversation(session);

  // The show itself.
  walkTo(session, 0.35);
  expect(session.exec('interact guitarist').ok).toBe(true);
  talk(session, 'show');
  expect(session.observe().concertGig?.mode).toBe('show');
  expect(session.exec('gig auto').ok).toBe(true);
  expect(session.observe().concertGig?.grade).toBe('legendary');
  session.exec('gig done');
  expect(session.observe().beat).toBe('concert_cleared');
  expect(session.observe().conversation?.id).toBe('concert.gig.show_done');
  drainConversation(session);
  // The guitar is a goodbye gift, not a prize for the show.
  expect(session.observe().inventory).not.toContain('guitar');

  walkTo(session, 0.8);
  expect(session.exec('interact steve').ok).toBe(true);
  talk(session, 'promise');
  expect(session.observe().inventory).toContain('guitar');

  walkTo(session, 0.92);
  expect(session.exec('interact').ok).toBe(true);
  drainConversation(session);
}

function playDance(session: RidgeConsoleSession): void {
  // The service road is shut before anyone explains the romance.
  walkTo(session, 0.62);
  expect(session.exec('go right 3').ok).toBe(false);

  walkTo(session, 0.1);
  expect(session.exec('interact traveler').ok).toBe(true);
  talk(session, 'relay', 'leave');

  // Two left feet: he'd learn one step, but only behind the shelter.
  walkTo(session, 0.22);
  expect(session.exec('interact driver').ok).toBe(true);
  talk(session, 'when', 'leave');
  session.exec('interact driver');
  talk(session, 'dance', 'learn');

  // The Profe comes to him: the One-Step Practice.
  walkTo(session, 0.35);
  expect(session.exec('interact teacher').ok).toBe(true);
  talk(session, 'lesson', 'go');
  expect(session.observe().mode).toBe('bachataLesson');
  expect(session.exec('go right').ok).toBe(false);
  expect(session.exec('dance auto').ok).toBe(true);
  expect(session.observe().bachataLesson?.grade).toBe('legendary');
  const danced = session.exec('dance done');
  expect(danced.events.some((event) => event.type === 'bachata_lesson_closed')).toBe(true);
  expect(session.observe().conversation?.id).toBe('dance.lesson.done');
  drainConversation(session);

  // Operations Handoff Check: everything's fine, so who keeps watch?
  walkTo(session, 0.56);
  expect(session.exec('interact operations').ok).toBe(true);
  talk(session, 'help', 'tug', 'stamp', 'count', 'watch');
  walkTo(session, 0.35);
  expect(session.exec('interact teacher').ok).toBe(true);
  talk(session, 'watch', 'leave');
  walkTo(session, 0.56);
  expect(session.exec('interact operations').ok).toBe(true);
  talk(session, 'kept');

  // The Folded Song Request: written at the shelter, dropped in her jar.
  walkTo(session, 0.22);
  expect(session.exec('interact driver').ok).toBe(true);
  talk(session, 'write', 'simple');
  expect(session.observe().inventory).toContain('folded-request');
  walkTo(session, 0.56);
  expect(session.exec('interact operations').ok).toBe(true);
  talk(session, 'drop');
  expect(session.observe().inventory).not.toContain('folded-request');
  expect(session.observe().beat).toBe('dance_ready');

  // Setup Clearance: two jobs on the lane, tagged in ink, then the sign at the gate.
  expect(session.observe().sceneryMarks).toEqual(expect.arrayContaining(['todo-lanterns', 'todo-cables']));
  walkTo(session, 0.665, 0.005);
  expect(session.exec('interact steward').ok).toBe(true);
  expect(session.observe().conversation?.id).toBe('dance.steward.clearance');
  talk(session, 'later');
  walkTo(session, 0.605, 0.01);
  expect(session.exec('interact lantern-pole').ok).toBe(true);
  talk(session, 'middle');
  expect(session.observe().sceneryMarks).toContain('lanterns-mid');
  talk(session, 'top');
  expect(session.observe().sceneryMarks).toContain('lanterns-tied');
  walkTo(session, 0.64, 0.01);
  expect(session.exec('interact cable-run').ok).toBe(true);
  talk(session, 'tape', 'ramp');
  expect(session.observe().sceneryMarks).toEqual(expect.arrayContaining(['cables-ramped', 'todo-gate']));
  walkTo(session, 0.665, 0.005);
  expect(session.exec('interact steward').ok).toBe(true);
  talk(session, 'party', 'sign');
  expect(session.observe().beat).toBe('dance_cleared');
  expect(session.observe().sceneryMarks).toContain('sign-flipped');

  walkTo(session, 0.86);
  expect(session.exec('interact shuttle').ok).toBe(true);
  talk(session, 'board');
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

function walkTo(session: RidgeConsoleSession, target: number, tolerance = 0.03): void {
  for (let i = 0; i < 80; i += 1) {
    const progress = session.observe().progress;
    const gap = Math.abs(progress - target);
    if (gap <= tolerance) return;
    const direction = progress < target ? 'right' : 'left';
    // Small steps near small props, so you stop on them rather than past them.
    session.exec(gap < 0.05 ? `go ${direction} 0.2` : `go ${direction}`);
  }
}

/** Advance through lines, picking each choice in order as menus come up. */
function talk(session: RidgeConsoleSession, ...choices: string[]): RidgeSessionEvent[] {
  const events = drainConversation(session);
  for (const choiceId of choices) {
    const result = session.exec(`choose ${choiceId}`);
    expect(result.ok, `choose ${choiceId}: ${result.message}`).toBe(true);
    events.push(...result.events, ...drainConversation(session));
  }
  return events;
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
