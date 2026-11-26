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
  OUT_OF_BOUNDS_OPENING_X
} from './content/outOfBoundsVoid';
import { BASEMENT_BREACH_ENTRY, OUT_OF_BOUNDS_STREET_ARRIVAL } from './content/outOfBoundsBreakout';
import { STREET_FIGHT_TOTAL_SMASHES, streetFightProgress, streetFightWave } from './content/outOfBoundsStreetFight';
import { SCREEN_DESTROYER_TOTAL_HITS, screenDestroyerProgress } from './content/outOfBoundsScreenDestroyer';
import { BASEMENT_WALK_BOUNDS, getBasementSpot } from './content/basementSpots';
import { getOverworldProgress, getSketchDetailLevel } from './overworldLogic';
import { GameConsoleSession } from './session';

const PROFILE_X = OVERWORLD_BUILDING_SPOTS.find((spot) => spot.id === 'profile')?.x ?? 0;

function createSession(options: Omit<ConstructorParameters<typeof GameConsoleSession>[0], 'dialogue'> = {}) {
  return new GameConsoleSession({
    dialogue: TEST_ROUTE_DIALOGUE_CATALOG,
    ...options
  });
}

describe('parseGameCommand', () => {
  it('parses shared and potassium verbs', () => {
    expect(parseGameCommand('go right 3')).toEqual({
      type: 'go',
      direction: 'right',
      steps: 3
    });
    expect(parseGameCommand('equip glasses')).toEqual({
      type: 'equip',
      itemId: 'glasses'
    });
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
    expect(result.events).toContainEqual({
      type: 'scene_entered',
      sceneId: 'ridge'
    });
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

    const unequipped = createSession({
      ownedItemIds: ['glasses'],
      equippedItemIds: []
    });
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
    const session = createSession({
      ownedItemIds: ['glasses'],
      equippedItemIds: ['glasses']
    });
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
    expect(soldered.events).toContainEqual({
      type: 'item_collected',
      itemId: 'circuit'
    });
    expect(session.observe().ownedItemIds).toContain('circuit');
  });

  it('raises the street sketch detail level as secrets pile up', () => {
    const base = { equippedItemIds: [], discoveredSecretIds: [] } as const;
    expect(getSketchDetailLevel({ ...base, ownedItemIds: [] })).toBe(0);
    expect(getSketchDetailLevel({ ...base, ownedItemIds: ['glasses'] })).toBe(1);
    expect(
      getSketchDetailLevel({
        ...base,
        ownedItemIds: ['glasses', 'copper-string', 'battery-cell']
      })
    ).toBe(2);
    expect(getSketchDetailLevel({ ...base, ownedItemIds: ['glasses', 'circuit'] })).toBe(3);
  });

  it('cycles corkboard notes and reports missing workbench parts', () => {
    const session = createSession({
      sceneId: 'basement',
      ownedItemIds: ['glasses']
    });
    session.exec('go right 3');
    const first = session.exec('interact corkboard');
    const second = session.exec('interact corkboard');
    expect(first.events).toContainEqual({
      type: 'thought',
      id: 'basement_corkboard',
      variant: 0
    });
    expect(second.events).toContainEqual({
      type: 'thought',
      id: 'basement_corkboard',
      variant: 1
    });

    session.exec('go right 16');
    const bench = session.exec('interact workbench');
    expect(bench.events).toContainEqual({
      type: 'thought',
      id: 'workbench_missing_parts',
      variant: 0
    });
    expect(bench.message).toContain('copper-string');
  });

  it('puts pocketed glasses back on at the basement computer before it boots', () => {
    const session = createSession({
      sceneId: 'basement',
      ownedItemIds: ['glasses'],
      equippedItemIds: []
    });
    session.exec('go right 8');
    expect(session.observe().nearby[0]).toMatchObject({
      id: 'computer',
      prompt: 'Put glasses on'
    });

    const squint = session.exec('interact computer');
    expect(squint.events).toEqual([
      { type: 'item_equipped', itemId: 'glasses' },
      { type: 'thought', id: 'basement_glasses_on' }
    ]);
    expect(session.observe().equippedItemIds).toContain('glasses');
    expect(session.observe().mode).toBe('basement');

    const boot = session.exec('interact computer');
    expect(boot.events).toContainEqual({
      type: 'overlay_opened',
      overlayId: 'games'
    });
  });

  it('starts Chick Magnet from the street chick only while glasses are off', () => {
    const bare = createSession();
    walkOverworldTo(bare, OVERWORLD_CHICK.x);
    const started = bare.exec('interact chick');
    expect(started.events).toContainEqual({
      type: 'scene_entered',
      sceneId: 'stampedeSketch'
    });
    expect(bare.observe().mode).toBe('overworld');

    const wearing = createSession({
      ownedItemIds: ['glasses'],
      equippedItemIds: ['glasses']
    });
    wearing.syncPlayerPosition(OVERWORLD_CHICK.x, OVERWORLD_CHICK.y);
    expect(wearing.observe().nearby.some((thing) => thing.id === 'chick')).toBe(false);

    const pocketed = createSession({
      ownedItemIds: ['glasses'],
      equippedItemIds: []
    });
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
    expect(session.observe().nearby[0]).toMatchObject({
      id: 'toolbox',
      kind: 'pickup'
    });

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
    expect(getOverworldProgress(session.observe())).toMatchObject({
      found: 0,
      total: 6
    });
    expect(session.observe().hobbies?.escape).toMatchObject({
      wayBack: 'blocked',
      barrierX: OUT_OF_BOUNDS_BARRIER_X,
      openingX: OUT_OF_BOUNDS_OPENING_X
    });

    // The floor is bare afterwards and gives nothing more.
    expect(session.observe().nearby[0]).toMatchObject({
      id: 'toolbox',
      kind: 'prop'
    });
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

  it('leaving the escape comes out onto the street in alarm, with the Hobbies room taped shut', () => {
    const session = escapedSession();
    expect(session.exec('leave').observation.mode).toBe('overworld');
    expect(session.observe().overworld?.alarm).not.toBeNull();
    const back = session.exec('interact hobbies');
    expect(back.message).toMatch(/taped shut/i);
    expect(back.events).toEqual([]);
    expect(session.observe().mode).toBe('overworld');
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
    expect(basement).toMatchObject({
      playerX: BASEMENT_BREACH_ENTRY.x,
      facing: 'left'
    });
    expect(basement?.escape).toMatchObject({
      ransacked: true,
      wayBack: 'blocked'
    });
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
        expect(session.exec('interact glasses').events).toContainEqual({
          type: 'item_collected',
          itemId: 'glasses'
        });
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
    expect(session.observe().overworld?.alarm).not.toBeNull();
  });

  it('leave from the escape basement also comes up at the hatch', () => {
    const session = escapedSession();
    throughOpening(session);
    session.exec('leave');
    expect(session.observe().overworld?.playerX).toBe(OUT_OF_BOUNDS_STREET_ARRIVAL.x);
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

describe('out of bounds street fight: the street in alarm (#163)', () => {
  function onTheStreet(options: { screenSmashes?: number } = {}) {
    const session = createSession({
      sceneId: 'basement',
      ownedItemIds: ['debugging-tools'],
      ...options
    });
    const up = session.exec('leave');
    return { session, up };
  }

  it('comes up into a manhunt: night, searchlights, every door taped shut', () => {
    const { session, up } = onTheStreet();
    expect(up.message).toMatch(/searchlights sweep the buildings/i);
    expect(session.observe().overworld?.alarm).toMatchObject({
      doors: 'taped shut'
    });
    expect(session.format()).toMatch(/alarm: doors taped shut/);
  });

  it('locks every street interaction: buildings, the hatch and the Hobbies room', () => {
    const { session } = onTheStreet();
    expect(session.observe().nearby).toEqual([]);
    expect(session.exec('interact').message).toMatch(/taped shut/i);
    expect(session.observe().mode).toBe('overworld');
    for (const x of [PROFILE_X, 2400]) {
      walkOverworldTo(session, x);
      const tried = session.exec('interact');
      expect(tried.events).toEqual([]);
      expect(tried.message).toMatch(/taped shut/i);
      expect(session.observe().mode).toBe('overworld');
    }
  });

  it('the evil chick confronts Danilo, and the first swing is on it', () => {
    const { session, up } = onTheStreet();
    expect(up.message).toMatch(/chick that always ran from you/i);
    expect(session.observe().overworld?.alarm?.fight).toMatchObject({
      phase: 'chick',
      enemiesLeft: 26
    });
    const first = session.exec('swing');
    expect(first.message).toMatch(/BONK/);
    expect(first.events).toEqual([{ type: 'screen_smashed', target: 'chick', smashes: 1 }]);
    expect(session.observe().overworld?.alarm?.fight).toMatchObject({
      phase: 'waves',
      wave: 1,
      leftInWave: 5
    });
  });

  it('raccoons come in waves; each smash adds a crack until the screen is badly cracked', () => {
    const { session } = onTheStreet();
    const waves: number[] = [];
    let cleared = false;
    for (let i = 0; i < STREET_FIGHT_TOTAL_SMASHES; i++) {
      const result = session.exec('swing');
      const fight = session.observe().overworld?.alarm?.fight;
      if (fight?.phase === 'waves' && !waves.includes(fight.wave)) waves.push(fight.wave);
      cleared ||= result.events.some((event) => event.type === 'street_fight_cleared');
    }
    expect(waves).toEqual([1, 2, 3]);
    expect(cleared).toBe(true);
    expect(session.observe().overworld?.alarm?.fight).toEqual({
      phase: 'cleared',
      wave: 0,
      leftInWave: 0,
      enemiesLeft: 0,
      screenCracks: STREET_FIGHT_TOTAL_SMASHES
    });
    expect(session.format()).toMatch(/fight: cleared enemies left=0 screen damage=26 cracks/);
    const after = session.exec('swing');
    expect(after.events).toEqual([{ type: 'screen_layer_hit', layer: 'header', hits: 1 }]);
    expect(after.message).toMatch(/header at the top of the page tears loose/);
  });

  it('resumes the fight from the cracks already on the screen', () => {
    const { session, up } = onTheStreet({ screenSmashes: 7 });
    expect(up.message).toMatch(/raccoons coming/i);
    expect(session.observe().overworld?.alarm?.fight).toMatchObject({
      phase: 'waves',
      wave: 2,
      leftInWave: 7
    });
  });

  it('has no hammer and no alarm outside the escape', () => {
    const session = createSession();
    expect(session.observe().overworld?.alarm).toBeNull();
    expect(session.exec('swing').ok).toBe(false);
    expect(parseGameCommand('smash')).toEqual({ type: 'swing' });
  });
});

describe('out of bounds screen destroyer: the page comes apart (#164)', () => {
  function afterTheFight(extraHits = 0) {
    const session = createSession({
      sceneId: 'basement',
      ownedItemIds: ['debugging-tools'],
      screenSmashes: STREET_FIGHT_TOTAL_SMASHES + extraHits
    });
    session.exec('leave');
    return session;
  }

  it('starts once the fight is won, with every layer still on the page', () => {
    const session = afterTheFight();
    expect(session.observe().overworld?.alarm?.destroyer).toMatchObject({
      hits: 0,
      breaking: 'header',
      remaining: ['header', 'labels', 'street', 'danilo'],
      blackout: false
    });
    expect(session.format()).toMatch(/screen: breaking=header \(0\/6\) layers left=header, labels, street, danilo/);
    expect(session.observe().hints).toContain('Type swing to keep smashing the page: the header goes next.');
  });

  it('has no destroyer while the fight is still on', () => {
    const session = afterTheFight(-3);
    expect(session.observe().overworld?.alarm?.destroyer).toBeNull();
    expect(session.format()).not.toMatch(/screen:/);
  });

  it('any smash counts, a pigeon or the bare glass, and every swing lands on the page', () => {
    const session = afterTheFight();
    expect(session.exec('swing pigeon').events).toEqual([{ type: 'screen_layer_hit', layer: 'header', hits: 1 }]);
    expect(session.exec('swing raccoon').events).toEqual([{ type: 'screen_layer_hit', layer: 'header', hits: 2 }]);
    expect(session.exec('smash').events).toEqual([{ type: 'screen_layer_hit', layer: 'header', hits: 3 }]);
  });

  it('drives the headless console to the end: layer after layer, Danilo last, then black', () => {
    const session = afterTheFight();
    const broken: string[] = [];
    let blackout = 0;
    for (let i = 0; i < SCREEN_DESTROYER_TOTAL_HITS; i++) {
      const result = session.exec('swing');
      expect(result.ok).toBe(true);
      for (const event of result.events) {
        if (event.type === 'screen_layer_broken') broken.push(event.layer);
        if (event.type === 'screen_blackout') blackout += 1;
      }
      if (i < SCREEN_DESTROYER_TOTAL_HITS - 1)
        expect(session.observe().overworld?.alarm?.destroyer?.blackout).toBe(false);
    }
    expect(broken).toEqual(['header', 'labels', 'street', 'danilo']);
    expect(blackout).toBe(1);
    expect(session.observe().overworld?.alarm?.destroyer).toMatchObject({
      remaining: [],
      breaking: null,
      blackout: true
    });
    expect(session.format()).toMatch(/screen: black — every layer gone, unplugged/);
    expect(session.observe().hints[0]).toMatch(/Wake up opens the real world/);

    const more = session.exec('swing');
    expect(more.ok).toBe(false);
    expect(more.events).toEqual([]);
    expect(more.message).toMatch(/nothing left to hit/i);
  });

  it('reports which layers remain part-way through', () => {
    const session = afterTheFight(6 + 6 + 3);
    expect(session.format()).toMatch(/screen: breaking=street \(3\/10\) layers left=street, danilo/);
  });
});

describe('screenDestroyerProgress', () => {
  it('breaks the layers in order, outside in, each at its own pace', () => {
    expect(screenDestroyerProgress(0).breaking).toBe('header');
    expect(screenDestroyerProgress(3).layers[0]).toMatchObject({
      id: 'header',
      hitsTaken: 3,
      damage: 0.5,
      gone: false
    });
    expect(screenDestroyerProgress(6)).toMatchObject({ breaking: 'labels', remaining: ['labels', 'street', 'danilo'] });
    expect(screenDestroyerProgress(12)).toMatchObject({ breaking: 'street', remaining: ['street', 'danilo'] });
    expect(screenDestroyerProgress(22)).toMatchObject({ breaking: 'danilo', remaining: ['danilo'] });
    expect(screenDestroyerProgress(27)).toMatchObject({ breaking: 'danilo', blackout: false });
  });

  it('ends in black once every layer is gone, and never past it', () => {
    expect(SCREEN_DESTROYER_TOTAL_HITS).toBe(28);
    expect(screenDestroyerProgress(28)).toMatchObject({ breaking: null, remaining: [], blackout: true, hits: 28 });
    expect(screenDestroyerProgress(99)).toMatchObject({ blackout: true, hits: 28 });
    expect(screenDestroyerProgress(-4)).toMatchObject({ hits: 0, blackout: false });
    expect(screenDestroyerProgress(28).layers.every((layer) => layer.gone && layer.damage === 1)).toBe(true);
  });
});

describe('streetFightProgress', () => {
  it('walks chick, then raccoon waves of 5, 8 and 12', () => {
    expect(streetFightProgress(0)).toMatchObject({ phase: 'chick', enemiesLeft: 26 });
    expect(streetFightProgress(1)).toMatchObject({ phase: 'waves', wave: 1, leftInWave: 5 });
    expect(streetFightProgress(5)).toMatchObject({ phase: 'waves', wave: 1, leftInWave: 1 });
    expect(streetFightProgress(6)).toMatchObject({ phase: 'waves', wave: 2, leftInWave: 8 });
    expect(streetFightProgress(14)).toMatchObject({ phase: 'waves', wave: 3, leftInWave: 12 });
    expect(streetFightProgress(25)).toMatchObject({ phase: 'waves', wave: 3, leftInWave: 1 });
    expect(streetFightProgress(26)).toMatchObject({ phase: 'cleared', screenCracks: 26 });
    expect(streetFightProgress(99)).toMatchObject({ phase: 'cleared', screenCracks: 26 });
  });
});

describe('street fight waves: raccoon hordes on the ground, pigeons overhead', () => {
  it('sends the raccoons left in a wave, and more pigeons as the waves go on', () => {
    expect(streetFightWave(1, 5)).toEqual({ raccoons: 5, pigeons: 1 });
    expect(streetFightWave(2, 3)).toEqual({ raccoons: 3, pigeons: 2 });
    expect(streetFightWave(3, 12)).toEqual({ raccoons: 12, pigeons: 3 });
    expect(streetFightWave(9, 2)).toEqual({ raccoons: 0, pigeons: 0 });
  });

  it('lets the live scene say what the hammer hit; a pigeon never counts', () => {
    const session = createSession({ sceneId: 'basement', ownedItemIds: ['debugging-tools'], screenSmashes: 4 });
    session.exec('leave');
    const pigeon = session.exec('swing pigeon');
    expect(pigeon.message).toMatch(/THWACK: a pigeon/);
    expect(pigeon.events).toEqual([]);
    expect(session.getState().screenSmashes).toBe(4);
    const hit = session.exec('swing raccoon');
    expect(hit.message).toMatch(/WHACK: a raccoon/);
    expect(hit.events).toEqual([{ type: 'screen_smashed', target: 'raccoon', smashes: 5 }]);
    expect(parseGameCommand('smash pigeon')).toEqual({ type: 'swing', target: 'pigeon' });
    expect(parseGameCommand('swing cat')).toEqual({ type: 'unknown', raw: 'swing cat' });
  });

  it('the chick is always the chick, even if the scene says pigeon', () => {
    const session = createSession({ sceneId: 'basement', ownedItemIds: ['debugging-tools'] });
    session.exec('leave');
    expect(session.exec('swing pigeon').events).toEqual([{ type: 'screen_smashed', target: 'chick', smashes: 1 }]);
  });
});
