import { describe, it, expect } from 'vitest';
import { HOBBY_REACT_OVERLAY_IDS, MINI_GAME_IDS } from './featureIds';
import { HOBBY_STATION_LAYOUT, HOBBIES_ROOM_INTERACTABLES } from './hobbiesRoomLayout';

describe('hobbies room layout', () => {
  it('lists every hobby React overlay with a station and matching interactable x', () => {
    for (const id of HOBBY_REACT_OVERLAY_IDS) {
      expect(MINI_GAME_IDS as readonly string[]).toContain(id);
      const station = HOBBY_STATION_LAYOUT.find((s) => s.id === id);
      expect(station).toBeDefined();
      const hit = HOBBIES_ROOM_INTERACTABLES.find((i) => i.id === id);
      expect(hit?.x).toBe(station!.x);
    }
  });

  it('includes exit and unique interactable ids', () => {
    const ids = HOBBIES_ROOM_INTERACTABLES.map((i) => i.id);
    expect(ids).toContain('exit');
    expect(new Set(ids).size).toBe(ids.length);
  });
});
