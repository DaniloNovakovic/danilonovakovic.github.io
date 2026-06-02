import {
  type RidgeDebugDrawCommand
} from '../debugDrawCommands';
import type {
  RidgeBlockoutGeometry,
  RidgeBlockoutAssistZone,
  RidgeBlockoutCollider
} from '../blockout';
import type { RidgeDevDebugSettings } from './ridgeDevControls';
import type { RidgeInteractionTarget } from './ridgeInteractionTargets';
import type { RidgeTraversalRuntimeState } from './ridgeTraversalRuntime';

export interface RidgeDebugOverlayPlayer {
  x: number;
  y: number;
  body?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type { RidgeDebugDrawCommand } from '../debugDrawCommands';

export interface RidgeDebugDrawCommandOptions {
  geometry: RidgeBlockoutGeometry;
  interactionTargets: readonly RidgeInteractionTarget[];
  player?: RidgeDebugOverlayPlayer;
  settings: RidgeDevDebugSettings;
  traversalState?: RidgeTraversalRuntimeState;
  defaultInteractRadius?: number;
}

const DEFAULT_INTERACT_RADIUS = 72;

export function createRidgeDebugDrawCommands(
  options: RidgeDebugDrawCommandOptions
): RidgeDebugDrawCommand[] {
  const commands: RidgeDebugDrawCommand[] = [];
  const enabled = getEffectiveDebugSettings(options.settings);
  if (!isAnyDebugSettingEnabled(enabled)) return commands;

  if (options.settings.graybox) {
    commands.push(createGrayboxWash(options.geometry));
    options.geometry.roomBounds.forEach((room) => {
      commands.push({
        kind: 'rect',
        id: `room:${room.roomId}`,
        x: room.x + room.width / 2,
        y: room.y + room.height / 2,
        width: room.width,
        height: room.height,
        fillColor: 0xfbfbf9,
        fillAlpha: 0.04,
        strokeColor: 0x1a1a1a,
        strokeAlpha: 0.24,
        lineWidth: 3
      });
    });
    options.geometry.anchorPoints.forEach((anchor) => {
      commands.push({
        kind: 'circle',
        id: `anchor:${anchor.roomId}:${anchor.symbol}:${anchor.attrs.id ?? anchor.kind}`,
        x: anchor.x,
        y: anchor.y,
        radius: 11,
        fillColor: 0xfbfbf9,
        fillAlpha: 0.45,
        strokeColor: 0x1a1a1a,
        strokeAlpha: 0.62,
        lineWidth: 2
      });
    });
  }

  if (enabled.showColliders) {
    options.geometry.colliders.forEach((collider) => {
      commands.push(createColliderCommand(collider));
    });
  }

  if (enabled.showTraversalAssists) {
    options.geometry.assistZones.forEach((zone) => {
      commands.push(createAssistZoneLineCommand(zone, options.traversalState));
      commands.push(createAssistZoneBoundsCommand(zone, options.traversalState));
    });
  }

  if (enabled.showInteractZones) {
    const defaultRadius = options.defaultInteractRadius ?? DEFAULT_INTERACT_RADIUS;
    options.interactionTargets.forEach((target) => {
      const radius = target.interactRadius ?? defaultRadius;
      commands.push({
        kind: 'circle',
        id: `interact:${target.id}`,
        x: target.x,
        y: target.distanceAnchorY,
        radius,
        fillColor: 0xf0d35f,
        fillAlpha: 0.08,
        strokeColor: 0xb85f5a,
        strokeAlpha: 0.72,
        lineWidth: 3
      });
      commands.push({
        kind: 'rect',
        id: `interact-prompt:${target.id}`,
        x: target.prompt.x,
        y: target.prompt.y,
        width: 18,
        height: 18,
        fillColor: 0xb85f5a,
        fillAlpha: 0.24,
        strokeColor: 0x1a1a1a,
        strokeAlpha: 0.55,
        lineWidth: 2
      });
    });
  }

  if (enabled.showPlayerBody && options.player?.body) {
    const body = options.player.body;
    commands.push({
      kind: 'rect',
      id: 'player-body',
      x: body.x + body.width / 2,
      y: body.y + body.height / 2,
      width: body.width,
      height: body.height,
      fillColor: 0x596f8f,
      fillAlpha: 0.12,
      strokeColor: 0x596f8f,
      strokeAlpha: 0.92,
      lineWidth: 3
    });
    commands.push({
      kind: 'circle',
      id: 'player-origin',
      x: options.player.x,
      y: options.player.y,
      radius: 6,
      fillColor: 0x596f8f,
      fillAlpha: 0.65,
      strokeColor: 0x1a1a1a,
      strokeAlpha: 0.6,
      lineWidth: 2
    });
  }

  return commands;
}

function getEffectiveDebugSettings(settings: RidgeDevDebugSettings): RidgeDevDebugSettings {
  if (!settings.graybox) return settings;
  return {
    ...settings,
    showColliders: true,
    showPlayerBody: true,
    showInteractZones: true,
    showTraversalAssists: true
  };
}

function isAnyDebugSettingEnabled(settings: RidgeDevDebugSettings): boolean {
  return settings.graybox ||
    settings.showColliders ||
    settings.showPlayerBody ||
    settings.showInteractZones ||
    settings.showTraversalAssists;
}

function createGrayboxWash(
  geometry: RidgeBlockoutGeometry
): RidgeDebugDrawCommand {
  return {
    kind: 'rect',
    id: 'graybox-wash',
    x: geometry.bounds.x + geometry.bounds.width / 2,
    y: geometry.bounds.y + geometry.bounds.height / 2,
    width: geometry.bounds.width,
    height: geometry.bounds.height,
    fillColor: 0xfbfbf9,
    fillAlpha: 0.18,
    strokeColor: 0x1a1a1a,
    strokeAlpha: 0.08,
    lineWidth: 2
  };
}

function createColliderCommand(collider: RidgeBlockoutCollider): RidgeDebugDrawCommand {
  const style = getColliderStyle(collider);
  return {
    kind: 'rect',
    id: `collider:${collider.id}`,
    x: collider.x,
    y: collider.y,
    width: collider.width,
    height: collider.height,
    ...style
  };
}

function getColliderStyle(collider: RidgeBlockoutCollider): Omit<
  Extract<RidgeDebugDrawCommand, { kind: 'rect' }>,
  'kind' | 'id' | 'x' | 'y' | 'width' | 'height'
> {
  switch (collider.kind) {
    case 'platform':
      return {
        fillColor: 0xf0d35f,
        fillAlpha: 0.15,
        strokeColor: 0xf0d35f,
        strokeAlpha: 0.86,
        lineWidth: 3
      };
    case 'route-connector':
      return {
        fillColor: 0x596f8f,
        fillAlpha: 0.13,
        strokeColor: 0x596f8f,
        strokeAlpha: 0.84,
        lineWidth: 3
      };
    case 'shortcut-connector':
      return {
        fillColor: 0xb85f5a,
        fillAlpha: 0.13,
        strokeColor: 0xb85f5a,
        strokeAlpha: 0.84,
        lineWidth: 3
      };
    case 'solid':
      return {
        fillColor: 0x1a1a1a,
        fillAlpha: 0.12,
        strokeColor: 0x1a1a1a,
        strokeAlpha: 0.78,
        lineWidth: 2
      };
  }
}

function createAssistZoneLineCommand(
  zone: RidgeBlockoutAssistZone,
  traversalState: RidgeTraversalRuntimeState | undefined
): RidgeDebugDrawCommand {
  const active = traversalState?.activeClimbZoneId === zone.id;
  return {
    kind: 'line',
    id: `assist-line:${zone.id}`,
    from: zone.from,
    to: zone.to,
    strokeColor: getAssistZoneColor(zone),
    strokeAlpha: active ? 0.95 : 0.68,
    lineWidth: active ? 8 : 5
  };
}

function createAssistZoneBoundsCommand(
  zone: RidgeBlockoutAssistZone,
  traversalState: RidgeTraversalRuntimeState | undefined
): RidgeDebugDrawCommand {
  const active = traversalState?.activeClimbZoneId === zone.id;
  return {
    kind: 'rect',
    id: `assist-bounds:${zone.id}`,
    x: zone.x,
    y: zone.y,
    width: zone.width,
    height: zone.height,
    fillColor: getAssistZoneColor(zone),
    fillAlpha: active ? 0.16 : 0.08,
    strokeColor: getAssistZoneColor(zone),
    strokeAlpha: active ? 0.82 : 0.46,
    lineWidth: active ? 3 : 2
  };
}

function getAssistZoneColor(zone: RidgeBlockoutAssistZone): number {
  switch (zone.kind) {
    case 'ramp':
      return 0xd7c78f;
    case 'climb':
      return 0x596f8f;
    case 'drop':
      return 0xb85f5a;
  }
}
