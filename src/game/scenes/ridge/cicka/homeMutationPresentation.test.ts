import type * as Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { STAMPEDE_SKETCH_RIDGE_STAMP_ID } from '@/game/bridge/ridgeProgressIds';
import { addCickaHomeMutationPresentation } from './homeMutationPresentation';
import type { CickaHomeMutation } from './homeMutations';

describe('Cicka Home mutation presentation', () => {
  it('tracks Stampede note visuals for perch lifecycle cleanup', () => {
    const scene = createScene();
    const trackedObjects: Phaser.GameObjects.GameObject[] = [];

    addCickaHomeMutationPresentation({
      scene: scene.scene,
      landmark: { x: 100, y: 200 },
      mutations: [createStampedeNoteMutation()],
      track: (gameObject) => {
        trackedObjects.push(gameObject);
        return gameObject;
      }
    });

    expect(trackedObjects).toHaveLength(8);
    expect(scene.add.rectangle).toHaveBeenCalledTimes(1);
    expect(scene.add.line).toHaveBeenCalledTimes(3);
    expect(scene.add.circle).toHaveBeenCalledTimes(4);
  });
});

function createStampedeNoteMutation(): CickaHomeMutation {
  return {
    id: 'stampede_sketch',
    adds: 'stampede_note',
    opens: 'fold_drop_landing',
    attrs: {
      adds: 'stampede_note',
      opens: 'fold_drop_landing'
    },
    source: {
      kind: 'stamp',
      id: STAMPEDE_SKETCH_RIDGE_STAMP_ID
    }
  };
}

function createScene(): {
  scene: Phaser.Scene;
  add: {
    rectangle: ReturnType<typeof vi.fn>;
    line: ReturnType<typeof vi.fn>;
    circle: ReturnType<typeof vi.fn>;
  };
} {
  const add = {
    rectangle: vi.fn(() => createGameObject()),
    line: vi.fn(() => createGameObject()),
    circle: vi.fn(() => createGameObject())
  };

  return {
    scene: {
      add
    } as unknown as Phaser.Scene,
    add
  };
}

function createGameObject(): Phaser.GameObjects.GameObject {
  const gameObject = {
    setStrokeStyle: vi.fn(() => gameObject),
    setAngle: vi.fn(() => gameObject),
    setLineWidth: vi.fn(() => gameObject),
    destroy: vi.fn()
  };

  return gameObject as unknown as Phaser.GameObjects.GameObject;
}
