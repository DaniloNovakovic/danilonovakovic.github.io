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
    const conversations = new Set<string>();
    const stages = createRidgeRouteStages(loadRidgeRouteDialogueCatalog());

    // Breadth-first over choice paths from each beat of the plaza. `drain`
    // reads to the next menu; `walk:<p>` walks to a spot.
    const asked = ['walk:0.22', 'interact driver', 'drain', 'choose when', 'drain', 'choose leave', 'drain',
      'interact driver', 'drain', 'choose dance', 'drain', 'choose learn', 'drain'];
    const practiced = [...asked, 'walk:0.35', 'interact teacher', 'drain', 'choose lesson', 'drain', 'choose go', 'drain',
      'dance auto', 'dance done', 'drain'];
    const ready = [...practiced,
      'walk:0.56', 'interact operations', 'drain', 'choose help', 'drain', 'choose tug', 'drain', 'choose stamp', 'drain',
      'choose count', 'drain', 'choose watch', 'drain',
      'walk:0.35', 'interact teacher', 'drain', 'choose watch', 'drain', 'choose leave', 'drain',
      'walk:0.56', 'interact operations', 'drain', 'choose kept', 'drain',
      'walk:0.22', 'interact driver', 'drain', 'choose write', 'drain', 'choose simple', 'drain',
      'walk:0.56', 'interact operations', 'drain', 'choose drop', 'drain'];
    const plaza = ['traveler', 'driver', 'teacher', 'cicka', 'chairs', 'operations', 'steward', 'gate'];
    // The request in the jar only changes the people and props by the gate.
    const setups: { commands: string[]; spots: string[] }[] = [
      { commands: [], spots: plaza },
      { commands: asked, spots: plaza },
      { commands: practiced, spots: plaza },
      { commands: ready, spots: ['driver', 'operations', 'lantern-pole', 'cable-run', 'steward', 'gate'] }
    ];
    const progressOf: Record<string, number> = {
      traveler: 0.1, driver: 0.22, teacher: 0.35, cicka: 0.44, chairs: 0.49, operations: 0.56,
      'lantern-pole': 0.605, 'cable-run': 0.64, steward: 0.625, gate: 0.665
    };

    const drain = (session: RidgeConsoleSession) => {
      for (let i = 0; i < 40 && session.observe().mode === 'conversation'; i += 1) {
        if (session.observe().conversation?.awaitingChoice) break;
        session.exec('advance');
      }
    };
    const walk = (session: RidgeConsoleSession, target: number) => {
      for (let i = 0; i < 80 && Math.abs(session.observe().progress - target) > 0.012; i += 1) {
        session.exec(session.observe().progress < target ? 'go right 0.2' : 'go left 0.2');
      }
    };

    const explore = (setup: string[], spot: string, path: string[]) => {
      const session = new RidgeConsoleSession({ stages, areaId: 'danceFestival', inventory: ['guitar'] });
      session.exec('warp dance');
      for (const command of setup) {
        if (command === 'drain') drain(session);
        else if (command.startsWith('walk:')) walk(session, Number(command.slice(5)));
        else session.exec(command);
      }
      drain(session);
      session.exec('leave');
      walk(session, progressOf[spot]!);
      if (!session.exec(`interact ${spot}`).ok) return;
      for (const step of [...path, null]) {
        for (let i = 0; i < 40; i += 1) {
          const observation = session.observe();
          if (observation.conversation) conversations.add(observation.conversation.id);
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

    for (const setup of setups) for (const spot of setup.spots) explore(setup.commands, spot, []);
    expect([...unwritten]).toEqual([]);
    expect(seen.size).toBeGreaterThan(30);
    // The deepest setup really reaches the last setup jobs.
    expect([...conversations]).toEqual(expect.arrayContaining(['dance.setup.lanterns', 'dance.setup.cables', 'dance.steward.clearance']));
    // Replays whole plaza sessions per path; slow under a parallel run.
  }, 20_000);
});
