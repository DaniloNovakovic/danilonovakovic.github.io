import { describe, expect, it } from 'vitest';
import { TEST_ROUTE_DIALOGUE_CATALOG } from '../ridge/content/testRouteCatalog';
import { parseGameCommand, parseGameScript } from './commands';
import {
  OVERWORLD_BANANA_PEEL,
  OVERWORLD_BASEMENT_HOLE,
  OVERWORLD_BUILDING_SPOTS,
  OVERWORLD_CHICK
} from './content/overworldSpots';
import { HOBBIES_PLAYER_MAX_X, HOBBIES_PLAYER_MIN_X, HOBBIES_RIGHT_WALL_X } from './content/hobbiesSpots';
import {
  OUT_OF_BOUNDS_BARRIER_X,
  OUT_OF_BOUNDS_ESCAPE_MAX_X,
  OUT_OF_BOUNDS_ESCAPE_MIN_X,
  OUT_OF_BOUNDS_ESCAPE_START_X,
  OUT_OF_BOUNDS_OPENING_X
} from './content/outOfBoundsVoid';
import { BASEMENT_BREACH_ENTRY, OUT_OF_BOUNDS_STREET_ARRIVAL } from './content/outOfBoundsBreakout';
import { BASEMENT_WALK_BOUNDS, getBasementSpot } from './content/basementSpots';
import { getOverworldProgress, getSketchDetailLevel } from './overworldLogic';
import { GameConsoleSession } from './session';

const PROFILE_X = OVERWORLD_BUILDING_SPOTS.find((spot) => spot.id === 'profile')?.x ?? 0;

function createSession(options: Omit<ConstructorParameters<typeof GameConsoleSession>[0], 'dialogue'> = {}) {
  return new GameConsoleSession({ dialogue: TEST_ROUTE_DIALOGUE_CATALOG, ...options });
}

describe('parseGameCommand', () => {
  it('parses shared and potassium verbs', () => {
    expect(parseGameCommand('go right 3')).toEqual({
      type: 'go',
      direction: 'right',
      steps: 3
    });
    expect(parseGameCommand('equip glasses')).toEqual({ type: 'equip', itemId: 'glasses' });
    expect(parseGameCommand('fight')).toEqual({ type: 'fight' });
    expect(parseGameScript('look; right 2; interact').map((c) => c.type)).toEqual(['look', 'go', 'interact']);
  });
});

describe('GameConsoleSession full secret route', () => {
  it('walks Overworld → Basement glasses → Potassium Circuit → CRT → Ridge', () => {
    const session = createSession();

    // Basement hatch is a few steps right of spawn.
    expect(session.exec('go right 4').ok).toBe(true);
    expect(session.exec('interact').ok).toBe(true);
    expect(session.observe().mode).toBe('basement');

    // Glasses at x=610.
    expect(session.exec('go right 14').ok).toBe(true);
    expect(session.exec('interact glasses').ok).toBe(true);
    expect(session.observe().ownedItemIds).toContain('glasses');
    expect(session.observe().equippedItemIds).toContain('glasses');

    expect(session.exec('close').ok).toBe(true);
    expect(session.observe().mode).toBe('overworld');

    walkOverworldTo(session, OVERWORLD_BANANA_PEEL.x);
    expect(session.exec('interact').ok).toBe(true);
    expect(session.observe().discoveredSecretIds).toContain('banana-peel-clue');
    expect(session.exec('interact').ok).toBe(true);
    expect(session.observe().mode).toBe('potassium');

    // Discrete campaign → Circuit.
    expect(session.exec('start').ok).toBe(true);
    expect(session.exec('fight').ok).toBe(true); // wave 1 → 2
    expect(session.exec('fight').ok).toBe(true); // wave 2 → draft
    expect(session.exec('draft 1').ok).toBe(true); // → wave 3
    expect(session.exec('fight').ok).toBe(true); // → 4
    expect(session.exec('fight').ok).toBe(true); // → draft
    expect(session.exec('draft 1').ok).toBe(true); // → 5
    expect(session.exec('fight').ok).toBe(true); // win
    expect(session.observe().ownedItemIds).toContain('circuit');
    expect(session.observe().mode).toBe('overworld');

    // CRT at x=1650.
    walkOverworldTo(session, 1650);
    expect(session.exec('interact').ok).toBe(true);
    expect(session.observe().mode).toBe('ridge');
    expect(session.exec('look').ok).toBe(true);
    expect(session.observe().ridge).not.toBeNull();
  });

  it('opens a portfolio overlay from a street building and closes it', () => {
    const session = createSession();
    walkOverworldTo(session, PROFILE_X);
    expect(session.exec('interact profile').ok).toBe(true);
    expect(session.observe().mode).toBe('overlay');
    expect(session.observe().overlay?.id).toBe('profile');
    expect(session.exec('close').ok).toBe(true);
    expect(session.observe().mode).toBe('overworld');
  });

  it('syncs Phaser position and cancels a pending banana peel when walking away', () => {
    const session = new GameConsoleSession({
      dialogue: TEST_ROUTE_DIALOGUE_CATALOG,
      ownedItemIds: ['glasses'],
      equippedItemIds: ['glasses']
    });
    session.syncPlayerPosition(OVERWORLD_BANANA_PEEL.x, OVERWORLD_BANANA_PEEL.y);
    expect(session.exec('interact').events.some((e) => e.type === 'secret_discovered')).toBe(true);
    expect(session.getState().overworld.bananaFirstPeelPending).toBe(true);

    const cancelled = session.syncPlayerPosition(900, 535);
    expect(cancelled.events).toContainEqual({ type: 'banana_peel_cancelled' });
    expect(session.getState().overworld.bananaFirstPeelPending).toBe(false);
  });

  it('inserts Circuit at the CRT after hydrate', () => {
    const session = new GameConsoleSession({
      dialogue: TEST_ROUTE_DIALOGUE_CATALOG,
      ownedItemIds: ['circuit'],
      equippedItemIds: []
    });
    session.syncPlayerPosition(1650, 520);
    const result = session.exec('interact');
    expect(result.events).toContainEqual({ type: 'scene_entered', sceneId: 'ridge' });
    expect(session.observe().mode).toBe('ridge');
  });

  it('returns to Overworld after Ridge dedication / route reset', () => {
    const session = new GameConsoleSession({
      dialogue: TEST_ROUTE_DIALOGUE_CATALOG,
      ownedItemIds: ['circuit'],
      sceneId: 'ridge'
    });
    expect(session.exec('warp relay').ok).toBe(true);
    session.exec('go right 10');
    expect(session.exec('interact').ok).toBe(true);
    for (let i = 0; i < 20; i += 1) {
      if (session.observe().ridge?.conversation?.awaitingChoice) break;
      if (session.observe().mode !== 'ridge') break;
      session.exec('advance');
    }
    expect(session.exec('choose let-song-end').ok).toBe(true);
    for (let i = 0; i < 20; i += 1) {
      if (session.observe().mode !== 'ridge') break;
      session.exec('advance');
    }
    expect(session.observe().mode).toBe('overworld');
    expect(session.observe().ownedItemIds).toContain('circuit');
  });

  it('reads the spawn signpost with a hint that follows the secret chain', () => {
    const fresh = createSession();
    expect(fresh.observe().nearby[0]?.id).toBe('signpost');
    expect(fresh.exec('interact signpost').events).toContainEqual({
      type: 'signpost_read',
      stage: 'find-glasses',
      found: 0,
      total: 6
    });

    const unequipped = createSession({ ownedItemIds: ['glasses'], equippedItemIds: [] });
    expect(unequipped.exec('interact signpost').events).toContainEqual(
      expect.objectContaining({ stage: 'wear-glasses', found: 1 })
    );

    const peeled = createSession({
      ownedItemIds: ['glasses'],
      equippedItemIds: ['glasses'],
      discoveredSecretIds: ['banana-peel-clue']
    });
    expect(peeled.exec('interact signpost').events).toContainEqual(
      expect.objectContaining({ stage: 'win-circuit', found: 2 })
    );

    const done = createSession({
      ownedItemIds: ['glasses', 'circuit'],
      discoveredSecretIds: ['banana-peel-clue']
    });
    const doneRead = done.exec('interact signpost');
    expect(doneRead.events).toContainEqual(expect.objectContaining({ stage: 'use-crt', found: 3 }));
    expect(doneRead.message).toContain('3/6');
    expect(done.observe().mode).toBe('overworld');
  });

  it('builds the Circuit from hobby parts and solders it at the basement workbench', () => {
    const session = createSession({ ownedItemIds: ['glasses'], equippedItemIds: ['glasses'] });
    walkOverworldTo(session, 2400);
    session.exec('interact hobbies');
    expect(session.observe().mode).toBe('hobbies');

    const stations = [
      { x: 440, part: 'copper-string' },
      { x: 600, part: 'battery-cell' },
      { x: 760, part: 'clock-crystal' }
    ] as const;
    for (const station of stations) {
      walkHobbiesTo(session, station.x);
      session.exec('interact');
      expect(session.observe().mode).toBe('overlay');
      expect(session.exec('perform').events).toContainEqual({
        type: 'item_collected',
        itemId: station.part
      });
      session.exec('close');
    }
    expect(session.exec('perform').ok).toBe(false);

    walkHobbiesTo(session, 100);
    session.exec('interact exit');
    walkOverworldTo(session, 60);
    expect(session.exec('interact signpost').events).toContainEqual(
      expect.objectContaining({ stage: 'solder-circuit', found: 4 })
    );
    walkOverworldTo(session, OVERWORLD_BASEMENT_HOLE.x);
    session.exec('interact hatch');
    expect(session.observe().mode).toBe('basement');

    session.exec('go right 19');
    expect(session.observe().nearby[0]?.id).toBe('workbench');
    const soldered = session.exec('interact workbench');
    expect(soldered.events).toContainEqual({ type: 'item_collected', itemId: 'circuit' });
    expect(session.observe().ownedItemIds).toContain('circuit');
  });

  it('raises the street sketch detail level as secrets pile up', () => {
    const base = { equippedItemIds: [], discoveredSecretIds: [] } as const;
    expect(getSketchDetailLevel({ ...base, ownedItemIds: [] })).toBe(0);
    expect(getSketchDetailLevel({ ...base, ownedItemIds: ['glasses'] })).toBe(1);
    expect(getSketchDetailLevel({ ...base, ownedItemIds: ['glasses', 'copper-string', 'battery-cell'] })).toBe(2);
    expect(getSketchDetailLevel({ ...base, ownedItemIds: ['glasses', 'circuit'] })).toBe(3);
  });

  it('cycles corkboard notes and reports missing workbench parts', () => {
    const session = createSession({ sceneId: 'basement', ownedItemIds: ['glasses'] });
    session.exec('go right 3');
    const first = session.exec('interact corkboard');
    const second = session.exec('interact corkboard');
    expect(first.events).toContainEqual({ type: 'thought', id: 'basement_corkboard', variant: 0 });
    expect(second.events).toContainEqual({ type: 'thought', id: 'basement_corkboard', variant: 1 });

    session.exec('go right 16');
    const bench = session.exec('interact workbench');
    expect(bench.events).toContainEqual({ type: 'thought', id: 'workbench_missing_parts', variant: 0 });
    expect(bench.message).toContain('copper-string');
  });

  it('puts pocketed glasses back on at the basement computer before it boots', () => {
    const session = createSession({ sceneId: 'basement', ownedItemIds: ['glasses'], equippedItemIds: [] });
    session.exec('go right 8');
    expect(session.observe().nearby[0]).toMatchObject({ id: 'computer', prompt: 'Put glasses on' });

    const squint = session.exec('interact computer');
    expect(squint.events).toEqual([
      { type: 'item_equipped', itemId: 'glasses' },
      { type: 'thought', id: 'basement_glasses_on' }
    ]);
    expect(session.observe().equippedItemIds).toContain('glasses');
    expect(session.observe().mode).toBe('basement');

    const boot = session.exec('interact computer');
    expect(boot.events).toContainEqual({ type: 'overlay_opened', overlayId: 'games' });
  });

  it('starts Chick Magnet from the street chick only while glasses are off', () => {
    const bare = createSession();
    walkOverworldTo(bare, OVERWORLD_CHICK.x);
    const started = bare.exec('interact chick');
    expect(started.events).toContainEqual({ type: 'scene_entered', sceneId: 'stampedeSketch' });
    expect(bare.observe().mode).toBe('overworld');

    const wearing = createSession({ ownedItemIds: ['glasses'], equippedItemIds: ['glasses'] });
    wearing.syncPlayerPosition(OVERWORLD_CHICK.x, OVERWORLD_CHICK.y);
    expect(wearing.observe().nearby.some((thing) => thing.id === 'chick')).toBe(false);

    const pocketed = createSession({ ownedItemIds: ['glasses'], equippedItemIds: [] });
    pocketed.syncPlayerPosition(OVERWORLD_CHICK.x, OVERWORLD_CHICK.y);
    expect(pocketed.observe().nearby[0]?.id).toBe('chick');

    wearing.syncInventory(['glasses'], []);
    expect(wearing.observe().nearby.some((thing) => thing.id === 'chick')).toBe(true);
  });

  it('commits banana peel warp for the live Overworld typewriter path', () => {
    const session = new GameConsoleSession({
      dialogue: TEST_ROUTE_DIALOGUE_CATALOG,
      ownedItemIds: ['glasses'],
      equippedItemIds: ['glasses'],
      discoveredSecretIds: ['banana-peel-clue']
    });
    session.syncPlayerPosition(OVERWORLD_BANANA_PEEL.x, OVERWORLD_BANANA_PEEL.y);
    const result = session.commitBananaPeelWarp();
    expect(result.ok).toBe(true);
    expect(session.observe().mode).toBe('potassium');
  });
});

function walkHobbiesTo(session: GameConsoleSession, targetX: number): void {
  for (let i = 0; i < 40; i += 1) {
    const x = session.observe().hobbies?.playerX ?? 0;
    if (Math.abs(x - targetX) <= 20) return;
    session.exec(`go ${x < targetX ? 'right' : 'left'} 1`);
  }
}

function walkOverworldTo(session: GameConsoleSession, targetX: number): void {
  for (let i = 0; i < 80; i += 1) {
    const x = session.observe().overworld?.playerX ?? 0;
    if (Math.abs(x - targetX) < 50) return;
    const direction = x < targetX ? 'right' : 'left';
    session.exec(`go ${direction} 2`);
  }
}

describe('hobbies room walls', () => {
  function enterHobbies() {
    const session = createSession();
    walkOverworldTo(session, 2400);
    session.exec('interact hobbies');
    expect(session.observe().mode).toBe('hobbies');
    return session;
  }

  it('stops the player flush against the drawn right wall', () => {
    const session = enterHobbies();
    session.exec('go right 50');
    expect(session.observe().hobbies?.playerX).toBe(HOBBIES_PLAYER_MAX_X);
    expect(HOBBIES_PLAYER_MAX_X).toBeLessThan(HOBBIES_RIGHT_WALL_X);
  });
});

describe('out of bounds: past the Hobbies left wall', () => {
  function enterHobbies() {
    const session = createSession();
    walkOverworldTo(session, 2400);
    session.exec('interact hobbies');
    return session;
  }

  /** At the void's end with the Debugging Tools taken: the simulation is broken. */
  function escapedSession() {
    const session = enterHobbies();
    session.exec('go left 200');
    session.exec('interact toolbox');
    session.exec('confirm');
    return session;
  }

  it('walks straight through the solid-looking left wall onto blank paper', () => {
    const session = enterHobbies();
    // Enter at x=200; ten 40px steps left: no stop at the wall (x=50), out to x=-200.
    const step = session.exec('go left 10');
    expect(step.message).toMatch(/through the wall/i);
    const hobbies = session.observe().hobbies;
    expect(hobbies?.playerX).toBe(-200);
    expect(hobbies?.void?.stage).toBe('past-the-wall');
    expect(hobbies?.void?.sights).toEqual([]);

    // And straight back in: ten steps right lands at x=200.
    session.exec('go right 10');
    expect(session.observe().hobbies?.void).toBeNull();
    expect(session.observe().hobbies?.playerX).toBe(200);
  });

  it('stays blank like a bug, shows a few marks, ends at the toolbox, and walks back into the room', () => {
    const session = enterHobbies();
    const stages: string[] = [];
    for (let i = 0; i < 200; i += 1) {
      session.exec('go left 1');
      const stage = session.observe().hobbies?.void?.stage;
      if (stage && stages[stages.length - 1] !== stage) stages.push(stage);
    }
    expect(stages).toEqual(['past-the-wall', 'margin-notes', 'room-end']);

    const atEnd = session.observe();
    expect(atEnd.hobbies?.playerX).toBe(HOBBIES_PLAYER_MIN_X);
    expect(atEnd.nearby[0]?.id).toBe('toolbox');
    expect(session.exec('look').message).toBeTruthy();
    expect(session.observe().mode).toBe('hobbies');

    session.exec('go right 200');
    expect(session.observe().hobbies?.void).toBeNull();
    expect(session.observe().hobbies?.playerX).toBe(HOBBIES_PLAYER_MAX_X);
  });

  it('asks "point of no return?" before the toolbox, and backing out changes nothing', () => {
    const session = enterHobbies();
    session.exec('go left 200');
    expect(session.observe().nearby[0]).toMatchObject({ id: 'toolbox', kind: 'pickup' });

    const warning = session.exec('interact toolbox');
    expect(warning.message).toMatch(/DEBUGGING TOOLS/);
    expect(warning.message).toMatch(/point of no return/i);
    expect(warning.events).toEqual([{ type: 'point_of_no_return_shown' }]);
    expect(session.observe().ownedItemIds).not.toContain('debugging-tools');
    expect(session.format()).toMatch(/confirm or decline/);

    const declined = session.exec('decline');
    expect(declined.message).toMatch(/leave the toolbox/i);
    expect(session.observe().ownedItemIds).not.toContain('debugging-tools');
    expect(session.observe().hobbies?.escape).toBeNull();
    // Nothing pending any more; walking away also backs out.
    expect(session.exec('confirm').ok).toBe(false);
    session.exec('interact toolbox');
    session.exec('go right 1');
    expect(session.exec('confirm').ok).toBe(false);

    session.exec('go right 200');
    expect(session.observe().hobbies?.void).toBeNull();
  });

  it('confirming takes the Debugging Tools, sets off the alert and shuts the way back', () => {
    const session = enterHobbies();
    session.exec('go left 200');
    session.exec('interact toolbox');
    const pickup = session.exec('confirm');
    expect(pickup.message).toMatch(/hammer/i);
    expect(pickup.message).toContain('OUT_OF_BOUNDS');
    expect(pickup.events).toEqual([
      { type: 'item_collected', itemId: 'debugging-tools' },
      { type: 'simulation_broken' }
    ]);
    expect(session.format()).toMatch(/inventory: .*debugging-tools/);
    expect(getOverworldProgress(session.observe())).toMatchObject({ found: 0, total: 6 });
    expect(session.observe().hobbies?.escape).toMatchObject({
      wayBack: 'blocked',
      barrierX: OUT_OF_BOUNDS_BARRIER_X,
      openingX: OUT_OF_BOUNDS_OPENING_X
    });

    // The floor is bare afterwards and gives nothing more.
    expect(session.observe().nearby[0]).toMatchObject({ id: 'toolbox', kind: 'prop' });
    const again = session.exec('interact toolbox');
    expect(again.message).toMatch(/bare floor/i);
    expect(again.events).toEqual([]);
  });

  it('blocks the way back right at the barrier, with one thought per visit', () => {
    const session = escapedSession();
    const first = session.exec('go right 200');
    expect(first.message).toMatch(/blocks the way back/i);
    expect(first.message).toContain('Danilo: "It scribbled itself shut. No going back."');
    expect(session.observe().hobbies?.playerX).toBe(OUT_OF_BOUNDS_ESCAPE_MAX_X);
    expect(session.observe().hobbies?.void).not.toBeNull();
    expect(session.observe().nearby.map((thing) => thing.id)).not.toContain('exit');

    const second = session.exec('go right 5');
    expect(second.message).toMatch(/blocks the way back/i);
    expect(second.message).not.toMatch(/Danilo:/);
    expect(session.format()).toMatch(/way back blocked/);
  });

  it('lets the page continue left past where the toolbox lay, to the opening', () => {
    const session = escapedSession();
    // Every step short of the opening itself (stepping into it leads on, see #162).
    const startX = session.observe().hobbies?.playerX ?? 0;
    const walk = session.exec(`go left ${Math.ceil((startX - OUT_OF_BOUNDS_OPENING_X) / 40) - 1}`);
    expect(walk.message).toContain('Danilo: "The page keeps going. Left, then."');
    expect(session.observe().mode).toBe('hobbies');
    expect(session.observe().hobbies?.playerX).toBeGreaterThan(OUT_OF_BOUNDS_OPENING_X);
    expect(OUT_OF_BOUNDS_ESCAPE_MIN_X).toBeLessThan(OUT_OF_BOUNDS_OPENING_X);
    expect(session.observe().hobbies?.void?.stage).toBe('beyond');
  });

  it('keeps the escape when leaving and coming back in the same session', () => {
    const session = escapedSession();
    expect(session.exec('leave').observation.mode).toBe('overworld');
    const back = session.exec('interact hobbies');
    expect(back.message).toMatch(/still scribbled shut/);
    const hobbies = session.observe().hobbies;
    expect(hobbies?.playerX).toBe(OUT_OF_BOUNDS_ESCAPE_START_X);
    expect(hobbies?.escape?.wayBack).toBe('blocked');
    // The walk-in thoughts are long past; nothing fires on arrival.
    expect(session.exec('go left 1').message).not.toMatch(/Danilo:/);
    session.exec('go right 200');
    expect(session.observe().hobbies?.playerX).toBe(OUT_OF_BOUNDS_ESCAPE_MAX_X);
  });

  it('can cheat in the Debugging Tools', () => {
    const session = createSession();
    expect(session.exec('cheat give debugging-tools').events).toContainEqual({
      type: 'item_collected',
      itemId: 'debugging-tools'
    });
  });

  it('describes the unfinished page in the headless look text', () => {
    const session = enterHobbies();
    expect(session.format()).not.toMatch(/edge of the page/i);

    session.exec('go left 10');
    const justOut = session.format();
    expect(justOut).toMatch(/nothing is drawn/i);
    expect(justOut).not.toMatch(/you notice/i);
    expect(justOut).toMatch(/walk right .*room/i);

    // Still blank ~1500px out: the long walk is carried by Danilo's thoughts.
    session.exec('go left 30');
    expect(session.format()).not.toMatch(/you notice/i);

    // ~2650px out, the first deliberate mark shows it isn't just a bug.
    session.exec('go left 30');
    const middle = session.format();
    expect(middle).toMatch(/on purpose/i);
    expect(middle).toContain('TODO: fix left wall collision');

    session.exec('go left 200');
    const end = session.format();
    expect(end).not.toMatch(/escape:/);
    expect(end).toContain('ROOM_END');
    expect(end).toMatch(/toolbox/i);
  });

  // Few and far apart: the walk should mostly be quiet.
  const THOUGHTS = [
    '...did I just walk through the wall?',
    '...this wasn’t finished.',
    'Wait. There’s something up ahead.'
  ];

  function thoughtsWhileWalking(session: GameConsoleSession, direction: 'left' | 'right', steps: number): string[] {
    const heard: string[] = [];
    for (let i = 0; i < steps; i += 1) {
      const message = session.exec(`go ${direction} 1`).message;
      for (const match of message.matchAll(/Danilo: "([^"]+)"/g)) heard.push(match[1] ?? '');
    }
    return heard;
  }

  it('lets Danilo think out loud by distance, once per line per visit', () => {
    const session = enterHobbies();
    expect(thoughtsWhileWalking(session, 'left', 200)).toEqual(THOUGHTS);

    // Pacing back and forth in the same visit repeats nothing.
    thoughtsWhileWalking(session, 'right', 200);
    expect(thoughtsWhileWalking(session, 'left', 200)).toEqual([]);

    // A fresh visit hears them again.
    session.exec('leave');
    session.exec('interact hobbies');
    expect(thoughtsWhileWalking(session, 'left', 200)).toEqual(THOUGHTS);
  });
});

describe('out of bounds breakout: through the ransacked basement (#162)', () => {
  function escapedSession() {
    const session = createSession();
    walkOverworldTo(session, 2400);
    session.exec('interact hobbies');
    session.exec('go left 200');
    session.exec('interact toolbox');
    session.exec('confirm');
    return session;
  }

  function throughOpening(session: GameConsoleSession) {
    return session.exec('go left 200');
  }

  it('walks through the torn opening into the basement at its right wall', () => {
    const session = escapedSession();
    const through = throughOpening(session);
    expect(through.message).toMatch(/right wall of your own basement/i);
    expect(through.message).toContain('Danilo: "...my basement? Someone’s been through here."');
    expect(through.events).toEqual([{ type: 'scene_entered', sceneId: 'basement' }]);
    const basement = session.observe().basement;
    expect(session.observe().mode).toBe('basement');
    expect(basement).toMatchObject({ playerX: BASEMENT_BREACH_ENTRY.x, facing: 'left' });
    expect(basement?.escape).toMatchObject({ ransacked: true, wayBack: 'blocked' });
    expect(session.format()).toMatch(/escape: ransacked, way back blocked/);
    expect(session.format()).toMatch(/WANTED/);
  });

  it('keeps every station where it was, reachable as before', () => {
    const session = escapedSession();
    throughOpening(session);
    for (const id of ['shelf', 'workbench', 'glasses', 'computer', 'corkboard'] as const) {
      const target = getBasementSpot(id).x;
      while ((session.observe().basement?.playerX ?? 0) - target > 30) session.exec('go left 1');
      expect(session.observe().nearby.map((thing) => thing.id)).toContain(id);
      if (id === 'glasses') {
        expect(session.exec('interact glasses').events).toContainEqual({ type: 'item_collected', itemId: 'glasses' });
      }
    }
    expect(session.exec('interact corkboard').ok).toBe(true);
  });

  it('keeps the breach shut: no way back into the void', () => {
    const session = escapedSession();
    throughOpening(session);
    const first = session.exec('go right 5');
    expect(first.message).toMatch(/scribbled shut/i);
    expect(first.message).toContain('Danilo: "Shut behind me too. Up the ladder, then."');
    expect(session.observe().basement?.playerX).toBe(BASEMENT_WALK_BOUNDS.maxX);
    expect(session.observe().mode).toBe('basement');
    expect(session.exec('go right 5').message).not.toMatch(/Danilo:/);
  });

  it('climbs the exit ladder out onto the street at the hatch', () => {
    const session = escapedSession();
    throughOpening(session);
    session.exec('go left 30');
    expect(session.observe().nearby[0]?.id).toBe('exit');
    const up = session.exec('interact exit');
    expect(up.message).toMatch(/through the hatch, onto the street/i);
    expect(up.events).toEqual([{ type: 'scene_returned', sceneId: 'overworld' }]);
    expect(session.observe().mode).toBe('overworld');
    expect(session.observe().overworld?.playerX).toBe(OUT_OF_BOUNDS_STREET_ARRIVAL.x);
    expect(session.observe().nearby.map((thing) => thing.id)).toContain(OVERWORLD_BASEMENT_HOLE.id);
  });

  it('leave from the escape basement also comes up at the hatch', () => {
    const session = escapedSession();
    throughOpening(session);
    session.exec('leave');
    expect(session.observe().overworld?.playerX).toBe(OUT_OF_BOUNDS_STREET_ARRIVAL.x);
  });

  it('a later Hobbies visit starts back inside the barrier, not in the opening', () => {
    const session = escapedSession();
    throughOpening(session);
    session.exec('leave');
    walkOverworldTo(session, 2400);
    session.exec('interact hobbies');
    expect(session.observe().mode).toBe('hobbies');
    expect(session.observe().hobbies?.playerX).toBe(OUT_OF_BOUNDS_ESCAPE_START_X);
  });

  it('leaves the basement as it always was outside the escape', () => {
    const session = createSession({ sceneId: 'basement' });
    expect(session.observe().basement?.escape).toBeNull();
    expect(session.format()).not.toMatch(/ransacked/);
    session.exec('go right 50');
    expect(session.exec('go right 1').message).not.toMatch(/scribbled shut/);
    session.exec('go left 50');
    const up = session.exec('interact exit');
    expect(up.message).toBe('You climb back to the street.');
  });
});
