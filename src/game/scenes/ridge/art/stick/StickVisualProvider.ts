import type * as Phaser from 'phaser';
import {
  BLUEPRINT_BRIDGE_PUZZLE,
  BRIDGE_RIVER_PROGRESS,
  type BridgeDesign,
  type RidgeActorId,
  type RidgeFacing
} from '@/game/core/ridge';
import type { RidgeVisualProvider, RidgeVisualViewModel } from '../types';
import { ActorSpritePool, headTopFor, type ActorRenderRequest } from './actorSprites';
import { drawAmbientFar, drawAmbientNear } from './ambientLayer';
import { drawRidgeAreaLayer, type SceneryLayer } from './areaSets';
import { drawCrtAtmosphere } from './atmosphere';
import { prefersReducedMotion, sketchTick } from '@/game/sharedSceneRuntime/motion/sketchMotion';
import { BarkDirector, type BarkLines } from './barkDirector';
import { builtBridgeShape, deckTopAt, type BuiltBridgeShape } from './bridgeInk';
import { EmoteMark, emoteGlyphFor } from './emoteMark';
import { PresenceLayer, type ActiveBark } from './presenceLayer';
import {
  DEPTH,
  GROUND_Y,
  LAYERS,
  PAPER,
  PRESENCE_RANGE,
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

/**
 * Gap between the taller of (anchor, player) heads and floating chrome. Using
 * the taller head means a cat's prompt never lands on the player's face.
 */
const CHROME_CLEARANCE = 12;
/** Residents this close to the focus card stay quiet so bubbles never stack on it. */
const BARK_FOCUS_CLEARANCE = 150;

/**
 * Conversation framing. The camera eases in toward the people talking, lifts
 * the ground line so the docked dialogue box sits under their feet, and
 * fades bystanders back.
 */
const CONVERSATION_ZOOM = 1.3;
const CONVERSATION_EASE_MS = 320;
/** World units kept clear either side of the outermost speaker. */
const CONVERSATION_SIDE_MARGIN = 70;
/** How far the frame drifts from the pair's midpoint toward whoever is talking. */
const SPEAKER_PULL = 0.18;
/** CSS pixels the docked conversation box occupies along the frame bottom. */
const CONVERSATION_BOX_RESERVE = 165;
const BYSTANDER_ALPHA = 0.4;

/**
 * Drawing-table framing: the whole gap, the car's start on the near bank, the
 * build rows overhead, and the water below, clear of the docked tool chrome.
 */
const BUILD_EASE_MS = 420;
const BUILD_MARGIN_LEFT = 104;
const BUILD_MARGIN_RIGHT = 72;
const BUILD_MARGIN_TOP = 26;
const BUILD_MARGIN_BOTTOM = 16;
/** CSS pixels reserved for the tip card (top) and toolbar (bottom). */
const BUILD_RESERVE_TOP = 76;
const BUILD_RESERVE_BOTTOM = 104;
/** Matches the `short:` Tailwind variant (max-height 32rem) the chrome compacts at. */
const SHORT_VIEWPORT_CSS = 512;
const BUILD_RESERVE_TOP_SHORT = 46;
const BUILD_RESERVE_BOTTOM_SHORT = 50;
const SURPRISE_HOP_MS = 260;
const SURPRISE_HOP_HEIGHT = 9;

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
  private readonly barkCandidates: RidgeActorId[] = [];
  private readonly activeBarks: ActiveBark[] = [];
  private readonly emote: EmoteMark;
  /** Height-driven zoom for exploring; conversation zoom multiplies it. */
  private baseZoom = 1;
  /** 0 = exploring, 1 = fully framed for conversation. */
  private conversationBlend = 0;
  private lastSyncAt = Number.NaN;
  private lastLineKey: string | null = null;
  private lineStartedAt = 0;
  /** Where the ground line sits in the frame while talking, 0 top → 1 bottom. */
  private conversationGroundAt = 0.62;
  /** 0 = exploring, 1 = framed on the Blueprint Bridge drawing table. */
  private buildBlend = 0;
  private builtShape: BuiltBridgeShape | null = null;
  private builtShapeDesign: BridgeDesign | null = null;
  private readonly designIds = new WeakMap<BridgeDesign, number>();
  private nextDesignId = 1;

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
    this.emote = new EmoteMark(scene);

    scene.cameras.main.setBounds(0, 0, this.stageWidth, this.stageHeight);
    scene.cameras.main.setBackgroundColor(PAPER);
  }

  worldXForProgress(progress: number): number {
    return 80 + progress * (this.stageWidth - 160);
  }

  /** Top of the near river bank: origin of the Blueprint Bridge grid. */
  bridgeGapOrigin(): { x: number; y: number } {
    return { x: this.worldXForProgress(BRIDGE_RIVER_PROGRESS.left), y: GROUND_Y };
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
    // Before scenery: the baked crossing draws the shape this resolves.
    this.syncBuiltShape(view);
    this.syncScenery(view);
    this.syncAmbient(view, tick);

    const player = view.actors.find((actor) => actor.id === 'player');
    const playerProgress = player?.progress ?? view.progress;
    const walking = this.trackWalking(playerProgress, now) && view.mode === 'explore';

    this.trackLine(view, now);
    this.advanceConversationBlend(view, now, motion);
    this.syncActors(view, playerProgress, now, tick, stepTick, motion, walking);
    this.syncPresence(view, playerProgress, now, tick, motion);
    // Foreground corn would scribble over the drawing table; let it step aside.
    this.sceneryImages.get('fore')?.setAlpha(1 - easeInOut(this.buildBlend) * 0.92);
    this.syncEmote(view, now, motion);
    this.followCamera(view, playerProgress);
  }

  destroy(): void {
    this.destroyed = true;
    this.actorPool.destroy();
    this.presence.destroy();
    this.emote.destroy();
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

    this.baseZoom = clamp(cam.height / VIEW_HEIGHT, MIN_ZOOM, MAX_ZOOM);
    cam.setZoom(this.baseZoom);
    this.bakeCrtOverlay(Math.round(cam.width), Math.round(cam.height));
  }

  private syncScenery(view: RidgeVisualViewModel): void {
    // Only Relay redresses per beat; elsewhere the crossing state covers it.
    const key =
      view.areaId === 'relay'
        ? `${view.areaId}|${view.beat}`
        : `${view.areaId}|${view.crossingOpen}|${this.designKey(view.builtBridge)}`;
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
      worldXForProgress: (progress) => this.worldXForProgress(progress),
      bridgeGap: {
        left: this.worldXForProgress(BRIDGE_RIVER_PROGRESS.left),
        right: this.worldXForProgress(BRIDGE_RIVER_PROGRESS.right)
      },
      builtBridge: view.areaId === 'bridge' ? this.builtShape : null
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
    now: number,
    tick: number,
    stepTick: number,
    motion: boolean,
    walking: boolean
  ): void {
    const requests = this.actorRequests;
    requests.length = 0;
    const frame: ActorFrame = {
      view,
      playerProgress,
      playerX: this.worldXForProgress(playerProgress),
      tick,
      stepTick,
      motion,
      walking,
      fade: easeInOut(this.conversationBlend),
      hop:
        motion && view.speakingEmotion === 'surprised'
          ? surpriseHop(now - this.lineStartedAt)
          : 0
    };

    view.actors.forEach((actor, index) => {
      if (actor.visible) requests.push(this.actorRequestFor(actor, index, frame));
    });

    this.actorPool.sync(requests);
  }

  private actorRequestFor(
    actor: RidgeVisualViewModel['actors'][number],
    index: number,
    frame: ActorFrame
  ): ActorRenderRequest {
    const { view } = frame;
    const x = this.worldXForProgress(actor.progress);
    const isPlayer = actor.id === 'player';
    const isWalking = isPlayer && frame.walking;
    const isTalking = view.speakingActorId === actor.id;
    const inScene = isPlayer || isTalking || actor.id === view.partnerActorId;

    return {
      id: actor.id,
      x,
      y: this.groundYAt(view, x),
      facing: facingFor(actor, frame, x),
      bob: idleBreath(frame, index, isWalking) - (isTalking ? frame.hop : 0),
      alpha: inScene ? 1 : 1 - (1 - BYSTANDER_ALPHA) * frame.fade,
      pose: {
        frame: (isWalking ? frame.stepTick : frame.tick) + index,
        walking: isWalking,
        talking: isTalking,
        emotion: isTalking ? view.speakingEmotion : null
      }
    };
  }

  private syncPresence(
    view: RidgeVisualViewModel,
    playerProgress: number,
    now: number,
    tick: number,
    motion: boolean
  ): void {
    const inConversation = view.mode === 'conversation' || view.mode === 'bridgeBuild';
    if (inConversation) {
      this.barkDirector.interrupt(now);
      this.presence.syncBarks([]);
      this.presence.syncFocus(null, 0);
      return;
    }

    this.collectBarkCandidates(view, playerProgress);
    this.syncAmbientBarks(view, now);
    this.syncInteractPip(view, tick, motion);
  }

  /** On-screen residents may mutter, except whoever the focus card sits over. */
  private collectBarkCandidates(view: RidgeVisualViewModel, playerProgress: number): void {
    const candidates = this.barkCandidates;
    candidates.length = 0;
    const focus = view.focus;
    const focusX = focus ? this.worldXForProgress(focus.progress) : Number.NaN;

    for (const actor of view.actors) {
      if (!actor.visible || !showsPresenceChrome(actor.id)) continue;
      if (Math.abs(actor.progress - playerProgress) > PRESENCE_RANGE) continue;
      if (actor.id === focus?.actorId) continue;
      if (Math.abs(this.worldXForProgress(actor.progress) - focusX) < BARK_FOCUS_CLEARANCE) {
        continue;
      }
      candidates.push(actor.id);
    }
  }

  private syncAmbientBarks(view: RidgeVisualViewModel, now: number): void {
    const bark = this.barkDirector.update(now, this.barkCandidates);
    const barks = this.activeBarks;
    barks.length = 0;
    if (bark) {
      const speaker = view.actors.find((actor) => actor.id === bark.actorId);
      if (speaker) {
        barks.push({
          id: bark.actorId,
          text: bark.text,
          x: this.worldXForProgress(speaker.progress),
          y: chromeAnchorY(speaker.id),
          alpha: bark.alpha
        });
      }
    }
    this.presence.syncBarks(barks);
  }

  private syncInteractPip(view: RidgeVisualViewModel, tick: number, motion: boolean): void {
    const focus = view.focus;
    if (!focus) {
      this.presence.syncFocus(null, 0);
      return;
    }

    const anchor = focus.actorId
      ? view.actors.find((actor) => actor.id === focus.actorId && actor.visible)
      : undefined;
    const x = this.worldXForProgress(anchor ? anchor.progress : focus.progress);
    const y = anchor ? chromeAnchorY(anchor.id) : GROUND_Y - 96;
    const bob = motion ? (tick % 6 < 3 ? 0 : -3) : 0;

    this.presence.syncFocus(
      {
        key: focus.spotId,
        action: focus.prompt,
        name: anchor?.label,
        role: anchor ? this.roles[anchor.id] : undefined,
        x,
        y
      },
      bob
    );
  }

  /** Restart one-shot line reactions (emote pop, hop) when a new line begins. */
  private trackLine(view: RidgeVisualViewModel, now: number): void {
    if (view.lineKey === this.lastLineKey) return;
    const opening = this.lastLineKey === null && view.lineKey !== null;
    this.lastLineKey = view.lineKey;
    this.lineStartedAt = now;
    if (opening) this.measureConversationGround();
  }

  /**
   * The dialogue box has a CSS height, but the camera works in canvas pixels.
   * Measure once per conversation so the ground lands just above the box.
   */
  private measureConversationGround(): void {
    const cssHeight = this.scene.game.canvas?.clientHeight || this.scene.cameras.main.height;
    this.conversationGroundAt = clamp(1 - CONVERSATION_BOX_RESERVE / cssHeight, 0.5, 0.72);
  }

  private advanceConversationBlend(view: RidgeVisualViewModel, now: number, motion: boolean): void {
    const dt = Number.isNaN(this.lastSyncAt) ? 0 : Math.min(100, now - this.lastSyncAt);
    this.lastSyncAt = now;
    this.conversationBlend = approach(
      this.conversationBlend,
      view.mode === 'conversation' ? 1 : 0,
      motion ? dt / CONVERSATION_EASE_MS : 1
    );
    this.buildBlend = approach(
      this.buildBlend,
      view.mode === 'bridgeBuild' ? 1 : 0,
      motion ? dt / BUILD_EASE_MS : 1
    );
  }

  private designKey(design: BridgeDesign | null): number {
    if (!design) return 0;
    let id = this.designIds.get(design);
    if (id === undefined) {
      id = this.nextDesignId++;
      this.designIds.set(design, id);
    }
    return id;
  }

  private syncBuiltShape(view: RidgeVisualViewModel): void {
    const design = view.areaId === 'bridge' && view.crossingOpen ? view.builtBridge : null;
    if (design === this.builtShapeDesign) return;
    this.builtShapeDesign = design;
    const origin = this.bridgeGapOrigin();
    this.builtShape = design ? builtBridgeShape(design, origin.x, origin.y) : null;
  }

  /** Walkers follow the deck of the bridge the player drew. */
  private groundYAt(view: RidgeVisualViewModel, x: number): number {
    if (!this.builtShape || view.areaId !== 'bridge') return GROUND_Y;
    return deckTopAt(this.builtShape, x) ?? GROUND_Y;
  }

  private syncEmote(view: RidgeVisualViewModel, now: number, motion: boolean): void {
    const glyph = view.mode === 'conversation' ? emoteGlyphFor(view.speakingEmotion) : null;
    const speaker = view.speakingActorId
      ? view.actors.find((actor) => actor.id === view.speakingActorId && actor.visible)
      : undefined;
    if (!glyph || !speaker) {
      this.emote.hide();
      return;
    }
    const elapsed = now - this.lineStartedAt;
    const hop = motion && view.speakingEmotion === 'surprised' ? surpriseHop(elapsed) : 0;
    this.emote.show(
      glyph,
      this.worldXForProgress(speaker.progress) + 14,
      GROUND_Y + headTopFor(speaker.id) - 8 - hop,
      elapsed,
      motion
    );
  }

  /**
   * Explore: follow the player at the height-driven zoom.
   * Conversation: ease in on the pair, drifting toward the speaker, with the
   * ground raised so the docked box does not cover anyone.
   */
  private followCamera(view: RidgeVisualViewModel, playerProgress: number): void {
    const cam = this.scene.cameras.main;
    const playerX = this.worldXForProgress(playerProgress);
    const exploreY = GROUND_Y - (VIEW_ABOVE_GROUND - VIEW_BELOW_GROUND) / 2;
    const blend = easeInOut(this.conversationBlend);
    const build = easeInOut(this.buildBlend);

    let zoom = this.baseZoom;
    let centerX = playerX;
    let centerY = exploreY;

    if (blend > 0) {
      const framing = this.conversationFraming(view, playerX);
      // Put GROUND_Y at `conversationGroundAt` of the visible height.
      const viewHeight = cam.height / framing.zoom;
      const talkY = GROUND_Y - viewHeight * (this.conversationGroundAt - 0.5);
      zoom = lerp(zoom, framing.zoom, blend);
      centerX = lerp(centerX, framing.centerX, blend);
      centerY = lerp(centerY, talkY, blend);
    }

    if (build > 0) {
      const framing = this.buildFraming();
      zoom = lerp(zoom, framing.zoom, build);
      centerX = lerp(centerX, framing.centerX, build);
      centerY = lerp(centerY, framing.centerY, build);
    }

    if (cam.zoom !== zoom) cam.setZoom(zoom);
    cam.centerOn(centerX, centerY);
  }

  /** Fit the drawing table between the tip card and the toolbar. */
  private buildFraming(): { zoom: number; centerX: number; centerY: number } {
    const cam = this.scene.cameras.main;
    const { cell, columns, minRow, waterDepth } = BLUEPRINT_BRIDGE_PUZZLE;
    const origin = this.bridgeGapOrigin();
    const left = origin.x - BUILD_MARGIN_LEFT;
    const right = origin.x + columns * cell + BUILD_MARGIN_RIGHT;
    const top = origin.y + minRow * cell - BUILD_MARGIN_TOP;
    const bottom = origin.y + waterDepth + BUILD_MARGIN_BOTTOM;

    const cssHeight = this.scene.game.canvas?.clientHeight || cam.height;
    const toCanvas = cam.height / cssHeight;
    const short = window.innerHeight <= SHORT_VIEWPORT_CSS;
    const reserveTop = (short ? BUILD_RESERVE_TOP_SHORT : BUILD_RESERVE_TOP) * toCanvas;
    const reserveBottom = (short ? BUILD_RESERVE_BOTTOM_SHORT : BUILD_RESERVE_BOTTOM) * toCanvas;
    const usableHeight = Math.max(cam.height * 0.4, cam.height - reserveTop - reserveBottom);

    const zoom = clamp(
      Math.min(cam.width / (right - left), usableHeight / (bottom - top)),
      this.baseZoom * 0.75,
      this.baseZoom * 2.4
    );
    // Centre the table in the band between the chrome, not the whole frame.
    const shift = (reserveTop - reserveBottom) / 2 / zoom;
    return { zoom, centerX: (left + right) / 2, centerY: (top + bottom) / 2 - shift };
  }

  private conversationFraming(
    view: RidgeVisualViewModel,
    playerX: number
  ): { zoom: number; centerX: number } {
    const cam = this.scene.cameras.main;
    let minX = playerX;
    let maxX = playerX;
    let speakerX = playerX;

    for (const actor of view.actors) {
      if (!actor.visible) continue;
      const isSpeaker = actor.id === view.speakingActorId;
      if (!isSpeaker && actor.id !== view.partnerActorId) continue;
      const x = this.worldXForProgress(actor.progress);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      if (isSpeaker) speakerX = x;
    }

    const midX = (minX + maxX) / 2;
    const span = maxX - minX + CONVERSATION_SIDE_MARGIN * 2;
    // Zoom in, but never so far that one of the pair leaves the frame.
    const zoom = clamp(cam.width / span, this.baseZoom, this.baseZoom * CONVERSATION_ZOOM);
    return { zoom, centerX: midX + (speakerX - midX) * SPEAKER_PULL };
  }
}

/** Per-sync inputs shared by every actor request. */
interface ActorFrame {
  view: RidgeVisualViewModel;
  playerProgress: number;
  playerX: number;
  tick: number;
  stepTick: number;
  motion: boolean;
  walking: boolean;
  /** Eased conversation blend, for fading bystanders. */
  fade: number;
  /** Current surprise-hop height for the speaker. */
  hop: number;
}

/** Residents turn to acknowledge you, the way a street does. */
function facingFor(
  actor: RidgeVisualViewModel['actors'][number],
  frame: ActorFrame,
  x: number
): RidgeFacing {
  if (actor.id === 'player') return actor.facing;
  if (Math.abs(actor.progress - frame.playerProgress) >= AWARENESS_RANGE) return actor.facing;
  return frame.playerX >= x ? 'right' : 'left';
}

/** Idle breath is a transform, so it never touches the command buffer. */
function idleBreath(frame: ActorFrame, index: number, isWalking: boolean): number {
  if (!frame.motion || isWalking) return 0;
  return Math.round(Math.sin((frame.tick + index * 3) * 0.42) * 1.4);
}

/** Props and the player never get a focus identity tab or mutter ambient lines. */
function showsPresenceChrome(id: RidgeActorId): boolean {
  return id !== 'player' && id !== 'toy-car' && id !== 'guitar';
}

/** Where floating chrome bottoms out: above the taller of this actor and the player. */
function chromeAnchorY(id: RidgeActorId): number {
  return GROUND_Y + Math.min(headTopFor(id), headTopFor('player')) - CHROME_CLEARANCE;
}

function approach(value: number, target: number, step: number): number {
  return target > value ? Math.min(target, value + step) : Math.max(target, value - step);
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** A single quick hop at the start of a surprised line. */
function surpriseHop(elapsed: number): number {
  if (elapsed < 0 || elapsed >= SURPRISE_HOP_MS) return 0;
  return Math.round(Math.sin((elapsed / SURPRISE_HOP_MS) * Math.PI) * SURPRISE_HOP_HEIGHT);
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
