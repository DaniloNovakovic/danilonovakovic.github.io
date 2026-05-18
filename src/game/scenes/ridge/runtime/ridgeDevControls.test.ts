import { describe, expect, it, vi } from 'vitest';
import {
  applyRidgeDevTeleportToPlayer,
  resolveRidgeDevCameraZoom,
  resolveRidgeDevTeleportPosition,
  RIDGE_PLAYER_SPAWN_OFFSET_Y
} from './ridgeDevControls';

describe('ridgeDevControls', () => {
  it('clamps preview camera zoom while preserving normal gameplay as the default', () => {
    expect(resolveRidgeDevCameraZoom(undefined)).toBe(1);
    expect(resolveRidgeDevCameraZoom(1.25)).toBe(1.25);
    expect(resolveRidgeDevCameraZoom(0.1)).toBe(0.65);
    expect(resolveRidgeDevCameraZoom(4)).toBe(1.6);
  });

  it('resolves teleport targets with the Ridge player spawn offset when requested', () => {
    expect(resolveRidgeDevTeleportPosition({
      sequence: 1,
      label: 'start',
      x: 200,
      y: 500,
      applySpawnOffset: true
    })).toEqual({
      x: 200,
      y: 500 + RIDGE_PLAYER_SPAWN_OFFSET_Y
    });
  });

  it('moves the player and clears velocity for a dev teleport request', () => {
    const player = {
      x: 0,
      y: 0,
      body: {
        setAllowGravity: vi.fn()
      },
      setPosition: vi.fn((x: number, y: number) => {
        player.x = x;
        player.y = y;
      }),
      setVelocityX: vi.fn(),
      setVelocityY: vi.fn()
    };

    const position = applyRidgeDevTeleportToPlayer(player, {
      sequence: 2,
      label: 'paper_stairs',
      x: 400,
      y: 700,
      applySpawnOffset: true
    });

    expect(position).toEqual({ x: 400, y: 620 });
    expect(player.x).toBe(400);
    expect(player.y).toBe(620);
    expect(player.setVelocityX).toHaveBeenCalledWith(0);
    expect(player.setVelocityY).toHaveBeenCalledWith(0);
    expect(player.body.setAllowGravity).toHaveBeenCalledWith(true);
  });
});
