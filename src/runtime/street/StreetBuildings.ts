/**
 * StreetBuildings — places building sprites and labels for the overworld.
 * Extracted from OverworldScene so the scene is a thin orchestrator.
 */
import * as Phaser from 'phaser';
import { PORTFOLIO_SECTIONS } from '../../config/portfolioRegistry';
import { createUiText } from '../text/createUiText';

const BUILDING_Y = 395;
const LABEL_Y = 150;

export interface StreetBuildingLayers {
  interactables: Phaser.GameObjects.Group;
  sketchLayer: Phaser.GameObjects.Layer;
  pixelLayer: Phaser.GameObjects.Layer;
  setLensActive(active: boolean): void;
}

export function buildStreetBuildings(scene: Phaser.Scene): StreetBuildingLayers {
  const group = scene.add.group();
  const sketchLayer = scene.add.layer();
  const pixelLayer = scene.add.layer().setVisible(false);

  for (const s of PORTFOLIO_SECTIONS) {
    if (s.x === undefined) continue;

    const bldg = scene.add.sprite(s.x, BUILDING_Y, `building_${s.id}`);
    const pixelBldg = scene.add.sprite(s.x, BUILDING_Y, `building_${s.id}_pixel`);
    sketchLayer.add(bldg);
    pixelLayer.add(pixelBldg);
    createUiText(scene, s.x, LABEL_Y, s.name.toUpperCase(), {
      fontSize: '22px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    })
      .setOrigin(0.5)
      .setScrollFactor(1);

    bldg.setData('name', s.id);
    group.add(bldg);
  }

  return {
    interactables: group,
    sketchLayer,
    pixelLayer,
    setLensActive(active: boolean) {
      sketchLayer.setVisible(!active);
      pixelLayer.setVisible(active);
    }
  };
}
