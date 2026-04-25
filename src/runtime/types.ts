import type { ComponentType } from 'react';
import type * as Phaser from 'phaser';
import type { MiniGameId } from '../config/featureIds';
import type { MiniGameTypeValue } from './miniGameKind';
import { MiniGameType } from './miniGameKind';

export type { MiniGameTypeValue };
export { MiniGameType };

/** Props contract for mini-game overlay components. Intentionally empty — extend
 *  as shared needs emerge (e.g. onClose callback, shared context). */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MiniGameOverlayProps {}

interface MiniGamePluginBase {
  id: MiniGameId;
  name: string;
  description: string;
  x?: number; // World position X (overworld buildings only)
}

export interface ReactOverlayMiniGamePlugin extends MiniGamePluginBase {
  type: typeof MiniGameType.REACT_OVERLAY;
  /** When set, closing this React overlay returns here instead of the overworld. */
  overlayParentId?: MiniGameId;
  Component: ComponentType<MiniGameOverlayProps>;
  Scene?: never;
}

export interface PhaserSceneMiniGamePlugin extends MiniGamePluginBase {
  type: typeof MiniGameType.PHASER_SCENE;
  Scene: typeof Phaser.Scene;
  Component?: never;
  overlayParentId?: never;
}

export type MiniGamePlugin = ReactOverlayMiniGamePlugin | PhaserSceneMiniGamePlugin;
