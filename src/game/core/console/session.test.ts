import { describe, expect, it } from 'vitest';
import type { BridgeDialogueCatalog } from '../ridge/content/bridgeStage';
import { parseGameCommand, parseGameScript } from './commands';
import { GameConsoleSession } from './session';

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
  return new GameConsoleSession({ dialogue: catalog });
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
      dialogue: catalog,
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
      dialogue: catalog,
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
      dialogue: catalog,
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
