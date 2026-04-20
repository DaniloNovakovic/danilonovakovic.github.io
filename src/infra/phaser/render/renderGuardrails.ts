import type * as Phaser from 'phaser';

export const RENDER_GUARDRAILS = {
  spriteGpuLayer: {
    minMembers: 10000,
    maxFrequentMutationsPerSecond: 60
  },
  dynamicTexture: {
    requireExplicitRender: true
  }
} as const;

export type RenderStrategy = 'SpriteBatch' | 'DynamicTexture' | 'SpriteGPULayer';

export interface RenderStrategyHint {
  estimatedMembers: number;
  frequentlyMutating: boolean;
  interactive: boolean;
}

export function chooseRenderStrategy(hint: RenderStrategyHint): RenderStrategy {
  if (hint.interactive) return 'SpriteBatch';
  if (
    hint.estimatedMembers >= RENDER_GUARDRAILS.spriteGpuLayer.minMembers &&
    !hint.frequentlyMutating
  ) {
    return 'SpriteGPULayer';
  }
  return 'DynamicTexture';
}

/**
 * Phaser 4 DynamicTexture buffers commands; we require explicit flushes.
 */
export class DynamicTextureRenderQueue {
  private dirty = false;
  private readonly texture: Phaser.Textures.DynamicTexture;

  constructor(texture: Phaser.Textures.DynamicTexture) {
    this.texture = texture;
  }

  markDirty(): void {
    this.dirty = true;
  }

  flushIfDirty(): void {
    if (!this.dirty) return;
    this.texture.render();
    this.dirty = false;
  }
}

export interface SpriteGpuLayerBudget {
  members: number;
  mutationsPerSecond: number;
}

export function exceedsSpriteGpuLayerMutationBudget(budget: SpriteGpuLayerBudget): boolean {
  return (
    budget.members >= RENDER_GUARDRAILS.spriteGpuLayer.minMembers &&
    budget.mutationsPerSecond > RENDER_GUARDRAILS.spriteGpuLayer.maxFrequentMutationsPerSecond
  );
}
