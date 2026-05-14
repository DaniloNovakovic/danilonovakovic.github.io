import { describe, expect, it } from 'vitest';
import { HOBBIES_SCENE_ID } from '@/game/scenes/sceneIds';
import { GAME_DESIGN_HEIGHT } from '@/game/sharedSceneRuntime/designSize';
import {
  OVERWORLD_BASEMENT_HOLE,
  OVERWORLD_BUILDING_TRIGGERS,
  OVERWORLD_GLASSES_SECRET_SLOTS,
  OVERWORLD_PLAYER_RESUME_Y_CLAMP,
  OVERWORLD_PLAYER_SPAWN_MARGIN_X,
  OVERWORLD_PLAYER_START,
  OVERWORLD_WIDTH,
  getOverworldBuildingTrigger
} from './worldLayout';

describe('overworld world layout', () => {
  it('keeps the player start and resume clamp inside world bounds', () => {
    expect(OVERWORLD_PLAYER_START.x).toBeGreaterThanOrEqual(OVERWORLD_PLAYER_SPAWN_MARGIN_X);
    expect(OVERWORLD_PLAYER_START.x).toBeLessThanOrEqual(
      OVERWORLD_WIDTH - OVERWORLD_PLAYER_SPAWN_MARGIN_X
    );
    expect(OVERWORLD_PLAYER_START.y).toBeGreaterThanOrEqual(
      OVERWORLD_PLAYER_RESUME_Y_CLAMP.min
    );
    expect(OVERWORLD_PLAYER_START.y).toBeLessThanOrEqual(OVERWORLD_PLAYER_RESUME_Y_CLAMP.max);

    expect(OVERWORLD_PLAYER_RESUME_Y_CLAMP.min).toBeGreaterThan(0);
    expect(OVERWORLD_PLAYER_RESUME_Y_CLAMP.max).toBeLessThanOrEqual(GAME_DESIGN_HEIGHT);
  });

  it('keeps building triggers ordered and inside the street width', () => {
    const triggerXs = OVERWORLD_BUILDING_TRIGGERS.map((trigger) => trigger.x);

    expect(triggerXs).toEqual([...triggerXs].sort((a, b) => a - b));
    expect(triggerXs.every((x) => x > 0 && x < OVERWORLD_WIDTH)).toBe(true);
  });

  it('keeps basement and glasses secret facts inside the playable band', () => {
    expect(OVERWORLD_BASEMENT_HOLE.x).toBeGreaterThan(0);
    expect(OVERWORLD_BASEMENT_HOLE.x).toBeLessThan(OVERWORLD_WIDTH);
    expect(OVERWORLD_BASEMENT_HOLE.y).toBeGreaterThanOrEqual(
      OVERWORLD_PLAYER_RESUME_Y_CLAMP.min
    );
    expect(OVERWORLD_BASEMENT_HOLE.y).toBeLessThanOrEqual(
      OVERWORLD_PLAYER_RESUME_Y_CLAMP.max
    );

    expect(OVERWORLD_GLASSES_SECRET_SLOTS.length).toBeGreaterThan(0);
    for (const secret of OVERWORLD_GLASSES_SECRET_SLOTS) {
      expect(secret.x).toBeGreaterThan(0);
      expect(secret.x).toBeLessThan(OVERWORLD_WIDTH);
      expect(secret.y).toBeGreaterThanOrEqual(OVERWORLD_PLAYER_RESUME_Y_CLAMP.min);
      expect(secret.y).toBeLessThanOrEqual(OVERWORLD_PLAYER_RESUME_Y_CLAMP.max);
    }
  });

  it('keeps the Hobbies building trigger wired to the Hobbies scene', () => {
    expect(getOverworldBuildingTrigger(HOBBIES_SCENE_ID)?.action).toEqual({
      kind: 'enterScene',
      sceneId: HOBBIES_SCENE_ID
    });
  });
});
