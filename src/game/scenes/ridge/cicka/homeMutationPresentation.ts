import type * as Phaser from 'phaser';
import type { CickaHomeMutation } from './homeMutations';
import { hasCickaHomeMutationAdd } from './homeMutations';

export interface CickaHomeMutationPresentationOptions {
  scene: Phaser.Scene;
  landmark: { x: number; y: number };
  mutations: readonly CickaHomeMutation[];
}

export function addCickaHomeMutationPresentation(
  options: CickaHomeMutationPresentationOptions
): void {
  const { scene, landmark, mutations } = options;

  if (hasCickaHomeMutationAdd(mutations, 'stampede_note')) {
    addCickaStampedeNoteMutation(scene, landmark.x, landmark.y);
  }
}

function addCickaStampedeNoteMutation(
  scene: Phaser.Scene,
  x: number,
  y: number
): void {
  scene.add.rectangle(x + 62, y - 72, 42, 30, 0xf7f1df, 1)
    .setStrokeStyle(2, 0x1f1f1d, 0.88)
    .setAngle(5);
  scene.add.line(x + 42, y - 63, -8, 5, 8, -5, 0x1f1f1d, 0.3).setLineWidth(2);
  scene.add.circle(x + 59, y - 70, 5, 0x1f1f1d, 0.72);
  scene.add.circle(x + 51, y - 81, 3, 0x1f1f1d, 0.72);
  scene.add.circle(x + 60, y - 84, 3, 0x1f1f1d, 0.72);
  scene.add.circle(x + 69, y - 81, 3, 0x1f1f1d, 0.72);
  scene.add.line(x + 78, y - 70, -7, 5, 10, -5, 0x1f1f1d, 0.48).setLineWidth(2);
  scene.add.line(x + 79, y - 63, -6, 4, 9, -4, 0x1f1f1d, 0.38).setLineWidth(2);
}
