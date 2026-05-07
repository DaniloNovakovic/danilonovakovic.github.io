import * as Phaser from 'phaser';
import { STAMPEDE_ARENA } from './movement';

interface StampedeStartPromptRuntimeOptions {
  scene: Phaser.Scene;
}

export interface StampedeStartPromptRuntime {
  show(): void;
  hide(): void;
  destroy(): void;
}

export function createStampedeStartPromptRuntime(
  options: StampedeStartPromptRuntimeOptions
): StampedeStartPromptRuntime {
  return new PhaserStampedeStartPromptRuntime(options.scene);
}

class PhaserStampedeStartPromptRuntime implements StampedeStartPromptRuntime {
  private readonly root: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    const x = (STAMPEDE_ARENA.left + STAMPEDE_ARENA.right) / 2;
    const y = 226;
    const panel = scene.add.rectangle(0, 0, 278, 104, 0xffffff, 0.94)
      .setStrokeStyle(4, 0x1a1a1a, 0.88);
    const title = createPromptText(scene, 0, -28, 'Ready?', 23, '#1a1a1a')
      .setOrigin(0.5);
    const action = createPromptText(scene, 0, 4, 'Tap or Enter / Space', 14, '#1a1a1a')
      .setOrigin(0.5);
    const hint = createPromptText(scene, 0, 30, 'Then drag or WASD.', 11, '#4b4337')
      .setOrigin(0.5);

    this.root = scene.add.container(x, y, [
      panel,
      title,
      action,
      hint
    ])
      .setDepth(85)
      .setVisible(false);
  }

  show(): void {
    this.root.setVisible(true);
  }

  hide(): void {
    this.root.setVisible(false);
  }

  destroy(): void {
    this.root.destroy(true);
  }
}

function createPromptText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  fontSize: number,
  color: string
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: 'monospace',
    fontSize: `${fontSize}px`,
    color
  });
}
