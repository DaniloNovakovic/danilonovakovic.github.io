import type * as Phaser from 'phaser';
import type { RidgeActorId, RidgeFacing } from '@/game/core/ridge';
import { DEPTH } from './palette';
import {
  drawStickCicka,
  drawStickCrowd,
  drawStickDanceTeacher,
  drawStickDraftsperson,
  drawStickDriver,
  drawStickGuitar,
  drawStickGuitarist,
  drawStickOperationsHelper,
  drawStickPlayer,
  drawStickShuttle,
  drawStickSteward,
  drawStickToyCar,
  drawStickTraveler,
  type StickPose
} from './stickFigures';

/**
 * Global figure size. The original cast was drawn tiny against a 1600x720
 * stage; scaling every figure through one multiplier keeps their internal
 * proportions and ink weights intact.
 */
const FIGURE_SCALE = 1.6;

/**
 * Distance above the ground line where a figure's silhouette ends, used to
 * hang nameplates and bubbles clear of the art.
 *
 * Stored unscaled and multiplied by {@link FIGURE_SCALE} on read, so retuning
 * figure size cannot silently drop chrome onto somebody's head.
 */
const HEAD_TOP: Record<RidgeActorId, number> = {
  player: -49,
  cicka: -28,
  'counterpart-cat': -25,
  draftsperson: -48,
  'toy-car': -14,
  guitarist: -46,
  crowd: -41,
  guitar: -24,
  traveler: -44,
  driver: -46,
  'operations-helper': -46,
  'dance-teacher': -50,
  steward: -48,
  shuttle: -29
};

export function headTopFor(id: RidgeActorId): number {
  return (HEAD_TOP[id] ?? -44) * FIGURE_SCALE;
}

export interface ActorRenderRequest {
  id: RidgeActorId;
  x: number;
  y: number;
  facing: RidgeFacing;
  pose: StickPose;
  /** Vertical offset for breathing and walk bounce — applied as a transform. */
  bob: number;
}

/**
 * One Graphics object per actor.
 *
 * The split matters for cost: a figure's command buffer is rebuilt only when
 * its pose changes on the stepped clock, while following it around the stage
 * is a transform update on an unchanged buffer.
 */
export class ActorSpritePool {
  private readonly scene: Phaser.Scene;
  private readonly sprites = new Map<string, ActorSprite>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  sync(requests: readonly ActorRenderRequest[]): void {
    const seen = new Set<string>();

    for (const request of requests) {
      seen.add(request.id);
      let sprite = this.sprites.get(request.id);
      if (!sprite) {
        sprite = new ActorSprite(this.scene, request.id);
        this.sprites.set(request.id, sprite);
      }
      sprite.sync(request);
    }

    for (const [id, sprite] of this.sprites) {
      if (!seen.has(id)) sprite.hide();
    }
  }

  destroy(): void {
    for (const sprite of this.sprites.values()) sprite.destroy();
    this.sprites.clear();
  }
}

class ActorSprite {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly id: RidgeActorId;
  private poseKey = '';
  private placedX = Number.NaN;
  private placedY = Number.NaN;

  constructor(scene: Phaser.Scene, id: RidgeActorId) {
    this.id = id;
    this.graphics = scene.add.graphics().setDepth(DEPTH.actor + depthOffsetFor(id));
  }

  sync(request: ActorRenderRequest): void {
    const key = `${request.facing}|${request.pose.frame}|${request.pose.walking}|${request.pose.talking}`;
    if (key !== this.poseKey) {
      this.poseKey = key;
      this.graphics.clear();
      drawActor(this.graphics, this.id, request.facing, request.pose);
    }

    const x = Math.round(request.x);
    const y = Math.round(request.y + request.bob);
    if (x !== this.placedX || y !== this.placedY) {
      this.placedX = x;
      this.placedY = y;
      this.graphics.setPosition(x, y);
    }
    this.graphics.setVisible(true);
  }

  hide(): void {
    this.graphics.setVisible(false);
  }

  destroy(): void {
    this.graphics.destroy();
  }
}

/** Props sit behind people; the player reads above the crowd. */
function depthOffsetFor(id: RidgeActorId): number {
  if (id === 'player') return 3;
  if (id === 'toy-car' || id === 'guitar' || id === 'shuttle') return -1;
  if (id === 'crowd') return -2;
  return 0;
}

/** Figures draw around a local origin so the pool can move them freely. */
function drawActor(
  g: Phaser.GameObjects.Graphics,
  id: RidgeActorId,
  facing: RidgeFacing,
  pose: StickPose
): void {
  const s = FIGURE_SCALE;
  switch (id) {
    case 'player':
      drawStickPlayer(g, 0, 0, facing, 1.15 * s, pose);
      return;
    case 'cicka':
      drawStickCicka(g, 0, 0, 1.1 * s, pose);
      return;
    case 'counterpart-cat':
      drawStickCicka(g, 0, 0, 0.95 * s, pose);
      return;
    case 'draftsperson':
      drawStickDraftsperson(g, 0, 0, facing, 1.05 * s, pose);
      return;
    case 'toy-car':
      drawStickToyCar(g, 22, 4, 1.1 * s);
      return;
    case 'guitarist':
      drawStickGuitarist(g, 0, 0, facing, 1.05 * s, pose);
      return;
    case 'crowd':
      drawStickCrowd(g, 0, 0, s, pose);
      return;
    case 'guitar':
      drawStickGuitar(g, 20, 2, 1.1 * s);
      return;
    case 'traveler':
      drawStickTraveler(g, 0, 0, facing, s, pose);
      return;
    case 'driver':
      drawStickDriver(g, 0, 0, facing, 1.05 * s, pose);
      return;
    case 'operations-helper':
      drawStickOperationsHelper(g, 0, 0, facing, 1.05 * s, pose);
      return;
    case 'dance-teacher':
      drawStickDanceTeacher(g, 0, 0, facing, 1.05 * s, pose);
      return;
    case 'steward':
      drawStickSteward(g, 0, 0, facing, s, pose);
      return;
    case 'shuttle':
      drawStickShuttle(g, 0, 0, 1.1 * s);
      return;
  }
}
