import { describe, expect, it } from 'vitest';
import {
  createStampedeGuitarState,
  getStampedeGuitarTuning,
  stepStampedeGuitar,
  type StampedeGuitarState,
  type StampedeGuitarStepInput
} from './guitar';

const WALK = 200;

function run(
  frames: number,
  base: Partial<StampedeGuitarStepInput> & { state?: StampedeGuitarState },
  desired = { x: WALK, y: 0 }
) {
  let state = base.state ?? createStampedeGuitarState();
  let player = base.player ?? { x: 400, y: 500 };
  let elapsedMs = base.elapsedMs ?? 0;
  let last = null as ReturnType<typeof stepStampedeGuitar> | null;
  const chords: number[] = [];
  const hitIds = new Set<string>();
  for (let index = 0; index < frames; index += 1) {
    elapsedMs += 16;
    last = stepStampedeGuitar({
      mods: {},
      walkSpeed: WALK,
      candidates: [],
      deltaMs: 16,
      ...base,
      state,
      desired,
      player,
      elapsedMs
    });
    if (last.chord) chords.push(elapsedMs);
    last.hitIds.forEach((id) => hitIds.add(id));
    state = last.state;
    player = { x: player.x + last.velocity.x * 0.016, y: player.y + last.velocity.y * 0.016 };
  }
  return { state, player, elapsedMs, last: last!, chords, hitIds: [...hitIds] };
}

describe('guitar surf', () => {
  it('builds speed past walking pace instead of snapping to it', () => {
    const first = run(1, {});
    expect(Math.hypot(first.last.velocity.x, first.last.velocity.y)).toBeLessThan(WALK * 0.2);

    const cruising = run(120, {});
    expect(cruising.last.velocity.x).toBeGreaterThan(WALK * 1.15);
    expect(cruising.last.velocity.x).toBeLessThanOrEqual(WALK * getStampedeGuitarTuning().topSpeedScale);
  });

  it('coasts after you let go and carves wide turns', () => {
    const cruising = run(120, {});
    const coast = run(10, { state: cruising.state, player: cruising.player }, { x: 0, y: 0 });
    expect(coast.last.velocity.x).toBeGreaterThan(WALK * 0.6);

    const turn = run(10, { state: cruising.state, player: cruising.player }, { x: 0, y: WALK });
    expect(turn.last.velocity.x).toBeGreaterThan(0);
    expect(turn.last.velocity.y).toBeGreaterThan(0);
  });

  it('drops notes behind the board while moving fast and lets them burn out', () => {
    const cruising = run(90, {});
    expect(cruising.state.notes.length).toBeGreaterThan(5);
    cruising.state.notes.forEach((note) => expect(note.x).toBeLessThan(cruising.player.x));

    const later = run(1, {
      state: cruising.state,
      player: cruising.player,
      elapsedMs: cruising.elapsedMs + 5_000
    }, { x: 0, y: 0 });
    expect(later.state.notes).toHaveLength(0);
  });

  it('burns chicks standing on a note, with a gap between hits', () => {
    const cruising = run(90, {});
    const note = cruising.state.notes[0]!;
    const chick = { id: 'chick-1', x: note.x, y: note.y, radius: 8 };
    const hit = stepStampedeGuitar({
      state: cruising.state,
      mods: {},
      desired: { x: WALK, y: 0 },
      walkSpeed: WALK,
      player: cruising.player,
      elapsedMs: cruising.elapsedMs + 16,
      deltaMs: 16,
      candidates: [chick]
    });
    expect(hit.hitIds).toEqual(['chick-1']);

    const again = stepStampedeGuitar({
      state: hit.state,
      mods: {},
      desired: { x: WALK, y: 0 },
      walkSpeed: WALK,
      player: cruising.player,
      elapsedMs: cruising.elapsedMs + 32,
      deltaMs: 16,
      candidates: [chick]
    });
    expect(again.hitIds).toEqual([]);
  });

  it('cannot touch a metalhead, not even with a power chord', () => {
    const drop = run(120, { mods: { drop: true } });
    const note = drop.state.notes.at(-1)!;
    const fan = { id: 'fan', kind: 'metalhead' as const, x: note.x, y: note.y, radius: 12 };
    const brake = run(
      80,
      {
        mods: { drop: true },
        state: drop.state,
        player: drop.player,
        elapsedMs: drop.elapsedMs,
        candidates: [fan, { ...fan, id: 'chick', kind: 'chick' as const }]
      },
      { x: 0, y: 0 }
    );
    expect(brake.chords).toHaveLength(1);
    expect(brake.hitIds).toContain('chick');
    expect(brake.hitIds).not.toContain('fan');
  });

  it('fires a power chord only with the twist, after braking from top speed', () => {
    const plain = run(120, {});
    const plainBrake = run(80, { state: plain.state, player: plain.player, elapsedMs: plain.elapsedMs }, { x: 0, y: 0 });
    expect(plainBrake.chords).toHaveLength(0);

    const drop = run(120, { mods: { drop: true } });
    expect(drop.state.primed).toBe(true);
    const brake = run(
      80,
      { mods: { drop: true }, state: drop.state, player: drop.player, elapsedMs: drop.elapsedMs },
      { x: 0, y: 0 }
    );
    expect(brake.chords).toHaveLength(1);
  });

  it('stops on the axis that hits the notebook edge', () => {
    const cruising = run(120, {});
    const atWall = stepStampedeGuitar({
      state: cruising.state,
      mods: {},
      desired: { x: WALK, y: 0 },
      walkSpeed: WALK,
      player: { x: 1560, y: 500 },
      elapsedMs: cruising.elapsedMs + 16,
      deltaMs: 16,
      candidates: []
    });
    expect(atWall.velocity.x).toBe(0);
  });
});
