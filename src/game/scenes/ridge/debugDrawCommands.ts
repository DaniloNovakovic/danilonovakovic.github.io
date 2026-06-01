import type * as Phaser from 'phaser';

export type RidgeDebugDrawCommand =
  | {
      kind: 'rect';
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fillColor: number;
      fillAlpha: number;
      strokeColor: number;
      strokeAlpha: number;
      lineWidth: number;
    }
  | {
      kind: 'circle';
      id: string;
      x: number;
      y: number;
      radius: number;
      fillColor: number;
      fillAlpha: number;
      strokeColor: number;
      strokeAlpha: number;
      lineWidth: number;
    }
  | {
      kind: 'line';
      id: string;
      from: { x: number; y: number };
      to: { x: number; y: number };
      strokeColor: number;
      strokeAlpha: number;
      lineWidth: number;
    };

export function renderRidgeDebugDrawCommands(
  graphics: Phaser.GameObjects.Graphics,
  commands: readonly RidgeDebugDrawCommand[]
): void {
  graphics.clear();
  graphics.setVisible(commands.length > 0);
  commands.forEach((command) => drawRidgeDebugCommand(graphics, command));
}

function drawRidgeDebugCommand(
  graphics: Phaser.GameObjects.Graphics,
  command: RidgeDebugDrawCommand
): void {
  switch (command.kind) {
    case 'rect':
      graphics.fillStyle(command.fillColor, command.fillAlpha);
      graphics.lineStyle(command.lineWidth, command.strokeColor, command.strokeAlpha);
      graphics.fillRect(
        command.x - command.width / 2,
        command.y - command.height / 2,
        command.width,
        command.height
      );
      graphics.strokeRect(
        command.x - command.width / 2,
        command.y - command.height / 2,
        command.width,
        command.height
      );
      return;
    case 'circle':
      graphics.fillStyle(command.fillColor, command.fillAlpha);
      graphics.lineStyle(command.lineWidth, command.strokeColor, command.strokeAlpha);
      graphics.fillCircle(command.x, command.y, command.radius);
      graphics.strokeCircle(command.x, command.y, command.radius);
      return;
    case 'line':
      graphics.lineStyle(command.lineWidth, command.strokeColor, command.strokeAlpha);
      graphics.lineBetween(command.from.x, command.from.y, command.to.x, command.to.y);
      return;
    default:
      assertNever(command);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled Ridge debug draw command: ${JSON.stringify(value)}`);
}
