import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerController, type PhysicsSprite } from './PlayerController';
import { MoveCommand, JumpCommand, InteractCommand } from './input/Command';

const WALK = 200;
const SPRINT = 400;
const JUMP_VY = -500;

function makeSprite(grounded = true): PhysicsSprite & { vx: number; vy: number } {
  const sprite = {
    x: 100,
    y: 500,
    vx: 0,
    vy: 0,
    body: { touching: { down: grounded } },
    setVelocityX(v: number) { this.vx = v; },
    setVelocityY(v: number) { this.vy = v; }
  };
  return sprite;
}

function makeController() {
  return new PlayerController({ walkSpeed: WALK, sprintSpeed: SPRINT, jumpVelocityY: JUMP_VY });
}

describe('PlayerController', () => {
  let controller: PlayerController;
  let sprite: ReturnType<typeof makeSprite>;

  beforeEach(() => {
    sprite = makeSprite(true);
    controller = makeController();
    controller.mount(sprite);
  });

  describe('horizontal movement', () => {
    it('applies walk speed to the right', () => {
      const result = controller.step([new MoveCommand(1, false)]);
      expect(sprite.vx).toBe(WALK);
      expect(result.facingLeft).toBe(false);
      expect(result.moving).toBe(true);
    });

    it('applies walk speed to the left', () => {
      const result = controller.step([new MoveCommand(-1, false)]);
      expect(sprite.vx).toBe(-WALK);
      expect(result.facingLeft).toBe(true);
    });

    it('applies sprint speed', () => {
      controller.step([new MoveCommand(1, true)]);
      expect(sprite.vx).toBe(SPRINT);
    });

    it('stops when no directional input', () => {
      controller.step([new MoveCommand(1, false)]);
      controller.step([]);
      expect(sprite.vx).toBe(0);
    });

    it('applies analog intensity', () => {
      controller.step([new MoveCommand(0.5, true)]);
      expect(sprite.vx).toBe(SPRINT * 0.5);
    });
  });

  describe('jumping', () => {
    it('applies jump velocity when grounded and jump pressed', () => {
      controller.step([new JumpCommand()]);
      expect(sprite.vy).toBe(JUMP_VY);
    });

    it('does not jump when not grounded', () => {
      const airSprite = makeSprite(false);
      controller.mount(airSprite);
      controller.step([new JumpCommand()]);
      expect(airSprite.vy).toBe(0);
    });
  });

  describe('interact one-shot', () => {
    it('returns interactRequested when interact command is given', () => {
      const result = controller.step([new InteractCommand()]);
      expect(result.interactRequested).toBe(true);
    });

    it('does not report interact when no command', () => {
      const result = controller.step([]);
      expect(result.interactRequested).toBe(false);
    });
  });

  describe('pause', () => {
    it('zeroes velocity when paused', () => {
      controller.pause();
      controller.step([new MoveCommand(1, true), new JumpCommand()]);
      expect(sprite.vx).toBe(0);
      expect(sprite.vy).toBe(0);
    });

    it('resumes movement after resume()', () => {
      controller.pause();
      controller.resume();
      controller.step([new MoveCommand(1, false)]);
      expect(sprite.vx).toBe(WALK);
    });

    it('does not report interact when paused', () => {
      controller.pause();
      const result = controller.step([new InteractCommand()]);
      expect(result.interactRequested).toBe(false);
    });
  });

  describe('getPosition', () => {
    it('returns sprite position after step', () => {
      sprite.x = 250;
      sprite.y = 480;
      controller.step([]);
      const pos = controller.getPosition();
      expect(pos.x).toBe(250);
      expect(pos.y).toBe(480);
    });
  });

  describe('zeroVelocity', () => {
    it('sets horizontal velocity to 0 on the sprite', () => {
      sprite.vx = 300;
      controller.zeroVelocity();
      expect(sprite.vx).toBe(0);
    });
  });
});
