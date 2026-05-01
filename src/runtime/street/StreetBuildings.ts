/**
 * StreetBuildings — places building sprites and labels for the overworld.
 * Extracted from OverworldScene so the scene is a thin orchestrator.
 */
import * as Phaser from 'phaser';
import { PORTFOLIO_SECTIONS } from '../../config/portfolioRegistry';
import { createUiText } from '../text/createUiText';

const BUILDING_Y = 395;
const LABEL_Y = 150;

export interface StreetBuildingFace {
  buildingId: string;
  x: number;
  sketch: Phaser.GameObjects.Sprite;
  pixel: Phaser.GameObjects.Sprite;
}

export interface StreetBuildingLayers {
  interactables: Phaser.GameObjects.Group;
  /** Same order as `interactables` group children used for building slots. */
  faces: readonly StreetBuildingFace[];
  sketchLayer: Phaser.GameObjects.Layer;
  pixelLayer: Phaser.GameObjects.Layer;
  /** Per-building sketch vs pixel visibility from precomputed flags (same order as `faces`). */
  applyLensProximityReveal(flags: readonly boolean[]): void;
}

export function buildStreetBuildings(scene: Phaser.Scene): StreetBuildingLayers {
  const group = scene.add.group();
  const sketchLayer = scene.add.layer();
  const pixelLayer = scene.add.layer();
  sketchLayer.setVisible(true);
  pixelLayer.setVisible(true);

  const faces: StreetBuildingFace[] = [];

  for (const s of PORTFOLIO_SECTIONS) {
    if (s.x === undefined) continue;

    const bldg = scene.add.sprite(s.x, BUILDING_Y, `building_${s.id}`);
    const pixelBldg = scene.add.sprite(s.x, BUILDING_Y, `building_${s.id}_pixel`);
    sketchLayer.add(bldg);
    pixelLayer.add(pixelBldg);
    pixelBldg.setVisible(false);
    pixelBldg.setAlpha(1);
    bldg.setAlpha(1);

    createUiText(scene, s.x, LABEL_Y, s.name.toUpperCase(), {
      fontSize: '22px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    })
      .setOrigin(0.5)
      .setScrollFactor(1);

    bldg.setData('name', s.id);
    group.add(bldg);
    faces.push({ buildingId: s.id, x: s.x, sketch: bldg, pixel: pixelBldg });
  }

  return {
    interactables: group,
    faces,
    sketchLayer,
    pixelLayer,
    applyLensProximityReveal(flags: readonly boolean[]) {
      for (let i = 0; i < faces.length; i++) {
        const reveal = flags[i] === true;
        const { sketch, pixel } = faces[i];
        if (reveal) {
          sketch.setVisible(true);
          sketch.setAlpha(0.32);
          pixel.setVisible(true);
          pixel.setAlpha(1);
        } else {
          sketch.setVisible(true);
          sketch.setAlpha(1);
          pixel.setVisible(false);
          pixel.setAlpha(1);
        }
      }
    }
  };
}
