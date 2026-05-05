import type { ComponentType, LazyExoticComponent } from 'react';
import type * as Phaser from 'phaser';
import type { MiniGameId } from './featureIds';
import type { MiniGameOverlayProps } from '@/game/runtime/types';
import { FEATURE_CATALOG_ENTRIES } from '@/game/registry/catalog';

export interface ReactOverlayRuntimeBinding {
  kind: 'reactOverlay';
  component: ComponentType<MiniGameOverlayProps> | LazyExoticComponent<ComponentType<MiniGameOverlayProps>>;
  loadComponent: () => Promise<{ default: ComponentType<MiniGameOverlayProps> }>;
}

export interface PhaserSceneRuntimeBinding {
  kind: 'phaserScene';
  sceneKey: string;
  loadScene: () => Promise<typeof Phaser.Scene>;
}

export type FeatureRuntimeBinding = ReactOverlayRuntimeBinding | PhaserSceneRuntimeBinding;

export const FEATURE_RUNTIME_BINDINGS: Record<MiniGameId, FeatureRuntimeBinding> =
  Object.fromEntries(
    FEATURE_CATALOG_ENTRIES.map((entry) => [entry.id, entry.runtime])
  ) as Record<MiniGameId, FeatureRuntimeBinding>;

export function getRuntimeBinding(id: MiniGameId): FeatureRuntimeBinding {
  return FEATURE_RUNTIME_BINDINGS[id];
}

export function getPhaserSceneBinding(id: MiniGameId): PhaserSceneRuntimeBinding | undefined {
  const binding = getRuntimeBinding(id);
  return binding.kind === 'phaserScene' ? binding : undefined;
}

export function getReactOverlayBinding(id: MiniGameId): ReactOverlayRuntimeBinding | undefined {
  const binding = getRuntimeBinding(id);
  return binding.kind === 'reactOverlay' ? binding : undefined;
}
