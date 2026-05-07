import * as Phaser from 'phaser';
import {
  resolveStampedeVelocity,
  type StampedeVelocity
} from './movement';

interface StampedePointerControl {
  active: boolean;
  pointerId: number | null;
  anchorX: number;
  anchorY: number;
}

interface StampedeInputRuntimeOptions {
  scene: Phaser.Scene;
}

export interface StampedeInputRuntime {
  readVelocity(): StampedeVelocity;
  startRequested(): boolean;
  closeRequested(): boolean;
  retryRequested(): boolean;
  setPointerControlEnabled(enabled: boolean): void;
  clearPointerControl(): void;
  updateStickVisuals(): void;
}

export function createStampedeInputRuntime(
  options: StampedeInputRuntimeOptions
): StampedeInputRuntime {
  return new PhaserStampedeInputRuntime(options);
}

class PhaserStampedeInputRuntime implements StampedeInputRuntime {
  private readonly scene: Phaser.Scene;
  private readonly cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keyW?: Phaser.Input.Keyboard.Key;
  private readonly keyA?: Phaser.Input.Keyboard.Key;
  private readonly keyS?: Phaser.Input.Keyboard.Key;
  private readonly keyD?: Phaser.Input.Keyboard.Key;
  private readonly keyE?: Phaser.Input.Keyboard.Key;
  private readonly keyH?: Phaser.Input.Keyboard.Key;
  private readonly keyEsc?: Phaser.Input.Keyboard.Key;
  private readonly keyR?: Phaser.Input.Keyboard.Key;
  private readonly keyEnter?: Phaser.Input.Keyboard.Key;
  private readonly keySpace?: Phaser.Input.Keyboard.Key;
  private readonly stickBase: Phaser.GameObjects.Arc;
  private readonly stickKnob: Phaser.GameObjects.Arc;
  private readonly stickLine: Phaser.GameObjects.Line;
  private pointerControlsEnabled = true;
  private startTapQueued = false;

  private pointerControl: StampedePointerControl = {
    active: false,
    pointerId: null,
    anchorX: 0,
    anchorY: 0
  };

  constructor({ scene }: StampedeInputRuntimeOptions) {
    this.scene = scene;

    const keyboard = scene.input.keyboard;
    this.cursors = keyboard?.createCursorKeys();
    this.keyW = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyE = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyH = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    this.keyEsc = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyR = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyEnter = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.keySpace = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.stickBase = scene.add.circle(0, 0, 34, 0xfbfbf9, 0.72)
      .setStrokeStyle(3, 0x1a1a1a, 0.75)
      .setDepth(90)
      .setVisible(false);
    this.stickLine = scene.add.line(0, 0, 0, 0, 0, 0, 0x1a1a1a, 0.5)
      .setLineWidth(4)
      .setDepth(91)
      .setVisible(false);
    this.stickKnob = scene.add.circle(0, 0, 12, 0x1a1a1a, 0.72)
      .setDepth(92)
      .setVisible(false);

    this.registerPointerControls();
  }

  readVelocity(): StampedeVelocity {
    return resolveStampedeVelocity({
      keyboard: this.readKeyboardAxis(),
      pointer: this.readPointerInput()
    });
  }

  startRequested(): boolean {
    const justDown = Phaser.Input.Keyboard.JustDown;
    const keyboardStart = Boolean(
      (this.keyEnter && justDown(this.keyEnter)) ||
        (this.keySpace && justDown(this.keySpace))
    );
    const pointerStart = this.startTapQueued;
    this.startTapQueued = false;

    return keyboardStart || pointerStart;
  }

  closeRequested(): boolean {
    const justDown = Phaser.Input.Keyboard.JustDown;
    return Boolean(
      (this.keyE && justDown(this.keyE)) ||
        (this.keyH && justDown(this.keyH)) ||
        (this.keyEsc && justDown(this.keyEsc))
    );
  }

  retryRequested(): boolean {
    const justDown = Phaser.Input.Keyboard.JustDown;
    return Boolean(
      (this.keyR && justDown(this.keyR)) ||
        (this.keyEnter && justDown(this.keyEnter)) ||
        (this.keySpace && justDown(this.keySpace))
    );
  }

  setPointerControlEnabled(enabled: boolean): void {
    this.pointerControlsEnabled = enabled;
    if (!enabled) {
      this.clearPointerControl();
      this.updateStickVisuals();
    }
  }

  clearPointerControl(): void {
    this.pointerControl = {
      active: false,
      pointerId: null,
      anchorX: 0,
      anchorY: 0
    };
  }

  updateStickVisuals(): void {
    const pointer = this.scene.input.activePointer;
    const active =
      this.pointerControlsEnabled &&
      this.pointerControl.active &&
      this.pointerControl.pointerId === pointer.id &&
      pointer.isDown;

    this.stickBase.setVisible(active);
    this.stickLine.setVisible(active);
    this.stickKnob.setVisible(active);
    if (!active) return;

    const dx = pointer.worldX - this.pointerControl.anchorX;
    const dy = pointer.worldY - this.pointerControl.anchorY;
    const distance = Math.hypot(dx, dy);
    const maxDistance = 44;
    const scale = distance > maxDistance ? maxDistance / distance : 1;
    const knobX = this.pointerControl.anchorX + dx * scale;
    const knobY = this.pointerControl.anchorY + dy * scale;

    this.stickBase.setPosition(this.pointerControl.anchorX, this.pointerControl.anchorY);
    this.stickKnob.setPosition(knobX, knobY);
    this.stickLine.setPosition(this.pointerControl.anchorX, this.pointerControl.anchorY);
    this.stickLine.setTo(0, 0, knobX - this.pointerControl.anchorX, knobY - this.pointerControl.anchorY);
  }

  private registerPointerControls(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.pointerControlsEnabled) return;
      this.startTapQueued = true;
      this.pointerControl = {
        active: true,
        pointerId: pointer.id,
        anchorX: pointer.worldX,
        anchorY: pointer.worldY
      };
      this.updateStickVisuals();
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.pointerControl.pointerId !== pointer.id) return;
      this.clearPointerControl();
      this.updateStickVisuals();
    });
  }

  private readKeyboardAxis(): { x: number; y: number } {
    const left = Boolean(this.cursors?.left.isDown || this.keyA?.isDown);
    const right = Boolean(this.cursors?.right.isDown || this.keyD?.isDown);
    const up = Boolean(this.cursors?.up.isDown || this.keyW?.isDown);
    const down = Boolean(this.cursors?.down.isDown || this.keyS?.isDown);

    return {
      x: (right ? 1 : 0) - (left ? 1 : 0),
      y: (down ? 1 : 0) - (up ? 1 : 0)
    };
  }

  private readPointerInput(): { active: boolean; deltaX: number; deltaY: number } {
    const pointer = this.scene.input.activePointer;
    const active =
      this.pointerControlsEnabled &&
      this.pointerControl.active &&
      this.pointerControl.pointerId === pointer.id &&
      pointer.isDown;

    if (!active) {
      if (this.pointerControl.active) this.clearPointerControl();
      return { active: false, deltaX: 0, deltaY: 0 };
    }

    return {
      active: true,
      deltaX: pointer.worldX - this.pointerControl.anchorX,
      deltaY: pointer.worldY - this.pointerControl.anchorY
    };
  }
}
