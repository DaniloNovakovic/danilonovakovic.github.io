import type * as Phaser from 'phaser';
import {
  renderRidgeDebugDrawCommands,
  type RidgeDebugDrawCommand
} from '../debugDrawCommands';
import type { RidgeDevDebugSettings } from '../runtime/ridgeDevControls';
import type { BridgeTracerInteractionTarget } from './bridgeTracerSlice';
import {
  BRIDGE_STAGE_SOURCE,
  resolveBridgeStageSpot,
  sampleBridgeWalkRail,
  type BridgeStageCompositionSource
} from './stageComposition';

export interface BridgeStageDebugOverlayPlayer {
  x: number;
  y: number;
  body?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type BridgeStageDebugDrawCommand = RidgeDebugDrawCommand;

export interface BridgeStageDebugDrawCommandOptions {
  source?: BridgeStageCompositionSource;
  interactionTargets: readonly BridgeTracerInteractionTarget[];
  player?: BridgeStageDebugOverlayPlayer;
  railProgress?: number;
  settings: RidgeDevDebugSettings;
}

export type BridgeStageDebugOverlayFrame = BridgeStageDebugDrawCommandOptions;

export interface BridgeStageDebugOverlay {
  render(frame: BridgeStageDebugOverlayFrame): void;
  destroy(): void;
}

const BRIDGE_STAGE_DEBUG_OVERLAY_DEPTH = 500;
const DEFAULT_INTERACT_RADIUS = 86;

export function createBridgeStageDebugDrawCommands(
  options: BridgeStageDebugDrawCommandOptions
): BridgeStageDebugDrawCommand[] {
  const source = options.source ?? BRIDGE_STAGE_SOURCE;
  const commands: BridgeStageDebugDrawCommand[] = [];
  const enabled = getEffectiveDebugSettings(options.settings);
  if (!isAnyDebugSettingEnabled(enabled)) return commands;

  if (enabled.graybox) {
    commands.push({
      kind: 'rect',
      id: 'stage-canvas',
      x: source.canvas.x + source.canvas.width / 2,
      y: source.canvas.y + source.canvas.height / 2,
      width: source.canvas.width,
      height: source.canvas.height,
      fillColor: 0xfbfbf9,
      fillAlpha: 0.12,
      strokeColor: 0x1a1a1a,
      strokeAlpha: 0.12,
      lineWidth: 2
    });
    source.occluders.forEach((occluder) => {
      for (let index = 0; index < occluder.points.length - 1; index += 1) {
        const from = occluder.points[index];
        const to = occluder.points[index + 1];
        if (!from || !to) continue;
        commands.push({
          kind: 'line',
          id: `stage-occluder:${occluder.id}:${index}`,
          from,
          to,
          strokeColor: 0x1a1a1a,
          strokeAlpha: 0.42,
          lineWidth: 4
        });
      }
    });
  }

  if (enabled.showTraversalAssists) {
    const points = source.primaryWalkRail.points;
    for (let index = 0; index < points.length - 1; index += 1) {
      const from = points[index];
      const to = points[index + 1];
      if (!from || !to) continue;
      commands.push({
        kind: 'line',
        id: `walk-rail:${source.primaryWalkRail.id}:${index}`,
        from,
        to,
        strokeColor: 0x596f8f,
        strokeAlpha: 0.86,
        lineWidth: 4
      });
    }

    source.spots.forEach((spot) => {
      const resolved = resolveBridgeStageSpot(source, spot.id);
      commands.push({
        kind: 'circle',
        id: `stage-spot:${spot.id}`,
        x: resolved.x,
        y: resolved.y,
        radius: 10,
        fillColor: 0xf0d35f,
        fillAlpha: 0.22,
        strokeColor: 0x1a1a1a,
        strokeAlpha: 0.78,
        lineWidth: 2
      });
    });

    if (options.railProgress !== undefined) {
      const sample = sampleBridgeWalkRail(source.primaryWalkRail, options.railProgress);
      commands.push({
        kind: 'circle',
        id: 'walk-rail:player-progress',
        x: sample.x,
        y: sample.y,
        radius: 15,
        fillColor: 0x596f8f,
        fillAlpha: 0.22,
        strokeColor: 0x596f8f,
        strokeAlpha: 0.92,
        lineWidth: 3
      });
    }
  }

  if (enabled.showInteractZones) {
    options.interactionTargets.forEach((target) => {
      const radius = target.interactRadius ?? DEFAULT_INTERACT_RADIUS;
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

export function createBridgeStageDebugOverlay(scene: Phaser.Scene): BridgeStageDebugOverlay {
  const graphics = scene.add.graphics().setDepth(BRIDGE_STAGE_DEBUG_OVERLAY_DEPTH);

  return {
    render(frame) {
      const commands = createBridgeStageDebugDrawCommands(frame);
      renderRidgeDebugDrawCommands(graphics, commands);
    },
    destroy() {
      graphics.destroy();
    }
  };
}

function getEffectiveDebugSettings(settings: RidgeDevDebugSettings): RidgeDevDebugSettings {
  if (!settings.graybox) return settings;
  return {
    ...settings,
    showInteractZones: true,
    showPlayerBody: true,
    showTraversalAssists: true
  };
}

function isAnyDebugSettingEnabled(settings: RidgeDevDebugSettings): boolean {
  return settings.graybox ||
    settings.showPlayerBody ||
    settings.showInteractZones ||
    settings.showTraversalAssists;
}
