import * as Phaser from 'phaser';
import {
  resolveStampedeVelocity,
  type StampedeVelocity
} from './movement';
import {
  beginStampedePointerControl,
  createStampedePointerControlState,
  endStampedePointerControl,
  moveStampedePointerControl,
  readStampedePointerInput,
  type StampedePointerControlState
} from './pointerControl';

export type StampedeControlPointerEventKind = 'down' | 'move' | 'up' | 'cancel';

export interface StampedeControlPointerEvent {
  kind: StampedeControlPointerEventKind;
  pointerId: number;
  x: number;
  y: number;
}

interface StampedeInputRuntimeOptions {
  scene: Phaser.Scene;
}

export interface StampedeInputRuntime {
  readVelocity(): StampedeVelocity;
  startRequested(): boolean;
  closeRequested(): boolean;
  retryRequested(): boolean;
  handleControlPointerEvent(event: StampedeControlPointerEvent): void;
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
  private shellPointerVisualActive = false;
  private pointerControl: StampedePointerControlState = createStampedePointerControlState();

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

  handleControlPointerEvent(event: StampedeControlPointerEvent): void {
    if (!this.pointerControlsEnabled && event.kind !== 'cancel' && event.kind !== 'up') return;

    switch (event.kind) {
      case 'down':
        this.shellPointerVisualActive = true;
        this.startTapQueued = true;
        this.beginPointerControl(event.pointerId, event.x, event.y);
        return;
      case 'move':
        this.shellPointerVisualActive = true;
        this.movePointerControl(event.pointerId, event.x, event.y);
        return;
      case 'up':
      case 'cancel':
        this.shellPointerVisualActive = true;
        this.endPointerControl(event.pointerId);
        this.shellPointerVisualActive = false;
        return;
    }
  }

  setPointerControlEnabled(enabled: boolean): void {
    this.pointerControlsEnabled = enabled;
    if (!enabled) {
      this.clearPointerControl();
      this.updateStickVisuals();
    }
  }

  clearPointerControl(): void {
    this.pointerControl = createStampedePointerControlState();
  }

  updateStickVisuals(): void {
    const pointerInput = this.pointerControlsEnabled
      ? readStampedePointerInput(this.pointerControl)
      : { active: false, deltaX: 0, deltaY: 0 };

    const showStick = pointerInput.active && !this.shellPointerVisualActive;
    this.stickBase.setVisible(showStick);
    this.stickLine.setVisible(showStick);
    this.stickKnob.setVisible(showStick);
    if (!showStick) return;

    const dx = pointerInput.deltaX;
    const dy = pointerInput.deltaY;
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
      this.beginPointerControl(pointer.id, pointer.worldX, pointer.worldY);
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.movePointerControl(pointer.id, pointer.worldX, pointer.worldY);
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.endPointerControl(pointer.id);
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
    if (!this.pointerControlsEnabled) {
      if (this.pointerControl.active) {
        this.clearPointerControl();
      }
      return { active: false, deltaX: 0, deltaY: 0 };
    }

    return readStampedePointerInput(this.pointerControl);
  }

  private beginPointerControl(pointerId: number, x: number, y: number): void {
    this.pointerControl = beginStampedePointerControl({ pointerId, x, y });
    this.updateStickVisuals();
  }

  private movePointerControl(pointerId: number, x: number, y: number): void {
    const next = moveStampedePointerControl(this.pointerControl, { pointerId, x, y });
    if (next === this.pointerControl) return;
    this.pointerControl = next;
    this.updateStickVisuals();
  }

  private endPointerControl(pointerId: number): void {
    const next = endStampedePointerControl(this.pointerControl, pointerId);
    if (next === this.pointerControl) return;
    this.pointerControl = next;
    this.updateStickVisuals();
  }
}
