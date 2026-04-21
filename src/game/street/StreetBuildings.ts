/**
 * StreetBuildings — places building sprites and labels for the overworld.
 * Extracted from OverworldScene so the scene is a thin orchestrator.
 */
import * as Phaser from 'phaser';
import { PORTFOLIO_SECTIONS } from '../../config/portfolioRegistry';
import { UI_FONT_FAMILY } from '../../config/typography';

const BUILDING_Y = 395;
const LABEL_Y = 150;
const LABEL_FONT = UI_FONT_FAMILY;

export function buildStreetBuildings(scene: Phaser.Scene): Phaser.GameObjects.Group {
  const group = scene.add.group();

  for (const s of PORTFOLIO_SECTIONS) {
    if (s.x === undefined) continue;

    const bldg = scene.add.sprite(s.x, BUILDING_Y, `building_${s.id}`);
    scene.add
      .text(s.x, LABEL_Y, s.name.toUpperCase(), {
        fontFamily: LABEL_FONT,
        fontSize: '22px',
        color: '#1a1a1a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setScrollFactor(1);

    bldg.setData('name', s.id);
    group.add(bldg);
  }

  return group;
}
