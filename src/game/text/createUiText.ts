import * as Phaser from 'phaser';
import { UI_FONT_FAMILY } from '../../config/typography';

export function createUiText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle = {}
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: UI_FONT_FAMILY,
    ...style
  });
}
