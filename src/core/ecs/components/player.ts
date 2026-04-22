import type { ComponentStore, EcsWorld } from '../world';

export interface Transform2D {
  x: number;
  y: number;
}

export interface Velocity2D {
  x: number;
  y: number;
}

export interface Facing {
  flipX: boolean;
}

export interface MovementConfig {
  walkSpeed: number;
  sprintSpeed: number;
  jumpVelocityY: number;
}

export type PlayerState =
  | { kind: 'idle' }
  | { kind: 'walking' }
  | { kind: 'jumping' }
  | { kind: 'falling' };

export interface PlayerFsmState {
  current: PlayerState;
  jumpEnabled: boolean;
  grounded: boolean;
}

export interface InteractionProbe {
  requested: boolean;
}

export interface PauseState {
  paused: boolean;
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  interact: boolean;
  analogX?: number;
}

export interface PlayerComponentStores {
  transform: ComponentStore<Transform2D>;
  velocity: ComponentStore<Velocity2D>;
  facing: ComponentStore<Facing>;
  movement: ComponentStore<MovementConfig>;
  fsm: ComponentStore<PlayerFsmState>;
  interaction: ComponentStore<InteractionProbe>;
  pause: ComponentStore<PauseState>;
  input: ComponentStore<PlayerInput>;
}

export function createPlayerComponentStores(world: EcsWorld): PlayerComponentStores {
  return {
    transform: world.registerComponent<Transform2D>('Transform2D'),
    velocity: world.registerComponent<Velocity2D>('Velocity2D'),
    facing: world.registerComponent<Facing>('Facing'),
    movement: world.registerComponent<MovementConfig>('MovementConfig'),
    fsm: world.registerComponent<PlayerFsmState>('PlayerFsmState'),
    interaction: world.registerComponent<InteractionProbe>('InteractionProbe'),
    pause: world.registerComponent<PauseState>('PauseState'),
    input: world.registerComponent<PlayerInput>('PlayerInput')
  };
}
