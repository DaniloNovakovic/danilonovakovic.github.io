import type { ComponentType } from 'react';
import * as Phaser from 'phaser';

export const MiniGameType = {
  REACT_OVERLAY: 'REACT_OVERLAY',
  PHASER_SCENE: 'PHASER_SCENE'
} as const;

export type MiniGameTypeValue = (typeof MiniGameType)[keyof typeof MiniGameType];

export interface MiniGamePlugin {
  id: string;
  name: string;
  description: string;
  type: MiniGameTypeValue;
  x: number; // World position X
  Component?: ComponentType; // For React-based mini-games
  Scene?: typeof Phaser.Scene; // For Phaser-based mini-games
}
