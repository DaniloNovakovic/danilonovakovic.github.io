import type * as Phaser from 'phaser';
import { getCoverVisibleRegion } from '@/game/sharedSceneRuntime/camera/sideViewCameraMath';

/** The slice of the canvas the cover crop leaves on screen, in canvas px. */
export interface VisibleSlice {
  /** Canvas px per CSS px. */
  k: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Where mini-game chrome drawn by Phaser (the note highway, the step strip)
 * may sit: inside the part of the canvas a phone actually shows.
 */
export function visibleSlice(scene: Phaser.Scene): VisibleSlice {
  const cam = scene.cameras.main;
  const parent = scene.scale.parentSize;
  const visible = getCoverVisibleRegion({
    viewport: { width: parent.width, height: parent.height },
    designSize: { width: cam.width, height: cam.height }
  });
  return {
    k: visible.canvasPerCss,
    left: (cam.width - visible.width) / 2,
    top: (cam.height - visible.height) / 2,
    width: visible.width,
    height: visible.height
  };
}

/**
 * Screen-space objects still feel camera zoom (Phaser zooms about the view
 * centre). Counter-scale so local coordinates land on canvas pixels.
 */
export function pinToScreen(scene: Phaser.Scene, object: Phaser.GameObjects.Components.Transform, x = 0, y = 0): void {
  const cam = scene.cameras.main;
  const z = cam.zoom || 1;
  const cx = cam.width / 2;
  const cy = cam.height / 2;
  object.setScale(1 / z);
  object.setPosition(cx + (x - cx) / z, cy + (y - cy) / z);
}
