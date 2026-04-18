import type { ComponentType } from 'react';

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
  Component: ComponentType; // For React-based mini-games
}
