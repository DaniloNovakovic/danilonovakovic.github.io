export const MiniGameType = {
  REACT_OVERLAY: 'REACT_OVERLAY',
  PHASER_SCENE: 'PHASER_SCENE'
} as const;

export type MiniGameTypeValue = (typeof MiniGameType)[keyof typeof MiniGameType];
