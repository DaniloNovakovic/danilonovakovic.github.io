import type * as Phaser from 'phaser';

const BRIDGE_ASSET_PATH = '/assets/ridge/bridge/';
const BRIDGE_MODULAR_ASSET_PATH = `${BRIDGE_ASSET_PATH}modular/`;
const BRIDGE_LAYERED_RESET_ASSET_PATH = `${BRIDGE_ASSET_PATH}layered-reset/plates/`;

export const BRIDGE_TEXTURE_KEYS = {
  bridgeBuilder: 'ridge-bridge-builder',
  modularToyCar: 'ridge-bridge-toy-car',
  layeredCornfieldSky: 'ridge-bridge-layered-cornfield-sky',
  layeredCornfieldFarHill: 'ridge-bridge-layered-cornfield-far-hill',
  layeredCornfieldGround: 'ridge-bridge-layered-cornfield-ground'
} as const;

const BRIDGE_IMAGE_ASSETS = [
  {
    key: BRIDGE_TEXTURE_KEYS.bridgeBuilder,
    file: 'bridge-builder.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.modularToyCar,
    file: 'toy-car.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.layeredCornfieldSky,
    file: 'cornfield-sky.png',
    path: BRIDGE_LAYERED_RESET_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.layeredCornfieldFarHill,
    file: 'cornfield-far-hill.png',
    path: BRIDGE_LAYERED_RESET_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.layeredCornfieldGround,
    file: 'cornfield-ground.png',
    path: BRIDGE_LAYERED_RESET_ASSET_PATH
  }
] as const;

/** Native pixel sizes for Bridge parallax plate textures (used by stage authoring bounds). */
export const BRIDGE_PLATE_TEXTURE_DIMENSIONS = {
  [BRIDGE_TEXTURE_KEYS.layeredCornfieldSky]: { width: 420, height: 160 },
  [BRIDGE_TEXTURE_KEYS.layeredCornfieldFarHill]: { width: 206, height: 65 },
  [BRIDGE_TEXTURE_KEYS.layeredCornfieldGround]: { width: 1536, height: 1024 }
} as const satisfies Record<
  | typeof BRIDGE_TEXTURE_KEYS.layeredCornfieldSky
  | typeof BRIDGE_TEXTURE_KEYS.layeredCornfieldFarHill
  | typeof BRIDGE_TEXTURE_KEYS.layeredCornfieldGround,
  { width: number; height: number }
>;

export function preloadBridgeAssets(scene: Phaser.Scene): void {
  BRIDGE_IMAGE_ASSETS.forEach((asset) => {
    const path = 'path' in asset ? asset.path : BRIDGE_ASSET_PATH;
    const { key, file } = asset;
    if (!scene.textures.exists(key)) {
      scene.load.image(key, `${path}${file}`);
    }
  });
}
