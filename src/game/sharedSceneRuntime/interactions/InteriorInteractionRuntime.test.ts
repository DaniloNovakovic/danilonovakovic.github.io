import { describe, expect, it } from 'vitest';
import { createInteriorInteractionRuntime, type InteriorInteractionTarget } from './InteriorInteractionRuntime';

type TestEffect =
  | { kind: 'close' }
  | { kind: 'open'; id: string }
  | { kind: 'blocked' };

function target(
  id: string,
  x: number,
  options: Partial<InteriorInteractionTarget<string, TestEffect>> = {}
): InteriorInteractionTarget<string, TestEffect> {
  return {
    id,
    kind: 'test',
    x,
    distanceAnchorY: 100,
    prompt: { x, y: 40 },
    effect: { kind: 'open', id },
    ...options
  };
}

describe('createInteriorInteractionRuntime', () => {
  it('hides the prompt and returns no effect when no target is in range', () => {
    const runtime = createInteriorInteractionRuntime({
      targets: [target('desk', 100)],
      interactRadius: 30
    });

    const result = runtime.update({
      playerX: 200,
      playerY: 100,
      interactRequested: true,
      exitRequested: false
    });

    expect(result.activeTarget).toBeNull();
    expect(result.prompt.visible).toBe(false);
    expect(result.effect).toBeNull();
  });

  it('picks the first enabled target in range and returns its prompt coordinates', () => {
    const runtime = createInteriorInteractionRuntime({
      targets: [
        target('disabled', 100, { enabled: () => false }),
        target('first', 105, { prompt: { x: 105, y: 55 } }),
        target('second', 108, { prompt: { x: 108, y: 65 } })
      ],
      interactRadius: 30
    });

    const result = runtime.update({
      playerX: 110,
      playerY: 100,
      interactRequested: false,
      exitRequested: false
    });

    expect(result.activeTarget?.id).toBe('first');
    expect(result.prompt).toEqual({ visible: true, x: 105, y: 55 });
    expect(result.effect).toBeNull();
  });

  it('returns target effects only when interaction is requested', () => {
    const runtime = createInteriorInteractionRuntime({
      targets: [target('music', 100, { effect: { kind: 'open', id: 'music' } })],
      interactRadius: 30
    });

    expect(
      runtime.update({
        playerX: 100,
        playerY: 100,
        interactRequested: false,
        exitRequested: false
      }).effect
    ).toBeNull();

    expect(
      runtime.update({
        playerX: 100,
        playerY: 100,
        interactRequested: true,
        exitRequested: false
      }).effect
    ).toEqual({ kind: 'open', id: 'music' });
  });

  it('resolves function effects against current state', () => {
    let open = false;
    const runtime = createInteriorInteractionRuntime({
      targets: [
        target('computer', 100, {
          effect: () => (open ? { kind: 'open', id: 'games' } : { kind: 'blocked' })
        })
      ],
      interactRadius: 30
    });

    expect(
      runtime.update({
        playerX: 100,
        playerY: 100,
        interactRequested: true,
        exitRequested: false
      }).effect
    ).toEqual({ kind: 'blocked' });

    open = true;

    expect(
      runtime.update({
        playerX: 100,
        playerY: 100,
        interactRequested: true,
        exitRequested: false
      }).effect
    ).toEqual({ kind: 'open', id: 'games' });
  });

  it('returns the exit effect before target interaction effects', () => {
    const runtime = createInteriorInteractionRuntime({
      targets: [target('computer', 100, { effect: { kind: 'open', id: 'games' } })],
      interactRadius: 30,
      exitEffect: { kind: 'close' }
    });

    const result = runtime.update({
      playerX: 100,
      playerY: 100,
      interactRequested: true,
      exitRequested: true
    });

    expect(result.activeTarget).toBeNull();
    expect(result.prompt.visible).toBe(false);
    expect(result.effect).toEqual({ kind: 'close' });
  });

  it('supports per-target interaction radii', () => {
    const runtime = createInteriorInteractionRuntime({
      targets: [
        target('small', 106, { interactRadius: 5 }),
        target('large', 130, { interactRadius: 50 })
      ],
      interactRadius: 10
    });

    const result = runtime.update({
      playerX: 100,
      playerY: 100,
      interactRequested: false,
      exitRequested: false
    });

    expect(result.activeTarget?.id).toBe('large');
  });
});
