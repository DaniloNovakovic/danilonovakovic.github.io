import type { ComponentType } from 'react';
import * as Phaser from 'phaser';
import type { MiniGameId } from '../config/featureIds';
import type { MiniGameTypeValue } from './miniGameKind';

export type { MiniGameTypeValue };
export { MiniGameType } from './miniGameKind';

/** Props contract for mini-game overlay components. Intentionally empty — extend
 *  as shared needs emerge (e.g. onClose callback, shared context). */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MiniGameOverlayProps {}

export interface MiniGamePlugin {
  id: MiniGameId;
  name: string;
  description: string;
  type: MiniGameTypeValue;
  x?: number; // World position X (overworld buildings only)
  /** When set, closing this React overlay returns here instead of the overworld. */
  overlayParentId?: MiniGameId;
  Component?: ComponentType<MiniGameOverlayProps>;
  Scene?: typeof Phaser.Scene;
}
