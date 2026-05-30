import type * as Phaser from 'phaser';

const BRIDGE_ASSET_PATH = '/assets/ridge/bridge/';

export const BRIDGE_TEXTURE_KEYS = {
  stageBackdrop: 'ridge-bridge-stage-backdrop',
  foregroundScreen: 'ridge-bridge-stage-foreground-screen',
  groundStrips: 'ridge-bridge-ground-strips',
  crossingBefore: 'ridge-bridge-crossing-before',
  crossingAfter: 'ridge-bridge-crossing-after',
  draftspersonWorkZone: 'ridge-bridge-draftsperson-work-zone',
  draftspersonRestShelter: 'ridge-bridge-draftsperson-rest-shelter',
  draftspersonCharacter: 'ridge-bridge-draftsperson-character',
  toyCar: 'ridge-bridge-toy-car-prop',
  roleIcons: 'ridge-bridge-role-icons'
} as const;

const BRIDGE_IMAGE_ASSETS = [
  {
    key: BRIDGE_TEXTURE_KEYS.stageBackdrop,
    file: 'bridge-stage-backdrop.png'
  },
  {
    key: BRIDGE_TEXTURE_KEYS.foregroundScreen,
    file: 'bridge-stage-foreground-screen.png'
  },
  {
    key: BRIDGE_TEXTURE_KEYS.groundStrips,
    file: 'bridge-ground-strips.png'
  },
  {
    key: BRIDGE_TEXTURE_KEYS.crossingBefore,
    file: 'bridge-crossing-before.png'
  },
  {
    key: BRIDGE_TEXTURE_KEYS.crossingAfter,
    file: 'bridge-crossing-after.png'
  },
  {
    key: BRIDGE_TEXTURE_KEYS.draftspersonWorkZone,
    file: 'draftsperson-work-zone.png'
  },
  {
    key: BRIDGE_TEXTURE_KEYS.draftspersonRestShelter,
    file: 'draftsperson-rest-shelter.png'
  },
  {
    key: BRIDGE_TEXTURE_KEYS.draftspersonCharacter,
    file: 'draftsperson-character.png'
  },
  {
    key: BRIDGE_TEXTURE_KEYS.toyCar,
    file: 'toy-car-prop.png'
  },
  {
    key: BRIDGE_TEXTURE_KEYS.roleIcons,
    file: 'bridge-role-icons.png'
  }
] as const;

export function preloadBridgeAssets(scene: Phaser.Scene): void {
  BRIDGE_IMAGE_ASSETS.forEach(({ key, file }) => {
    if (!scene.textures.exists(key)) {
      scene.load.image(key, `${BRIDGE_ASSET_PATH}${file}`);
    }
  });
}
