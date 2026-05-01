import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerController, type PhysicsSprite } from './PlayerController';

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

const noInput = { left: false, right: false, sprint: false, jump: false, interact: false };

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
      const result = controller.step({ ...noInput, right: true });
      expect(sprite.vx).toBe(WALK);
      expect(result.facingLeft).toBe(false);
      expect(result.moving).toBe(true);
    });

    it('applies walk speed to the left', () => {
      const result = controller.step({ ...noInput, left: true });
      expect(sprite.vx).toBe(-WALK);
      expect(result.facingLeft).toBe(true);
    });

    it('applies sprint speed', () => {
      controller.step({ ...noInput, right: true, sprint: true });
      expect(sprite.vx).toBe(SPRINT);
    });

    it('stops when no directional input', () => {
      controller.step({ ...noInput, right: true });
      controller.step({ ...noInput });
      expect(sprite.vx).toBe(0);
    });

    it('stops when both left and right are held', () => {
      controller.step({ ...noInput, left: true, right: true });
      expect(sprite.vx).toBe(0);
    });

    it('analog movement uses walk speed when sprint is not pressed', () => {
      controller.step({ ...noInput, analogX: 1 });
      expect(sprite.vx).toBe(WALK);
    });

    it('analog movement uses sprint speed when sprint is pressed', () => {
      controller.step({ ...noInput, analogX: 1, sprint: true });
      expect(sprite.vx).toBe(SPRINT);
    });
  });

  describe('jumping', () => {
    it('applies jump velocity when grounded and jump pressed', () => {
      controller.step({ ...noInput, jump: true });
      expect(sprite.vy).toBe(JUMP_VY);
    });

    it('does not jump when not grounded', () => {
      const airSprite = makeSprite(false);
      controller.mount(airSprite);
      controller.step({ ...noInput, jump: true });
      expect(airSprite.vy).toBe(0);
    });

    it('uses coyote time shortly after leaving ground when configured', () => {
      controller = new PlayerController({
        walkSpeed: WALK,
        sprintSpeed: SPRINT,
        jumpVelocityY: JUMP_VY,
        coyoteTimeMs: 120
      });
      controller.mount(sprite);
      controller.step({ ...noInput, nowMs: 100 });
      sprite.body.touching.down = false;
      controller.step({ ...noInput, jump: true, nowMs: 180 });
      expect(sprite.vy).toBe(JUMP_VY);
    });

    it('does not use expired coyote time', () => {
      controller = new PlayerController({
        walkSpeed: WALK,
        sprintSpeed: SPRINT,
        jumpVelocityY: JUMP_VY,
        coyoteTimeMs: 80
      });
      controller.mount(sprite);
      controller.step({ ...noInput, nowMs: 100 });
      sprite.body.touching.down = false;
      controller.step({ ...noInput, jump: true, nowMs: 220 });
      expect(sprite.vy).toBe(0);
    });

    it('buffers jump shortly before landing when configured', () => {
      const airSprite = makeSprite(false);
      controller = new PlayerController({
        walkSpeed: WALK,
        sprintSpeed: SPRINT,
        jumpVelocityY: JUMP_VY,
        jumpBufferMs: 120
      });
      controller.mount(airSprite);
      controller.step({ ...noInput, jump: true, nowMs: 100 });
      expect(airSprite.vy).toBe(0);
      airSprite.body.touching.down = true;
      controller.step({ ...noInput, nowMs: 170 });
      expect(airSprite.vy).toBe(JUMP_VY);
    });

    it('does not use expired jump buffer', () => {
      const airSprite = makeSprite(false);
      controller = new PlayerController({
        walkSpeed: WALK,
        sprintSpeed: SPRINT,
        jumpVelocityY: JUMP_VY,
        jumpBufferMs: 60
      });
      controller.mount(airSprite);
      controller.step({ ...noInput, jump: true, nowMs: 100 });
      airSprite.body.touching.down = true;
      controller.step({ ...noInput, nowMs: 200 });
      expect(airSprite.vy).toBe(0);
    });
  });

  describe('interact one-shot', () => {
    it('returns interactRequested when interact is pressed', () => {
      const result = controller.step({ ...noInput, interact: true });
      expect(result.interactRequested).toBe(true);
    });

    it('does not report interact when not pressed', () => {
      const result = controller.step({ ...noInput });
      expect(result.interactRequested).toBe(false);
    });
  });

  describe('pause', () => {
    it('zeroes velocity when paused', () => {
      controller.pause();
      controller.step({ ...noInput, right: true, jump: true });
      expect(sprite.vx).toBe(0);
      expect(sprite.vy).toBe(0);
    });

    it('resumes movement after resume()', () => {
      controller.pause();
      controller.resume();
      controller.step({ ...noInput, right: true });
      expect(sprite.vx).toBe(WALK);
    });

    it('does not report interact when paused', () => {
      controller.pause();
      const result = controller.step({ ...noInput, interact: true });
      expect(result.interactRequested).toBe(false);
    });
  });

  describe('getPosition', () => {
    it('returns sprite position after step', () => {
      sprite.x = 250;
      sprite.y = 480;
      controller.step({ ...noInput });
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
