/**
 * PlayerController — ECS-authoritative player logic.
 *
 * Owns one EcsWorld per instance (scoped to a single scene lifetime), the
 * player entity, all component stores, and the movement systems. Exposes a
 * minimal surface that both OverworldScene and HobbiesScene consume.
 *
 * Phaser-specific types are hidden behind the `PhysicsSprite` duck-type so
 * this module stays free of direct Phaser imports (see 10-architecture.mdc).
 */
import { EcsWorld } from '../ecs/world';
import { createPlayerComponentStores } from '../ecs/components/player';
import { runPlayerInputAndMovementSystems } from '../ecs/systems/playerSystems';
import type { EntityId } from '../ecs/world';
import type { PlayerComponentStores } from '../ecs/components/player';

/** Minimal physics-sprite interface — satisfied structurally by Phaser sprites. */
export interface PhysicsSprite {
  x: number;
  y: number;
  setVelocityX(vx: number): void;
  setVelocityY(vy: number): void;
  body: { touching: { down: boolean } };
}

export interface PlayerControllerConfig {
  walkSpeed: number;
  sprintSpeed: number;
  /** Negative — upward impulse applied to the Phaser body on jump. */
  jumpVelocityY: number;
}

export interface PlayerStepInput {
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  interact: boolean;
}

export interface PlayerStepResult {
  velocityX: number;
  facingLeft: boolean;
  moving: boolean;
  interactRequested: boolean;
}

const ZERO_RESULT: PlayerStepResult = {
  velocityX: 0,
  facingLeft: false,
  moving: false,
  interactRequested: false
};

export class PlayerController {
  private readonly world: EcsWorld;
  private readonly stores: PlayerComponentStores;
  private readonly entityId: EntityId;
  private readonly config: PlayerControllerConfig;
  private sprite: PhysicsSprite | null = null;

  constructor(config: PlayerControllerConfig) {
    this.config = config;
    this.world = new EcsWorld();
    this.stores = createPlayerComponentStores(this.world);
    this.entityId = this.world.createEntity();

    this.world.setComponent(this.stores.velocity, this.entityId, { x: 0, y: 0 });
    this.world.setComponent(this.stores.facing, this.entityId, { flipX: false });
    this.world.setComponent(this.stores.movement, this.entityId, {
      walkSpeed: config.walkSpeed,
      sprintSpeed: config.sprintSpeed,
      jumpVelocityY: config.jumpVelocityY
    });
    this.world.setComponent(this.stores.jump, this.entityId, { enabled: true, grounded: false });
    this.world.setComponent(this.stores.interaction, this.entityId, { requested: false });
    this.world.setComponent(this.stores.pause, this.entityId, { paused: false });
    this.world.setComponent(this.stores.input, this.entityId, {
      left: false, right: false, sprint: false, jump: false, interact: false
    });
    this.world.setComponent(this.stores.transform, this.entityId, { x: 0, y: 0 });
  }

  /** Attach to a sprite after it is created in the scene. */
  mount(sprite: PhysicsSprite): void {
    this.sprite = sprite;
    this.world.setComponent(this.stores.transform, this.entityId, {
      x: sprite.x,
      y: sprite.y
    });
  }

  pause(): void {
    this.world.setComponent(this.stores.pause, this.entityId, { paused: true });
  }

  resume(): void {
    this.world.setComponent(this.stores.pause, this.entityId, { paused: false });
  }

  /** Feed raw input and grounded state; apply resulting velocity to the sprite body. */
  step(input: PlayerStepInput): PlayerStepResult {
    if (!this.sprite) return ZERO_RESULT;

    const grounded = this.sprite.body.touching.down;

    this.world.setComponent(this.stores.jump, this.entityId, { enabled: true, grounded });
    this.world.setComponent(this.stores.input, this.entityId, {
      left: input.left,
      right: input.right,
      sprint: input.sprint,
      jump: input.jump,
      interact: input.interact
    });

    const result = runPlayerInputAndMovementSystems(this.world, this.stores, this.entityId);

    this.sprite.setVelocityX(result.velocityX);
    if (result.shouldJump) {
      this.sprite.setVelocityY(this.config.jumpVelocityY);
    }

    this.world.setComponent(this.stores.transform, this.entityId, {
      x: this.sprite.x,
      y: this.sprite.y
    });

    return {
      velocityX: result.velocityX,
      facingLeft: result.facingLeft,
      moving: result.moving,
      interactRequested: result.interactRequested
    };
  }

  /** Zero velocity immediately (used when paused but physics world is still running). */
  zeroVelocity(): void {
    this.sprite?.setVelocityX(0);
  }

  getPosition(): { x: number; y: number } {
    return (
      this.world.getComponent(this.stores.transform, this.entityId) ?? { x: 0, y: 0 }
    );
  }
}
