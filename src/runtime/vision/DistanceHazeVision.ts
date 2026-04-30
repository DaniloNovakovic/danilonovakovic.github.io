import * as Phaser from 'phaser';

export interface DistanceHazeVisionOptions {
  depth: number;
  tileSize: number;
  clearRadius: number;
  maxRadius: number;
  minAlpha: number;
  maxAlpha: number;
  color: number;
}

const DEFAULT_OPTIONS: DistanceHazeVisionOptions = {
  depth: 15,
  tileSize: 40,
  clearRadius: 170,
  maxRadius: 520,
  minAlpha: 0.08,
  maxAlpha: 0.55,
  color: 0xfbfbf9
};

/**
 * Reusable scene overlay that simulates near-sighted vision:
 * sharp center, progressively hazy farther away.
 *
 * Coordinates passed to `render` are in camera/screen space.
 */
export class DistanceHazeVision {
  private readonly scene: Phaser.Scene;
  private readonly overlay: Phaser.GameObjects.Graphics;
  private readonly options: DistanceHazeVisionOptions;

  constructor(scene: Phaser.Scene, options?: Partial<DistanceHazeVisionOptions>) {
    this.scene = scene;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.overlay = scene.add.graphics().setDepth(this.options.depth).setScrollFactor(0);
  }

  render(enabled: boolean, centerScreenX: number, centerScreenY: number): void {
    this.overlay.clear();
    if (!enabled) {
      this.overlay.setVisible(false);
      return;
    }

    this.overlay.setVisible(true);
    const { tileSize, clearRadius, maxRadius, minAlpha, maxAlpha, color } = this.options;
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    for (let y = 0; y < height; y += tileSize) {
      const tileCenterY = y + tileSize / 2;
      for (let x = 0; x < width; x += tileSize) {
        const tileCenterX = x + tileSize / 2;
        const dist = Phaser.Math.Distance.Between(
          tileCenterX,
          tileCenterY,
          centerScreenX,
          centerScreenY
        );
        if (dist <= clearRadius) continue;

        const t = Phaser.Math.Clamp((dist - clearRadius) / (maxRadius - clearRadius), 0, 1);
        const alpha = minAlpha + (maxAlpha - minAlpha) * t * t;
        this.overlay.fillStyle(color, alpha);
        this.overlay.fillRect(x, y, tileSize, tileSize);
      }
    }
  }
}

