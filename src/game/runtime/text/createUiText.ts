import type * as Phaser from 'phaser';
import { UI_FONT_FAMILY } from '@shared/config/typography';

export const MAX_UI_TEXT_RESOLUTION = 2;

export function getCappedUiTextResolution(devicePixelRatio?: number): number {
  const ratio = devicePixelRatio ?? (typeof window === 'undefined' ? 1 : window.devicePixelRatio);
  if (!Number.isFinite(ratio) || ratio <= 1) return 1;
  return Math.min(ratio, MAX_UI_TEXT_RESOLUTION);
}

export function snapUiTextCoordinate(value: number): number {
  return Math.round(value);
}

export function createUiText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle = {}
): Phaser.GameObjects.Text {
  const uiText = scene.add.text(snapUiTextCoordinate(x), snapUiTextCoordinate(y), text, {
    fontFamily: UI_FONT_FAMILY,
    ...style
  });
  uiText.setResolution(getCappedUiTextResolution());
  return uiText;
}
