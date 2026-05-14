import type * as Phaser from 'phaser';

export const CICKA_TEXTURE_KEY = 'ridge-cicka';
export const CICKA_ASSET_PATH = '/assets/ridge/cicka/cicka-spritesheet.png';
export const CICKA_FRAME_WIDTH = 128;
export const CICKA_FRAME_HEIGHT = 96;
export const CICKA_RUNTIME_SCALE = 0.58;
export const CICKA_ORIGIN = { x: 0.5, y: 1 } as const;

export const CICKA_FRAME_INDEX = {
  perchSit: 0,
  perchBlink: 1,
  suspiciousTurn: 3,
  tailAlert: 4,
  tailPoint: 5,
  tailQuestion: 6
} as const;

export const CICKA_ANIMATION_KEYS = {
  perchIdle: 'ridge-cicka-perch-idle',
  notice: 'ridge-cicka-notice'
} as const;

export function preloadCickaAssets(scene: Phaser.Scene): void {
  if (scene.textures.exists(CICKA_TEXTURE_KEY)) return;

  scene.load.spritesheet(CICKA_TEXTURE_KEY, CICKA_ASSET_PATH, {
    frameWidth: CICKA_FRAME_WIDTH,
    frameHeight: CICKA_FRAME_HEIGHT
  });
}

export function createCickaAnimations(scene: Phaser.Scene): void {
  if (!scene.anims.exists(CICKA_ANIMATION_KEYS.perchIdle)) {
    scene.anims.create({
      key: CICKA_ANIMATION_KEYS.perchIdle,
      frames: createCickaAnimationFrames([
        CICKA_FRAME_INDEX.perchSit,
        CICKA_FRAME_INDEX.perchSit,
        CICKA_FRAME_INDEX.perchBlink,
        CICKA_FRAME_INDEX.perchSit
      ]),
      frameRate: 1.4,
      repeat: -1
    });
  }

  if (!scene.anims.exists(CICKA_ANIMATION_KEYS.notice)) {
    scene.anims.create({
      key: CICKA_ANIMATION_KEYS.notice,
      frames: createCickaAnimationFrames([
        CICKA_FRAME_INDEX.tailAlert,
        CICKA_FRAME_INDEX.tailPoint,
        CICKA_FRAME_INDEX.tailQuestion
      ]),
      frameRate: 5,
      repeat: 0
    });
  }
}

function createCickaAnimationFrames(
  frames: readonly number[]
): Phaser.Types.Animations.AnimationFrame[] {
  return frames.map((frame) => ({
    key: CICKA_TEXTURE_KEY,
    frame
  }));
}
