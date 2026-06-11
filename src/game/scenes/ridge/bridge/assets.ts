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

export function preloadBridgeAssets(scene: Phaser.Scene): void {
  BRIDGE_IMAGE_ASSETS.forEach((asset) => {
    const path = 'path' in asset ? asset.path : BRIDGE_ASSET_PATH;
    const { key, file } = asset;
    if (!scene.textures.exists(key)) {
      scene.load.image(key, `${path}${file}`);
    }
  });
}
