import { describe, expect, it } from 'vitest';
import { pickRoomInteractTarget } from './roomInteractSystems';

describe('pickRoomInteractTarget', () => {
  it('returns null when no room interactable is in range', () => {
    const result = pickRoomInteractTarget(0, 0, [{ id: 'exit', x: 100, distanceAnchorY: 400 }], 40);

    expect(result.id).toBeNull();
    expect(result.x).toBeNull();
  });

  it('picks the first interactable inside the radius', () => {
    const result = pickRoomInteractTarget(
      102,
      398,
      [
        { id: 'exit', x: 100, distanceAnchorY: 400 },
        { id: 'games', x: 105, distanceAnchorY: 400 }
      ],
      40
    );

    expect(result.id).toBe('exit');
    expect(result.x).toBe(100);
  });
});
