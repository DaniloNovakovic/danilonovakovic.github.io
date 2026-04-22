import type { EntityId, EcsWorld } from '../world';
import type { PlayerComponentStores, PlayerFsmState, PlayerState, PlayerInput } from '../components/player';

export interface PlayerStepResult {
  velocityX: number;
  facingLeft: boolean;
  moving: boolean;
  shouldJump: boolean;
  interactRequested: boolean;
}

/**
 * Pure function to determine the next player state based on current state and input.
 * Implements the State Pattern (FSM) for movement.
 */
function tickFsm(fsm: PlayerFsmState, input: PlayerInput): PlayerState {
  const { current, grounded, jumpEnabled } = fsm;
  const isMovingInput = input.left || input.right || (input.analogX !== undefined && input.analogX !== 0);

  // Transition rules
  switch (current.kind) {
    case 'idle':
      if (jumpEnabled && grounded && input.jump) return { kind: 'jumping' };
      if (isMovingInput && grounded) return { kind: 'walking' };
      if (!grounded) return { kind: 'falling' };
      return current;

    case 'walking':
      if (jumpEnabled && grounded && input.jump) return { kind: 'jumping' };
      if (!isMovingInput && grounded) return { kind: 'idle' };
      if (!grounded) return { kind: 'falling' };
      return current;

    case 'jumping':
      // Physical jump happens when we enter this state (shouldJump = true).
      // We immediately transition to falling in the next frame if physics world hasn't launched us yet,
      // but usually we wait until grounded is false.
      if (!grounded) return { kind: 'falling' };
      return current;

    case 'falling':
      if (grounded) {
        return isMovingInput ? { kind: 'walking' } : { kind: 'idle' };
      }
      return current;

    default:
      return current;
  }
}

export function runPlayerInputAndMovementSystems(
  world: EcsWorld,
  stores: PlayerComponentStores,
  entityId: EntityId
): PlayerStepResult {
  const pauseState = world.getComponent(stores.pause, entityId);
  const input = world.getComponent(stores.input, entityId);
  const movement = world.getComponent(stores.movement, entityId);
  const fsm = world.getComponent(stores.fsm, entityId);

  if (!pauseState || !input || !movement || !fsm) {
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

  // Update FSM state
  const nextState = tickFsm(fsm, input);
  world.setComponent(stores.fsm, entityId, { ...fsm, current: nextState });

  const speed = input.sprint ? movement.sprintSpeed : movement.walkSpeed;
  let velocityX = 0;
  let facingLeft = false;
  let moving = false;

  // Determine movement behavior based on state
  if (nextState.kind === 'walking' || nextState.kind === 'jumping' || nextState.kind === 'falling') {
    if (input.analogX !== undefined && input.analogX !== 0) {
      velocityX = input.analogX * speed;
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
  }

  // shouldJump is true only on the frame we ENTER the jumping state
  const shouldJump = nextState.kind === 'jumping' && fsm.current.kind !== 'jumping';
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
