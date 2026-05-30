import type * as Phaser from 'phaser';

const BRIDGE_ASSET_PATH = '/assets/ridge/bridge/';
const BRIDGE_MODULAR_ASSET_PATH = `${BRIDGE_ASSET_PATH}modular/`;

export const BRIDGE_TEXTURE_KEYS = {
  stageBackdrop: 'ridge-bridge-stage-backdrop',
  farForest: 'ridge-bridge-far-forest',
  midForest: 'ridge-bridge-mid-forest',
  foregroundScreen: 'ridge-bridge-stage-foreground-screen',
  groundStrips: 'ridge-bridge-ground-strips',
  crossingBefore: 'ridge-bridge-crossing-before',
  crossingAfter: 'ridge-bridge-crossing-after',
  draftspersonWorkZone: 'ridge-bridge-draftsperson-work-zone',
  draftspersonRestShelter: 'ridge-bridge-draftsperson-rest-shelter',
  draftspersonCharacter: 'ridge-bridge-draftsperson-character',
  toyCar: 'ridge-bridge-toy-car-prop',
  roleIcons: 'ridge-bridge-role-icons',
  treePineTallA: 'ridge-bridge-tree-pine-tall-a',
  treePineTallB: 'ridge-bridge-tree-pine-tall-b',
  treePineMediumA: 'ridge-bridge-tree-pine-medium-a',
  treePineMediumB: 'ridge-bridge-tree-pine-medium-b',
  treePineFar: 'ridge-bridge-tree-pine-far',
  bushLarge: 'ridge-bridge-bush-large',
  bushMedium: 'ridge-bridge-bush-medium',
  bushSmall: 'ridge-bridge-bush-small',
  flowers: 'ridge-bridge-flowers',
  grassTuft: 'ridge-bridge-grass-tuft',
  logPile: 'ridge-bridge-log-pile',
  paperRock: 'ridge-bridge-paper-rock',
  groundLong: 'ridge-bridge-ground-long',
  groundShort: 'ridge-bridge-ground-short',
  cliffLeft: 'ridge-bridge-cliff-left',
  cliffRight: 'ridge-bridge-cliff-right',
  supportPier: 'ridge-bridge-support-pier',
  bridgeBuilder: 'ridge-bridge-builder',
  modularToyCar: 'ridge-bridge-toy-car',
  bridgeSpanComplete: 'ridge-bridge-span-complete',
  draftingBoard: 'ridge-bridge-drafting-board',
  restShelter: 'ridge-bridge-rest-shelter'
} as const;

const BRIDGE_IMAGE_ASSETS = [
  {
    key: BRIDGE_TEXTURE_KEYS.stageBackdrop,
    file: 'bridge-stage-backdrop.png'
  },
  {
    key: BRIDGE_TEXTURE_KEYS.farForest,
    file: 'bridge-far-forest.png'
  },
  {
    key: BRIDGE_TEXTURE_KEYS.midForest,
    file: 'bridge-mid-forest.png'
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
  },
  {
    key: BRIDGE_TEXTURE_KEYS.treePineTallA,
    file: 'tree-pine-tall-a.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.treePineTallB,
    file: 'tree-pine-tall-b.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.treePineMediumA,
    file: 'tree-pine-medium-a.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.treePineMediumB,
    file: 'tree-pine-medium-b.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.treePineFar,
    file: 'tree-pine-far.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.bushLarge,
    file: 'bush-large.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.bushMedium,
    file: 'bush-medium.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.bushSmall,
    file: 'bush-small.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.flowers,
    file: 'flowers.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.grassTuft,
    file: 'grass-tuft.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.logPile,
    file: 'log-pile.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.paperRock,
    file: 'paper-rock.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.groundLong,
    file: 'ground-long.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.groundShort,
    file: 'ground-short.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.cliffLeft,
    file: 'cliff-left.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.cliffRight,
    file: 'cliff-right.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.supportPier,
    file: 'support-pier.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
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
    key: BRIDGE_TEXTURE_KEYS.bridgeSpanComplete,
    file: 'bridge-span-complete.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.draftingBoard,
    file: 'drafting-board.png',
    path: BRIDGE_MODULAR_ASSET_PATH
  },
  {
    key: BRIDGE_TEXTURE_KEYS.restShelter,
    file: 'rest-shelter.png',
    path: BRIDGE_MODULAR_ASSET_PATH
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
