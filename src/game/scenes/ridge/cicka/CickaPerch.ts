import type * as Phaser from 'phaser';
import {
  CICKA_ANIMATION_KEYS,
  CICKA_FRAME_INDEX,
  CICKA_ORIGIN,
  CICKA_RUNTIME_SCALE,
  CICKA_TEXTURE_KEY
} from './assets';
import {
  CICKA_INTERACTION_RESPONSE_DURATION_MS,
  CICKA_INTERACTION_TARGET_ID
} from './interaction';
import {
  createCickaWalkByState,
  updateCickaWalkBy,
  type CickaWalkByState
} from './walkBy';

const CICKA_INTERACT_RADIUS = 78;
const CICKA_PROMPT_OFFSET_Y = -86;
const CICKA_SPEECH_BUBBLE_OFFSET = { x: -20, y: -98 } as const;
const CICKA_SPRITE_OFFSET = { x: 14, y: -14 } as const;

export interface CickaPerchInteractionFacts {
  id: typeof CICKA_INTERACTION_TARGET_ID;
  kind: 'cicka';
  x: number;
  distanceAnchorY: number;
  prompt: {
    x: number;
    y: number;
  };
  interactRadius: number;
}

export interface CickaPerchUpdateFrame {
  playerX: number;
  playerY: number;
  nowMs: number;
}

export interface CickaPerch {
  interactionFacts: CickaPerchInteractionFacts;
  trackOwnedObject<GameObject extends Phaser.GameObjects.GameObject>(
    gameObject: GameObject
  ): GameObject;
  update(frame: CickaPerchUpdateFrame): void;
  showLine(line: string, nowMs: number, durationMs?: number): void;
  isSpeechVisible(nowMs: number): boolean;
  destroy(): void;
}

export interface CreateCickaPerchOptions {
  scene: Phaser.Scene;
  landmark: { x: number; y: number };
  hasStampedeNoteMutation: boolean;
  walkByLine: string;
}

export function createCickaPerch(options: CreateCickaPerchOptions): CickaPerch {
  const { scene, landmark, hasStampedeNoteMutation, walkByLine } = options;
  const x = landmark.x;
  const y = landmark.y;
  const ownedObjects: Phaser.GameObjects.GameObject[] = [];
  let walkByState: CickaWalkByState = createCickaWalkByState();
  let speechVisibleUntilMs = 0;
  let isDestroyed = false;

  const track = <GameObject extends Phaser.GameObjects.GameObject>(
    gameObject: GameObject
  ): GameObject => {
    ownedObjects.push(gameObject);
    return gameObject;
  };

  track(scene.add.rectangle(x, y + 78, 156, 20, 0xd7c78f, 0.96)
    .setStrokeStyle(3, 0x1f1f1d, 0.72));
  track(scene.add.rectangle(x - 58, y + 104, 12, 52, 0x1f1f1d, 0.66));
  track(scene.add.rectangle(x + 58, y + 104, 12, 52, 0x1f1f1d, 0.66));
  track(scene.add.rectangle(x + 82, y - 58, 82, 64, 0xf7f1df, 0.9)
    .setStrokeStyle(3, 0x1f1f1d, 0.28)
    .setAngle(2));
  track(scene.add.circle(x + 54, y - 78, 4, 0x1f1f1d, 0.52));
  track(scene.add.circle(x + 105, y - 74, 4, 0x1f1f1d, 0.52));
  track(scene.add.rectangle(x + 72, y - 52, 24, 18, 0xf0d35f, 0.38)
    .setStrokeStyle(1, 0x1f1f1d, 0.24)
    .setAngle(-6));
  track(scene.add.rectangle(x + 100, y - 39, 22, 16, 0xb85f5a, 0.28)
    .setStrokeStyle(1, 0x1f1f1d, 0.2)
    .setAngle(8));
  track(scene.add.rectangle(x - 46, y + 55, 38, 22, 0xf7f1df, 0.88)
    .setStrokeStyle(2, 0x1f1f1d, 0.34)
    .setAngle(4));
  track(scene.add.rectangle(x, y + 28, 10, 86, 0x1f1f1d, 0.88));
  track(scene.add.rectangle(x, y - 12, 86, 10, 0x1f1f1d, 0.88));
  track(scene.add.rectangle(x + 18, y - 32, 72, 32, 0xf7f1df, 0.94)
    .setStrokeStyle(2, 0x1f1f1d, 0.22)
    .setAngle(-2));
  track(scene.add.line(x + 8, y - 42, -20, 0, 20, 0, 0x1f1f1d, 0.16).setLineWidth(2));
  track(scene.add.line(x + 8, y - 31, -22, 0, 18, 0, 0x1f1f1d, 0.12).setLineWidth(2));

  const sprite = track(scene.add.sprite(
    x + CICKA_SPRITE_OFFSET.x,
    y + CICKA_SPRITE_OFFSET.y,
    CICKA_TEXTURE_KEY,
    CICKA_FRAME_INDEX.perchSit
  )
    .setOrigin(CICKA_ORIGIN.x, CICKA_ORIGIN.y)
    .setScale(CICKA_RUNTIME_SCALE)
    .setDepth(26));
  sprite.play(CICKA_ANIMATION_KEYS.perchIdle);

  const speechBubble = createCickaSpeechBubble(
    scene,
    track,
    x + CICKA_SPEECH_BUBBLE_OFFSET.x,
    y + CICKA_SPEECH_BUBBLE_OFFSET.y
  );

  const interactionFacts: CickaPerchInteractionFacts = {
    id: CICKA_INTERACTION_TARGET_ID,
    kind: 'cicka',
    x,
    distanceAnchorY: y,
    prompt: {
      x,
      y: y + CICKA_PROMPT_OFFSET_Y
    },
    interactRadius: CICKA_INTERACT_RADIUS
  };

  function isSpeechVisible(nowMs: number): boolean {
    return nowMs < speechVisibleUntilMs;
  }

  function showLine(
    line: string,
    nowMs: number,
    durationMs: number = CICKA_INTERACTION_RESPONSE_DURATION_MS
  ): void {
    speechBubble.label.setText(line);
    speechVisibleUntilMs = nowMs + durationMs;
    speechBubble.container.setVisible(true);
    sprite.play(CICKA_ANIMATION_KEYS.notice, true);
  }

  function update(frame: CickaPerchUpdateFrame): void {
    const walkByUpdate = updateCickaWalkBy(walkByState, {
      enabled: hasStampedeNoteMutation,
      playerX: frame.playerX,
      playerY: frame.playerY,
      cickaX: x,
      cickaY: y,
      nowMs: frame.nowMs
    });

    walkByState = walkByUpdate.state;
    if (walkByUpdate.triggered) {
      showLine(
        walkByLine,
        frame.nowMs,
        Math.max(0, walkByUpdate.state.visibleUntilMs - frame.nowMs)
      );
    }

    const visible = isSpeechVisible(frame.nowMs);
    speechBubble.container.setVisible(visible);
    if (!visible) {
      sprite.play(CICKA_ANIMATION_KEYS.perchIdle, true);
    }
  }

  function destroy(): void {
    if (isDestroyed) return;
    isDestroyed = true;
    ownedObjects.forEach((gameObject) => gameObject.destroy());
    ownedObjects.length = 0;
  }

  return {
    interactionFacts,
    trackOwnedObject: track,
    update,
    showLine,
    isSpeechVisible,
    destroy
  };
}

function createCickaSpeechBubble(
  scene: Phaser.Scene,
  track: <GameObject extends Phaser.GameObjects.GameObject>(gameObject: GameObject) => GameObject,
  x: number,
  y: number
): { container: Phaser.GameObjects.Container; label: Phaser.GameObjects.Text } {
  const container = track(scene.add.container(x, y).setDepth(45).setVisible(false));
  const panel = scene.add.rectangle(0, 0, 66, 28, 0xf7f1df, 1)
    .setStrokeStyle(2, 0x1f1f1d, 0.88);
  const tail = scene.add.line(22, 14, 0, 0, 13, 13, 0x1f1f1d, 0.5).setLineWidth(2);
  const label = scene.add.text(0, -1, '', {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#1f1f1d'
  }).setOrigin(0.5);

  container.add([panel, tail, label]);
  return { container, label };
}

