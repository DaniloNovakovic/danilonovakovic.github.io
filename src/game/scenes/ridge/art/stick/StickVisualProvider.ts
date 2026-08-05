import type * as Phaser from 'phaser';
import type { RidgeActorId, RidgeFacing } from '@/game/core/ridge';
import type { RidgeVisualProvider, RidgeVisualViewModel } from '../types';
import { ActorSpritePool, headTopFor, type ActorRenderRequest } from './actorSprites';
import { drawAmbientFar, drawAmbientNear } from './ambientLayer';
import { drawRidgeAreaLayer, type SceneryLayer } from './areaSets';
import { drawCrtAtmosphere, prefersReducedMotion, sketchTick } from './atmosphere';
import { BarkDirector, type BarkLines } from './barkDirector';
import { PresenceLayer, type ActiveBark, type PlacedPresence } from './presenceLayer';
import {
  DEPTH,
  GROUND_Y,
  LAYERS,
  PAPER,
  PRESENCE_FAR,
  PRESENCE_NEAR,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  VIEW_ABOVE_GROUND,
  VIEW_BELOW_GROUND,
  VIEW_HEIGHT
} from './palette';

const CRT_TEXTURE_KEY = 'ridge-stick-crt';
const SCENERY_TEXTURE_KEY: Record<SceneryLayer, string> = {
  far: 'ridge-stick-far',
  near: 'ridge-stick-near',
  fore: 'ridge-stick-fore'
};
const SCENERY_LAYERS: readonly SceneryLayer[] = ['far', 'near', 'fore'];

/**
 * Zoom is driven by height, not width: it keeps the ground line, the figures,
 * and the sky in the same proportion on any screen, and lets wide displays see
 * more of the stage instead of larger characters.
 */
const MIN_ZOOM = 0.9;
const MAX_ZOOM = 2.4;
/** Milliseconds of grace after the last movement before the walk cycle stops. */
const WALK_RELEASE_MS = 150;
/** How far an NPC will turn to acknowledge the player, in stage progress. */
const AWARENESS_RANGE = 0.13;

/** Clearance above a head for a nameplate, so bubbles stack above it. */
const PLATE_HEIGHT = 60;

export interface StickVisualProviderOptions {
  stageWidth?: number;
  stageHeight?: number;
  /** Role tags shown under each resident's name. */
  roles?: Partial<Record<RidgeActorId, string>>;
  /** Ambient lines residents mutter as the player walks past. */
  barks?: BarkLines;
}

/**
 * Stick-figure Ridge presentation.
 *
 * Performance rules:
 * - Scenery bakes into one DynamicTexture per parallax band (1 quad each).
 *   Never use Graphics#generateTexture (Canvas + willReadFrequently) for stages.
 * - Figures redraw only when their stepped pose changes; following them is a
 *   transform update.
 * - Ambient drift redraws on the ~11 FPS sketch clock, not per frame.
 * - Text objects update only when their content actually changes.
 */
export class StickVisualProvider implements RidgeVisualProvider {
  private readonly scene: Phaser.Scene;
  private readonly stageWidth: number;
  private readonly stageHeight: number;
  private readonly roles: Partial<Record<RidgeActorId, string>>;
  private readonly actorPool: ActorSpritePool;
  private readonly presence: PresenceLayer;
  private readonly barkDirector: BarkDirector;
  private readonly sceneryImages = new Map<SceneryLayer, Phaser.GameObjects.Image>();
  private readonly ambientFar: Phaser.GameObjects.Graphics;
  private readonly ambientNear: Phaser.GameObjects.Graphics;
  private crtImage?: Phaser.GameObjects.Image;
  private lastSceneryKey = '';
  private lastViewportKey = '';
  private lastAmbientKey = '';
  private lastPlayerProgress = Number.NaN;
  private lastMovedAt = -Infinity;
  private destroyed = false;
  /** Reused each sync to avoid per-frame array churn on the hot path. */
  private readonly actorRequests: ActorRenderRequest[] = [];
  private readonly presencePlates: PlacedPresence[] = [];
  private readonly barkCandidates: RidgeActorId[] = [];
  private readonly activeBarks: ActiveBark[] = [];

  constructor(scene: Phaser.Scene, options: StickVisualProviderOptions = {}) {
    this.scene = scene;
    this.stageWidth = options.stageWidth ?? STAGE_WIDTH;
    this.stageHeight = options.stageHeight ?? STAGE_HEIGHT;
    this.roles = options.roles ?? {};

    this.ambientFar = scene.add
      .graphics()
      .setDepth(DEPTH.ambientFar)
      .setScrollFactor(LAYERS.far.scrollFactor, 1);
    this.ambientNear = scene.add.graphics().setDepth(DEPTH.ambientNear);

    this.actorPool = new ActorSpritePool(scene);
    this.presence = new PresenceLayer(scene);
    this.barkDirector = new BarkDirector(options.barks ?? {});

    scene.cameras.main.setBounds(0, 0, this.stageWidth, this.stageHeight);
    scene.cameras.main.setBackgroundColor(PAPER);
  }

  worldXForProgress(progress: number): number {
    return 80 + progress * (this.stageWidth - 160);
  }

  sync(view: RidgeVisualViewModel): void {
    if (this.destroyed) return;

    const now = this.scene.time.now;
    const motion = !prefersReducedMotion();
    const stepTick = sketchTick(now);
    // Decorative motion freezes under reduced-motion; the walk cycle does not,
    // because it is feedback for something the player is actively doing.
    const tick = motion ? stepTick : 0;

    this.syncViewport();
    this.syncScenery(view);
    this.syncAmbient(view, tick);

    const player = view.actors.find((actor) => actor.id === 'player');
    const playerProgress = player?.progress ?? view.progress;
    const walking = this.trackWalking(playerProgress, now) && view.mode === 'explore';

    this.syncActors(view, playerProgress, tick, stepTick, motion, walking);
    this.syncPresence(view, playerProgress, now, tick, motion);
    this.followCamera(view, playerProgress);
  }

  destroy(): void {
    this.destroyed = true;
    this.actorPool.destroy();
    this.presence.destroy();
    this.ambientFar.destroy();
    this.ambientNear.destroy();
    this.crtImage?.destroy();
    this.crtImage = undefined;

    for (const image of this.sceneryImages.values()) image.destroy();
    this.sceneryImages.clear();

    for (const key of Object.values(SCENERY_TEXTURE_KEY)) {
      if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    }
    if (this.scene.textures.exists(CRT_TEXTURE_KEY)) {
      this.scene.textures.remove(CRT_TEXTURE_KEY);
    }
  }

  /** Zoom so figures stay a readable size on any canvas, and rebake the CRT. */
  private syncViewport(): void {
    const cam = this.scene.cameras.main;
    const key = `${Math.round(cam.width)}x${Math.round(cam.height)}`;
    if (key === this.lastViewportKey) return;
    this.lastViewportKey = key;

    cam.setZoom(clamp(cam.height / VIEW_HEIGHT, MIN_ZOOM, MAX_ZOOM));
    this.bakeCrtOverlay(Math.round(cam.width), Math.round(cam.height));
  }

  private syncScenery(view: RidgeVisualViewModel): void {
    // Only Relay redresses per beat; elsewhere the crossing state covers it.
    const key =
      view.areaId === 'relay'
        ? `${view.areaId}|${view.beat}`
        : `${view.areaId}|${view.crossingOpen}`;
    if (key === this.lastSceneryKey) return;
    this.lastSceneryKey = key;

    for (const layer of SCENERY_LAYERS) {
      this.bakeSceneryLayer(layer, view);
    }
  }

  private bakeSceneryLayer(layer: SceneryLayer, view: RidgeVisualViewModel): void {
    const spec = LAYERS[layer];
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    drawRidgeAreaLayer(g, layer, view.areaId, view.crossingOpen, view.beat, {
      worldXForProgress: (progress) => this.worldXForProgress(progress)
    });

    const key = SCENERY_TEXTURE_KEY[layer];
    try {
      const texture = replaceDynamicTexture(this.scene, key, spec.width, spec.height);
      texture.draw(g);
      texture.render();

      let image = this.sceneryImages.get(layer);
      if (image) {
        image.setTexture(key);
      } else {
        image = this.scene.add
          .image(0, spec.top, key)
          .setOrigin(0, 0)
          .setDepth(spec.depth)
          // Parallax on X only: the camera barely pans vertically, and a
          // vertical factor would slide the horizon out of its own band.
          .setScrollFactor(spec.scrollFactor, 1);
        this.sceneryImages.set(layer, image);
      }
      image.setVisible(true);
    } finally {
      g.destroy();
    }
  }

  private bakeCrtOverlay(width: number, height: number): void {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    drawCrtAtmosphere(g, w, h);

    const texture = replaceDynamicTexture(this.scene, CRT_TEXTURE_KEY, w, h);
    texture.draw(g);
    texture.render();
    g.destroy();

    if (this.crtImage) {
      this.crtImage.setTexture(CRT_TEXTURE_KEY).setDisplaySize(w, h);
      return;
    }
    this.crtImage = this.scene.add
      .image(0, 0, CRT_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.crt)
      .setDisplaySize(w, h);
  }

  private syncAmbient(view: RidgeVisualViewModel, tick: number): void {
    const key = `${view.areaId}|${tick}`;
    if (key === this.lastAmbientKey) return;
    this.lastAmbientKey = key;
    drawAmbientFar(this.ambientFar, view.areaId, tick);
    drawAmbientNear(this.ambientNear, view.areaId, tick);
  }

  /** True while the player is actively walking, with a short release. */
  private trackWalking(progress: number, now: number): boolean {
    if (Number.isNaN(this.lastPlayerProgress)) {
      this.lastPlayerProgress = progress;
      return false;
    }
    if (Math.abs(progress - this.lastPlayerProgress) > 0.0001) {
      this.lastPlayerProgress = progress;
      this.lastMovedAt = now;
    }
    return now - this.lastMovedAt < WALK_RELEASE_MS;
  }

  private syncActors(
    view: RidgeVisualViewModel,
    playerProgress: number,
    tick: number,
    stepTick: number,
    motion: boolean,
    walking: boolean
  ): void {
    const requests = this.actorRequests;
    requests.length = 0;
    const playerX = this.worldXForProgress(playerProgress);

    view.actors.forEach((actor, index) => {
      if (!actor.visible) return;

      const x = this.worldXForProgress(actor.progress);
      const isPlayer = actor.id === 'player';
      const isWalking = isPlayer && walking;
      const isTalking = view.speakingActorId === actor.id;

      // Residents turn to acknowledge you, the way a street does.
      const aware = !isPlayer && Math.abs(actor.progress - playerProgress) < AWARENESS_RANGE;
      const towardPlayer: RidgeFacing = playerX >= x ? 'right' : 'left';

      // Idle breath is a transform, so it never touches the command buffer.
      const breath =
        motion && !isWalking ? Math.round(Math.sin((tick + index * 3) * 0.42) * 1.4) : 0;

      requests.push({
        id: actor.id,
        x,
        y: GROUND_Y,
        facing: aware ? towardPlayer : actor.facing,
        bob: breath,
        pose: {
          frame: (isWalking ? stepTick : tick) + index,
          walking: isWalking,
          talking: isTalking
        }
      });
    });

    this.actorPool.sync(requests);
  }

  private syncPresence(
    view: RidgeVisualViewModel,
    playerProgress: number,
    now: number,
    tick: number,
    motion: boolean
  ): void {
    const inConversation = view.mode === 'conversation';
    const plates = this.presencePlates;
    const barkCandidates = this.barkCandidates;
    plates.length = 0;
    barkCandidates.length = 0;
    const focusActorId = view.focus?.actorId;

    for (const actor of view.actors) {
      if (!actor.visible || actor.id === 'player') continue;
      if (actor.id === 'toy-car' || actor.id === 'guitar') continue;

      const distance = Math.abs(actor.progress - playerProgress);
      const alpha = inConversation ? 0 : presenceAlpha(distance);
      if (alpha <= 0.02) continue;

      plates.push({
        id: actor.id,
        name: actor.label,
        role: this.roles[actor.id] ?? '',
        x: this.worldXForProgress(actor.progress),
        y: GROUND_Y + headTopFor(actor.id),
        alpha
      });

      // The focused resident gets the interact pip instead of small talk.
      if (actor.id !== focusActorId) barkCandidates.push(actor.id);
    }

    this.presence.syncNameplates(plates);

    if (inConversation) {
      this.barkDirector.interrupt(now);
      this.presence.syncBarks([]);
      this.presence.syncFocus(null, 0);
      return;
    }

    const bark = this.barkDirector.update(now, barkCandidates);
    const barks = this.activeBarks;
    barks.length = 0;
    if (bark) {
      const speaker = view.actors.find((actor) => actor.id === bark.actorId);
      if (speaker) {
        barks.push({
          id: bark.actorId,
          text: bark.text,
          x: this.worldXForProgress(speaker.progress),
          y: GROUND_Y + headTopFor(speaker.id) - PLATE_HEIGHT,
          alpha: bark.alpha
        });
      }
    }
    this.presence.syncBarks(barks);

    const focus = view.focus;
    if (!focus) {
      this.presence.syncFocus(null, 0);
      return;
    }

    const anchor = focus.actorId
      ? view.actors.find((actor) => actor.id === focus.actorId && actor.visible)
      : undefined;
    const x = this.worldXForProgress(anchor ? anchor.progress : focus.progress);
    const y = anchor
      ? GROUND_Y + headTopFor(anchor.id) - PLATE_HEIGHT
      : GROUND_Y - 96;
    const bob = motion ? (tick % 6 < 3 ? 0 : -3) : 0;

    this.presence.syncFocus({ key: focus.spotId + focus.prompt, label: focus.prompt, x, y }, bob);
  }

  /** Frame the player, and widen to hold both speakers during a conversation. */
  private followCamera(view: RidgeVisualViewModel, playerProgress: number): void {
    const playerX = this.worldXForProgress(playerProgress);
    let centerX = playerX;

    if (view.mode === 'conversation' && view.speakingActorId) {
      const speaker = view.actors.find((actor) => actor.id === view.speakingActorId);
      if (speaker?.visible) {
        centerX = (playerX + this.worldXForProgress(speaker.progress)) / 2;
      }
    }

    this.scene.cameras.main.centerOn(
      centerX,
      GROUND_Y - (VIEW_ABOVE_GROUND - VIEW_BELOW_GROUND) / 2
    );
  }
}

function presenceAlpha(distance: number): number {
  if (distance <= PRESENCE_NEAR) return 1;
  if (distance >= PRESENCE_FAR) return 0;
  return 1 - (distance - PRESENCE_NEAR) / (PRESENCE_FAR - PRESENCE_NEAR);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function replaceDynamicTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number
): Phaser.Textures.DynamicTexture {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }
  const created = scene.textures.addDynamicTexture(key, width, height);
  if (!created) {
    throw new Error(`Failed to create DynamicTexture "${key}"`);
  }
  return created;
}
