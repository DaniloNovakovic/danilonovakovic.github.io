import type { ComponentType } from 'react';
import * as Phaser from 'phaser';
import type { MiniGameId } from '../config/featureIds';
import type { MiniGameTypeValue } from './miniGameKind';

export type { MiniGameTypeValue };
export { MiniGameType } from './miniGameKind';

export interface MiniGamePlugin {
  id: MiniGameId;
  name: string;
  description: string;
  type: MiniGameTypeValue;
  x?: number; // World position X (overworld buildings only)
  /** When set, closing this React overlay returns here instead of the overworld. */
  overlayParentId?: MiniGameId;
  Component?: ComponentType; // For React-based mini-games
  Scene?: typeof Phaser.Scene; // For Phaser-based mini-games
}
