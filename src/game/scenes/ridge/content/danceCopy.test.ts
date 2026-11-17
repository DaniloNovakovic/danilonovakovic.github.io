import { describe, expect, it } from 'vitest';
import { createRidgeRouteStages, RidgeConsoleSession, type RidgeObservation } from '@/game/core/ridge';
import { loadRidgeRouteDialogueCatalog } from './routeCatalog';

/** Lines that fell back to their catalog key (unwritten copy) look like `dance.something.01`. */
const RAW_KEY = /^dance\.[a-z_]+\.[a-z_.0-9]+$/;

function texts(observation: RidgeObservation): string[] {
  const c = observation.conversation;
  if (!c) return observation.nearby.map((item) => item.prompt);
  return [c.text, ...(c.choices ?? []).map((choice) => choice.label)];
}

/**
 * Every Dance Festival branch the English catalog can reach shows written
 * copy: walk each resident's talk, try every reply, and look for raw keys.
 */
describe('Last-Stop Plaza copy', () => {
  it('has written lines for every reachable reply', () => {
    const unwritten = new Set<string>();
    const seen = new Set<string>();
    const stages = createRidgeRouteStages(loadRidgeRouteDialogueCatalog());

    // Breadth-first over choice paths from each beat of the plaza.
    const setups: string[][] = [
      [],
      ['go right 3', 'interact driver', 'choose dance', 'advance', 'advance', 'advance', 'choose learn'],
      ['go right 3', 'interact driver', 'choose dance', 'advance', 'advance', 'advance', 'choose learn', 'go right 3', 'interact teacher', 'advance', 'advance', 'choose lesson', 'advance', 'advance', 'choose go', 'dance auto', 'dance done']
    ];
    const spots = ['traveler', 'driver', 'teacher', 'cicka', 'chairs', 'operations', 'steward', 'gate'];
    const progressOf: Record<string, number> = {
      traveler: 0.1, driver: 0.22, teacher: 0.35, cicka: 0.44, chairs: 0.49, operations: 0.56, steward: 0.625, gate: 0.665
    };

    const explore = (setup: string[], spot: string, path: string[]) => {
      const session = new RidgeConsoleSession({ stages, areaId: 'danceFestival', inventory: ['guitar'] });
      session.exec('warp dance');
      for (const command of setup) session.exec(command);
      for (let i = 0; i < 40 && session.observe().mode !== 'explore'; i += 1) {
        if (session.observe().conversation?.awaitingChoice) break;
        session.exec('advance');
      }
      session.exec('leave');
      const target = progressOf[spot]!;
      for (let i = 0; i < 40 && Math.abs(session.observe().progress - target) > 0.02; i += 1) {
        session.exec(session.observe().progress < target ? 'go right 0.3' : 'go left 0.3');
      }
      if (!session.exec(`interact ${spot}`).ok) return;
      for (const step of [...path, null]) {
        for (let i = 0; i < 40; i += 1) {
          const observation = session.observe();
          for (const text of texts(observation)) if (RAW_KEY.test(text)) unwritten.add(text);
          if (observation.mode !== 'conversation' || observation.conversation?.awaitingChoice) break;
          session.exec('advance');
        }
        const observation = session.observe();
        if (step === null) {
          const choices = observation.conversation?.awaitingChoice ? observation.conversation.choices ?? [] : [];
          for (const choice of choices) {
            const next = [...path, choice.id];
            const key = `${setup.length}|${spot}|${next.join('>')}`;
            if (seen.has(key) || next.length > 6) continue;
            seen.add(key);
            explore(setup, spot, next);
          }
          return;
        }
        if (observation.mode !== 'conversation') return;
        session.exec(`choose ${step}`);
      }
    };

    for (const setup of setups) for (const spot of spots) explore(setup, spot, []);
    expect([...unwritten]).toEqual([]);
    expect(seen.size).toBeGreaterThan(30);
  });
});
