import { describe, expect, it } from 'vitest';
import { TEST_ROUTE_DIALOGUE_CATALOG } from '../ridge/content/testRouteCatalog';
import { parseGameCommand, parseGameScript } from './commands';
import {
  OVERWORLD_BANANA_PEEL,
  OVERWORLD_BASEMENT_HOLE,
  OVERWORLD_BUILDING_SPOTS,
  OVERWORLD_CHICK
} from './content/overworldSpots';
import { getSketchDetailLevel } from './overworldLogic';
import { GameConsoleSession } from './session';

const PROFILE_X = OVERWORLD_BUILDING_SPOTS.find((spot) => spot.id === 'profile')?.x ?? 0;

function createSession(
  options: Omit<ConstructorParameters<typeof GameConsoleSession>[0], 'dialogue'> = {}
) {
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
    expect(parseGameScript('look; right 2; interact').map((c) => c.type)).toEqual([
      'look',
      'go',
      'interact'
    ]);
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
    expect(
      getSketchDetailLevel({ ...base, ownedItemIds: ['glasses', 'copper-string', 'battery-cell'] })
    ).toBe(2);
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
