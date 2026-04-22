import type { EntityId, EcsWorld } from '../world';
import type { PlayerComponentStores } from '../components/player';

export interface PlayerStepResult {
  velocityX: number;
  facingLeft: boolean;
  moving: boolean;
  shouldJump: boolean;
  interactRequested: boolean;
}

export function runPlayerInputAndMovementSystems(
  world: EcsWorld,
  stores: PlayerComponentStores,
  entityId: EntityId
): PlayerStepResult {
  const pauseState = world.getComponent(stores.pause, entityId);
  const input = world.getComponent(stores.input, entityId);
  const movement = world.getComponent(stores.movement, entityId);
  const jump = world.getComponent(stores.jump, entityId);

  if (!pauseState || !input || !movement || !jump) {
    return {
      velocityX: 0,
      facingLeft: false,
      moving: false,
      shouldJump: false,
      interactRequested: false
    };
  }

  if (pauseState.paused) {
    world.setComponent(stores.velocity, entityId, { x: 0, y: 0 });
    world.setComponent(stores.interaction, entityId, { requested: false });
    return {
      velocityX: 0,
      facingLeft: false,
      moving: false,
      shouldJump: false,
      interactRequested: false
    };
  }

  const speed = input.sprint ? movement.sprintSpeed : movement.walkSpeed;
  let velocityX = 0;
  let facingLeft = false;
  let moving = false;

  if (input.analogX !== undefined && input.analogX !== 0) {
    velocityX = input.analogX * movement.sprintSpeed;
    facingLeft = input.analogX < 0;
    moving = true;
  } else if (input.left && !input.right) {
    velocityX = -speed;
    facingLeft = true;
    moving = true;
  } else if (input.right && !input.left) {
    velocityX = speed;
    facingLeft = false;
    moving = true;
  }

  const shouldJump = jump.enabled && jump.grounded && input.jump;
  const interactRequested = input.interact;

  world.setComponent(stores.velocity, entityId, { x: velocityX, y: 0 });
  world.setComponent(stores.facing, entityId, { flipX: facingLeft });
  world.setComponent(stores.interaction, entityId, { requested: interactRequested });

  return {
    velocityX,
    facingLeft,
    moving,
    shouldJump,
    interactRequested
  };
}
