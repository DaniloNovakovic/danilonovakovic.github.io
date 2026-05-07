import type * as Phaser from 'phaser';
import { STAMPEDE_ARENA } from './movement';

export type StampedeResultPhase = 'cleared' | 'failed';
export type StampedeResultActionId = 'backToRidge' | 'retry';
export type StampedeResultActionPriority = 'primary' | 'secondary';

export interface StampedeResultViewModelInput {
  phase: StampedeResultPhase;
  elapsedMs: number;
  durationMs: number;
  contacts: number;
}

export interface StampedeResultStatViewModel {
  id: 'time' | 'contacts';
  label: string;
  value: string;
}

export interface StampedeResultActionViewModel {
  id: StampedeResultActionId;
  label: string;
  priority: StampedeResultActionPriority;
}

export interface StampedeResultViewModel {
  phase: StampedeResultPhase;
  eyebrow: string;
  title: string;
  body: string;
  rewardNote: string;
  stats: readonly StampedeResultStatViewModel[];
  actions: readonly StampedeResultActionViewModel[];
}

export interface StampedeResultButtonBounds {
  id: StampedeResultActionId;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StampedeResultPresentationCallbacks {
  onRetry: () => void;
  onBack: () => void;
}

export interface StampedeResultPresentationShowInput
  extends StampedeResultPresentationCallbacks {
  view: StampedeResultViewModel;
}

interface StampedeResultPresentationOptions {
  scene: Phaser.Scene;
}

export interface StampedeResultPresentationRuntime {
  show(input: StampedeResultPresentationShowInput): void;
  hide(): void;
  destroy(): void;
  getButtonBounds(): readonly StampedeResultButtonBounds[];
}

export function createStampedeResultViewModel(
  input: StampedeResultViewModelInput
): StampedeResultViewModel {
  const clear = input.phase === 'cleared';

  return {
    phase: input.phase,
    eyebrow: clear ? 'Run complete' : 'Run ended',
    title: clear ? 'Blanket held' : 'Page got crowded',
    body: clear
      ? 'The sketch stayed calm through the whole stampede.'
      : 'Too many marks landed before the timer ran out.',
    rewardNote: 'No stamp yet. Rewards are still taped over.',
    stats: [
      {
        id: 'time',
        label: 'Time',
        value: formatResultTime(input.elapsedMs, input.durationMs)
      },
      {
        id: 'contacts',
        label: 'Contacts',
        value: `${Math.max(0, input.contacts)}`
      }
    ],
    actions: clear
      ? [
          {
            id: 'backToRidge',
            label: 'Back to Ridge',
            priority: 'primary'
          },
          {
            id: 'retry',
            label: 'Retry',
            priority: 'secondary'
          }
        ]
      : [
          {
            id: 'retry',
            label: 'Retry',
            priority: 'primary'
          },
          {
            id: 'backToRidge',
            label: 'Back to Ridge',
            priority: 'secondary'
          }
        ]
  };
}

export function createStampedeResultPresentationRuntime(
  options: StampedeResultPresentationOptions
): StampedeResultPresentationRuntime {
  return new PhaserStampedeResultPresentationRuntime(options.scene);
}

class PhaserStampedeResultPresentationRuntime
  implements StampedeResultPresentationRuntime {
  private readonly scene: Phaser.Scene;
  private root?: Phaser.GameObjects.Container;
  private buttonBounds: StampedeResultButtonBounds[] = [];
  private actionFired = false;
  private pointerDownHandler?: (pointer: Phaser.Input.Pointer) => void;
  private pointerUpHandler?: (pointer: Phaser.Input.Pointer) => void;
  private canvasPointerHandler?: (event: PointerEvent | MouseEvent) => void;
  private keyboardHandler?: (event: KeyboardEvent) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(input: StampedeResultPresentationShowInput): void {
    this.hide();

    const centerX = (STAMPEDE_ARENA.left + STAMPEDE_ARENA.right) / 2;
    const centerY = (STAMPEDE_ARENA.top + STAMPEDE_ARENA.bottom) / 2;
    const width = Math.min(372, STAMPEDE_ARENA.safeRight - STAMPEDE_ARENA.safeLeft);
    const height = 294;
    const left = centerX - width / 2;
    const top = centerY - height / 2;

    const children: Phaser.GameObjects.GameObject[] = [
      this.scene.add.rectangle(8, 10, width, height, 0x1a1a1a, 0.16)
        .setOrigin(0, 0),
      this.scene.add.rectangle(0, 0, width, height, 0xfbfbf9, 0.97)
        .setOrigin(0, 0)
        .setStrokeStyle(5, 0x1a1a1a, 0.95),
      this.scene.add.line(18, 18, 0, 0, 34, -10, 0x1a1a1a, 0.32)
        .setLineWidth(3),
      this.scene.add.line(width - 22, height - 18, 0, 0, -36, 12, 0x1a1a1a, 0.26)
        .setLineWidth(3),
      this.scene.add.text(width / 2, 28, input.view.eyebrow, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#4b4337',
        align: 'center'
      }).setOrigin(0.5),
      this.scene.add.text(width / 2, 58, input.view.title, {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#1a1a1a',
        align: 'center'
      }).setOrigin(0.5),
      this.scene.add.text(width / 2, 90, input.view.body, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#4b4337',
        align: 'center',
        fixedWidth: width - 52,
        wordWrap: { width: width - 52 }
      }).setOrigin(0.5, 0),
      this.scene.add.text(width / 2, 178, input.view.rewardNote, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#4b4337',
        align: 'center',
        fixedWidth: width - 56,
        wordWrap: { width: width - 56 }
      }).setOrigin(0.5)
    ];

    children.push(...this.createStats(input.view, width));
    children.push(...this.createButtons(input, width, height, left, top));

    this.root = this.scene.add.container(left, top, children).setDepth(130);
    this.registerPointerRouting(input);
    this.registerKeyboardRouting(input);
  }

  hide(): void {
    this.unregisterPointerRouting();
    this.unregisterKeyboardRouting();
    this.root?.destroy(true);
    this.root = undefined;
    this.buttonBounds = [];
    this.actionFired = false;
  }

  destroy(): void {
    this.hide();
  }

  getButtonBounds(): readonly StampedeResultButtonBounds[] {
    return this.buttonBounds.map((bounds) => ({ ...bounds }));
  }

  private createStats(
    view: StampedeResultViewModel,
    width: number
  ): Phaser.GameObjects.GameObject[] {
    return view.stats.flatMap((stat, index) => {
      const statWidth = 128;
      const x = width / 2 - statWidth - 8 + index * (statWidth + 16);
      const y = 122;

      return [
        this.scene.add.rectangle(x, y, statWidth, 44, 0xf4f1ea, 1)
          .setOrigin(0, 0)
          .setStrokeStyle(3, 0x1a1a1a, 0.78),
        this.scene.add.text(x + 12, y + 8, stat.label, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#4b4337'
        }),
        this.scene.add.text(x + statWidth - 12, y + 24, stat.value, {
          fontFamily: 'monospace',
          fontSize: '17px',
          color: '#1a1a1a'
        }).setOrigin(1, 0.5)
      ];
    });
  }

  private createButtons(
    input: StampedeResultPresentationShowInput,
    width: number,
    height: number,
    panelLeft: number,
    panelTop: number
  ): Phaser.GameObjects.GameObject[] {
    const buttonWidth = 156;
    const buttonHeight = 60;
    const gap = 18;
    const startX = width / 2 - buttonWidth - gap / 2;
    const y = height - 86;

    return input.view.actions.flatMap((action, index) => {
      const x = startX + index * (buttonWidth + gap);
      const primary = action.priority === 'primary';
      const bounds = {
        id: action.id,
        x: panelLeft + x,
        y: panelTop + y,
        width: buttonWidth,
        height: buttonHeight
      };
      this.buttonBounds.push(bounds);
      const fireAction = () => this.fireAction(action.id, input);

      const shadow = this.scene.add.rectangle(
        x + 5,
        y + 6,
        buttonWidth,
        buttonHeight,
        0x1a1a1a,
        0.16
      )
        .setOrigin(0, 0);
      const button = this.scene.add.rectangle(
        x,
        y,
        buttonWidth,
        buttonHeight,
        primary ? 0x1a1a1a : 0xfbfbf9,
        1
      )
        .setOrigin(0, 0)
        .setStrokeStyle(4, 0x1a1a1a, 1)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', fireAction)
        .on('pointerup', fireAction);
      const label = this.scene.add.text(
        x + buttonWidth / 2,
        y + buttonHeight / 2,
        action.label,
        {
          fontFamily: 'monospace',
          fontSize: primary ? '16px' : '15px',
          color: primary ? '#fbfbf9' : '#1a1a1a',
          align: 'center'
        }
      )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', fireAction)
        .on('pointerup', fireAction);
      const zone = this.scene.add.zone(
        x + buttonWidth / 2,
        y + buttonHeight / 2,
        buttonWidth,
        buttonHeight
      )
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', fireAction)
        .on('pointerup', fireAction);

      return [shadow, button, label, zone];
    });
  }

  private registerPointerRouting(input: StampedeResultPresentationShowInput): void {
    this.unregisterPointerRouting();
    const pointerHandler = (pointer: Phaser.Input.Pointer) => {
      const action = this.buttonBounds.find((bounds) =>
        pointIsWithinBounds(pointer.worldX, pointer.worldY, bounds)
      );
      if (!action) return;

      this.fireAction(action.id, input);
    };
    this.pointerDownHandler = pointerHandler;
    this.pointerUpHandler = pointerHandler;
    this.scene.input.on('pointerdown', this.pointerDownHandler);
    this.scene.input.on('pointerup', this.pointerUpHandler);

    const canvas = this.scene.game.canvas;
    this.canvasPointerHandler = (event: PointerEvent | MouseEvent) => {
      const point = resolveCanvasPoint(event, canvas);
      const action = this.buttonBounds.find((bounds) =>
        pointIsWithinBounds(point.x, point.y, bounds)
      );
      if (!action) return;

      this.fireAction(action.id, input);
    };
    canvas.addEventListener('pointerdown', this.canvasPointerHandler);
    canvas.addEventListener('pointerup', this.canvasPointerHandler);
    canvas.addEventListener('mousedown', this.canvasPointerHandler);
    canvas.addEventListener('mouseup', this.canvasPointerHandler);
  }

  private unregisterPointerRouting(): void {
    if (this.pointerDownHandler) {
      this.scene.input.off('pointerdown', this.pointerDownHandler);
      this.pointerDownHandler = undefined;
    }
    if (this.pointerUpHandler) {
      this.scene.input.off('pointerup', this.pointerUpHandler);
      this.pointerUpHandler = undefined;
    }
    if (this.canvasPointerHandler) {
      const canvas = this.scene.game.canvas;
      canvas.removeEventListener('pointerdown', this.canvasPointerHandler);
      canvas.removeEventListener('pointerup', this.canvasPointerHandler);
      canvas.removeEventListener('mousedown', this.canvasPointerHandler);
      canvas.removeEventListener('mouseup', this.canvasPointerHandler);
      this.canvasPointerHandler = undefined;
    }
  }

  private fireAction(
    actionId: StampedeResultActionId,
    callbacks: StampedeResultPresentationCallbacks
  ): void {
    if (this.actionFired) return;
    this.actionFired = true;

    if (actionId === 'retry') {
      callbacks.onRetry();
      return;
    }

    callbacks.onBack();
  }

  private registerKeyboardRouting(input: StampedeResultPresentationCallbacks): void {
    this.unregisterKeyboardRouting();
    this.keyboardHandler = (event: KeyboardEvent) => {
      if (event.repeat) return;

      switch (event.key.toLowerCase()) {
        case 'r':
        case 'enter':
        case ' ':
          event.preventDefault();
          this.fireAction('retry', input);
          return;
        case 'e':
        case 'h':
        case 'escape':
          event.preventDefault();
          this.fireAction('backToRidge', input);
          return;
        default:
          return;
      }
    };
    window.addEventListener('keydown', this.keyboardHandler);
  }

  private unregisterKeyboardRouting(): void {
    if (!this.keyboardHandler) return;
    window.removeEventListener('keydown', this.keyboardHandler);
    this.keyboardHandler = undefined;
  }
}

function formatResultTime(elapsedMs: number, durationMs: number): string {
  const boundedElapsedMs = clamp(elapsedMs, 0, Math.max(0, durationMs));
  const wholeSeconds = Math.max(0, Math.ceil(boundedElapsedMs / 1000));
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = `${wholeSeconds % 60}`.padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pointIsWithinBounds(
  x: number,
  y: number,
  bounds: StampedeResultButtonBounds
): boolean {
  return (
    x >= bounds.x &&
    x <= bounds.x + bounds.width &&
    y >= bounds.y &&
    y <= bounds.y + bounds.height
  );
}

function resolveCanvasPoint(
  event: PointerEvent | MouseEvent,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height)
  };
}
