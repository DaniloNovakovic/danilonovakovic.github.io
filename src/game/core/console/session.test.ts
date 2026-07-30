import { describe, expect, it } from 'vitest';
import { TEST_BRIDGE_DIALOGUE_CATALOG } from '../ridge/content/testBridgeCatalog';
import { parseGameCommand, parseGameScript } from './commands';
import { GameConsoleSession } from './session';

function createSession() {
  return new GameConsoleSession({ dialogue: TEST_BRIDGE_DIALOGUE_CATALOG });
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

    // Basement hatch is near x=230; spawn at 100 → a few steps right.
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

    // Peel at x=650.
    walkOverworldTo(session, 650);
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
    walkOverworldTo(session, 400);
    expect(session.exec('interact profile').ok).toBe(true);
    expect(session.observe().mode).toBe('overlay');
    expect(session.observe().overlay?.id).toBe('profile');
    expect(session.exec('close').ok).toBe(true);
    expect(session.observe().mode).toBe('overworld');
  });

  it('syncs Phaser position and cancels a pending banana peel when walking away', () => {
    const session = new GameConsoleSession({
      dialogue: TEST_BRIDGE_DIALOGUE_CATALOG,
      ownedItemIds: ['glasses'],
      equippedItemIds: ['glasses']
    });
    session.syncPlayerPosition(650, 535);
    expect(session.exec('interact').events.some((e) => e.type === 'secret_discovered')).toBe(true);
    expect(session.getState().overworld.bananaFirstPeelPending).toBe(true);

    const cancelled = session.syncPlayerPosition(900, 535);
    expect(cancelled.events).toContainEqual({ type: 'banana_peel_cancelled' });
    expect(session.getState().overworld.bananaFirstPeelPending).toBe(false);
  });

  it('inserts Circuit at the CRT after hydrate', () => {
    const session = new GameConsoleSession({
      dialogue: TEST_BRIDGE_DIALOGUE_CATALOG,
      ownedItemIds: ['circuit'],
      equippedItemIds: []
    });
    session.syncPlayerPosition(1650, 520);
    const result = session.exec('interact');
    expect(result.events).toContainEqual({ type: 'scene_entered', sceneId: 'ridge' });
    expect(session.observe().mode).toBe('ridge');
  });

  it('commits banana peel warp for the live Overworld typewriter path', () => {
    const session = new GameConsoleSession({
      dialogue: TEST_BRIDGE_DIALOGUE_CATALOG,
      ownedItemIds: ['glasses'],
      equippedItemIds: ['glasses'],
      discoveredSecretIds: ['banana-peel-clue']
    });
    session.syncPlayerPosition(650, 535);
    const result = session.commitBananaPeelWarp();
    expect(result.ok).toBe(true);
    expect(session.observe().mode).toBe('potassium');
  });
});

function walkOverworldTo(session: GameConsoleSession, targetX: number): void {
  for (let i = 0; i < 80; i += 1) {
    const x = session.observe().overworld?.playerX ?? 0;
    if (Math.abs(x - targetX) < 50) return;
    const direction = x < targetX ? 'right' : 'left';
    session.exec(`go ${direction} 2`);
  }
}
