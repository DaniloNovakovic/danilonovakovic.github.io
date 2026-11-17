import type * as Phaser from 'phaser';
import {
  BLUEPRINT_BRIDGE_PUZZLE,
  BRIDGE_RIVER_PROGRESS,
  CONCERT_LAYOUT,
  DANCE_LAYOUT,
  type BridgeDesign,
  type RidgeActorId,
  type RidgeEmotion,
  type RidgeFacing
} from '@/game/core/ridge';
import type { RidgeVisualProvider, RidgeVisualViewModel } from '../types';
import type { ActorNudge } from '../duelStaging';
import { ActorSpritePool, footDropFor, headTopFor, type ActorRenderRequest } from './actorSprites';
import { GIG_CARD_EDGE_CSS, gigCardWidthCss } from '../gigStaging';
import { drawAmbientFar, drawAmbientNear } from './ambientLayer';
import { drawRidgeAreaLayer, type SceneryLayer } from './areaSets';
import { drawCrtAtmosphere } from './atmosphere';
import { prefersReducedMotion, sketchTick } from '@/game/sharedSceneRuntime/motion/sketchMotion';
import { getCoverVisibleRegion } from '@/game/sharedSceneRuntime/camera/sideViewCameraMath';
import { BarkDirector, type BarkLines } from './barkDirector';
import { builtBridgeShape, deckTopAt, type BuiltBridgeShape } from './bridgeInk';
import { EmoteMark, emoteGlyphFor } from './emoteMark';
import { PresenceLayer, type ActiveBark } from './presenceLayer';
import {
  CONCERT_STAGE_RISE,
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
/** Supersampling cap for baked scenery; past 2x the gain is invisible. */
const MAX_BAKE_SCALE = 2;
/** Widest side a baked band may reach — the WebGL floor every phone meets. */
const MAX_BAKE_TEXTURE = 4096;

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
/** A resident must stand this far inside the frame edge to start a bark. */
const BARK_EDGE_INSET = 40;

/**
 * Conversation framing. The camera eases in toward the people talking, lifts
 * the ground line so the docked dialogue box sits under their feet, and
 * fades bystanders back.
 */
const CONVERSATION_ZOOM = 1.3;
const CONVERSATION_EASE_MS = 320;
/** World units kept clear either side of the outermost speaker. */
const CONVERSATION_SIDE_MARGIN = 70;
/** World px either side of a memory's focus whose residents are kept in frame. */
const MEMORY_FRAME_RANGE = 130;
/** How far the frame drifts from the pair's midpoint toward whoever is talking. */
const SPEAKER_PULL = 0.18;
/** CSS pixels the docked conversation box occupies along the frame bottom. */
const CONVERSATION_BOX_RESERVE = 165;
const BYSTANDER_ALPHA = 0.4;
/** World units over which a walker steps from the lane up onto the bridge deck. */
const DECK_STEP_ON = 30;

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
/**
 * Below the Tailwind `sm` breakpoint the tip card takes its own full-width row
 * under the title, and the toolbar wraps onto two rows.
 */
const NARROW_VIEWPORT_CSS = 640;
const BUILD_RESERVE_TOP_NARROW = 128;
/** Side margins on narrow screens: just the car's start and the far bank lip. */
const BUILD_MARGIN_LEFT_NARROW = 86;
const BUILD_MARGIN_RIGHT_NARROW = 40;
const BUILD_RESERVE_BOTTOM_NARROW = 144;
/** Floor so a degenerate frame never inverts or collapses the camera. */
const BUILD_MIN_ZOOM = 0.3;
const SURPRISE_HOP_MS = 260;
/** World units over which a walker steps up onto the concert stage. */
const STAGE_STEP_ON = 16;
/**
 * Show framing: the performer and the crowd either side of the note highway,
 * ground low in the frame so the highway has the sky to itself.
 */
const GIG_EASE_MS = 520;
const GIG_SIDE_MARGIN = 70;
const GIG_GROUND_AT = 0.8;
/**
 * Lesson framing: the Profe, you, and the driver, ground a little above
 * centre so the step strip and the touch buttons fit underneath.
 */
const LESSON_SIDE_MARGIN = 54;
const LESSON_GROUND_AT = { fine: 0.56, coarse: 0.48 } as const;
const NO_NUDGE: ActorNudge = { dx: 0, dy: 0 };
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
  /** 0 = exploring, 1 = framed on the concert stage for a show. */
  private gigBlend = 0;
  /** 0 = exploring, 1 = framed on the bachata lesson behind the shelter. */
  private lessonBlend = 0;
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
    // Foreground corn would scribble over the drawing table (and grass over the
    // Profe's count); let it step aside.
    this.sceneryImages.get('fore')?.setAlpha(1 - easeInOut(Math.max(this.buildBlend, this.lessonBlend)) * 0.92);
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
    // Only Relay redresses per beat; elsewhere the crossing state and any
    // stage-requested set dressing cover it.
    const content =
      view.areaId === 'relay'
        ? `${view.areaId}|${view.beat}`
        : `${view.areaId}|${view.crossingOpen}|${this.designKey(view.builtBridge)}|${view.sceneryMarks.join(',')}`;
    const key = `${content}|${this.bakeScale()}`;
    if (key === this.lastSceneryKey) return;
    this.lastSceneryKey = key;

    for (const layer of SCENERY_LAYERS) {
      this.bakeSceneryLayer(layer, view);
    }
  }

  /**
   * Texels per world unit for baked scenery. A 1:1 bake is magnified by the
   * camera zoom, which staircases every diagonal and smears thin ink into
   * grey; baking near the zoom keeps a texel at or under a canvas pixel.
   * Quantised so small viewport changes do not trigger a rebake.
   */
  private bakeScale(): number {
    const widest = Math.max(...SCENERY_LAYERS.map((layer) => LAYERS[layer].width));
    const ceiling = Math.min(MAX_BAKE_SCALE, MAX_BAKE_TEXTURE / widest);
    return Math.max(1, Math.min(ceiling, Math.ceil(this.baseZoom * 4) / 4));
  }

  private bakeSceneryLayer(layer: SceneryLayer, view: RidgeVisualViewModel): void {
    const spec = LAYERS[layer];
    const scale = this.bakeScale();
    const g = this.scene.make.graphics({ x: 0, y: 0 }).setScale(scale);
    drawRidgeAreaLayer(g, layer, view.areaId, view.crossingOpen, view.beat, {
      marks: new Set(view.sceneryMarks),
      worldXForProgress: (progress) => this.worldXForProgress(progress),
      bridgeGap: {
        left: this.worldXForProgress(BRIDGE_RIVER_PROGRESS.left),
        right: this.worldXForProgress(BRIDGE_RIVER_PROGRESS.right)
      },
      builtBridge: view.areaId === 'bridge' ? this.builtShape : null
    });

    const key = SCENERY_TEXTURE_KEY[layer];
    try {
      const texture = replaceDynamicTexture(
        this.scene,
        key,
        Math.ceil(spec.width * scale),
        Math.ceil(spec.height * scale)
      );
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
      image.setScale(1 / scale).setVisible(true);
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
    // A memory is all cast: nobody fades back as a bystander.
    const inScene = isPlayer || isTalking || actor.id === view.partnerActorId || view.memoryShot !== null;

    const nudge = nudgeFor(view, actor.id);

    return {
      id: actor.id,
      x: x + nudge.dx,
      y: this.groundYAt(view, x, actor.id),
      facing: facingFor(actor, frame, x),
      bob: idleBreath(frame, index, isWalking) - (isTalking ? frame.hop : 0) + nudge.dy,
      alpha: inScene ? 1 : 1 - (1 - BYSTANDER_ALPHA) * frame.fade,
      pose: {
        frame: (isWalking ? frame.stepTick : frame.tick) + index,
        walking: isWalking,
        talking: isTalking,
        emotion: nudge.emotion ?? speakingEmotionFor(view, isTalking),
        ...heldPoseOf(actor, nudge)
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
    const inConversation = view.mode !== 'explore';
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
    const frame = this.scene.cameras.main.worldView;

    for (const actor of view.actors) {
      if (!actor.visible || !showsPresenceChrome(actor.id)) continue;
      if (Math.abs(actor.progress - playerProgress) > PRESENCE_RANGE) continue;
      if (actor.id === focus?.actorId) continue;
      // A line from someone off-frame is a bubble with nobody under it.
      const x = this.worldXForProgress(actor.progress);
      if (frame.width > 0 && (x < frame.left + BARK_EDGE_INSET || x > frame.right - BARK_EDGE_INSET)) {
        continue;
      }
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
    const frame = this.scene.cameras.main.worldView;
    this.presence.syncBarks(barks, frame.width > 0 ? { left: frame.left, right: frame.right } : null);
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
      view.mode === 'conversation' || view.mode === 'cickaDuel' ? 1 : 0,
      motion ? dt / CONVERSATION_EASE_MS : 1
    );
    this.buildBlend = approach(
      this.buildBlend,
      view.mode === 'bridgeBuild' ? 1 : 0,
      motion ? dt / BUILD_EASE_MS : 1
    );
    this.gigBlend = approach(this.gigBlend, view.mode === 'concertGig' ? 1 : 0, motion ? dt / GIG_EASE_MS : 1);
    this.lessonBlend = approach(this.lessonBlend, view.mode === 'bachataLesson' ? 1 : 0, motion ? dt / GIG_EASE_MS : 1);
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

  /**
   * Walkers follow the deck of the bridge the player drew, feet on the road.
   * Over the first stretch from each bank they ease from the lane's footing up
   * onto the deck, so stepping on reads as a step rather than a jump.
   */
  private groundYAt(view: RidgeVisualViewModel, x: number, id: RidgeActorId): number {
    if (view.areaId === 'concert') return this.concertGroundAt(x, id);
    if (!this.builtShape || view.areaId !== 'bridge') return GROUND_Y;
    const deck = deckTopAt(this.builtShape, x);
    if (deck === null) return GROUND_Y;
    const left = this.worldXForProgress(BRIDGE_RIVER_PROGRESS.left);
    const right = this.worldXForProgress(BRIDGE_RIVER_PROGRESS.right);
    const onto = Math.min(1, Math.max(0, Math.min(x - left, right - x) / DECK_STEP_ON));
    return GROUND_Y + (deck - footDropFor(id) - GROUND_Y) * onto;
  }

  /** The stage deck is a step up; only people climb it (Cicka stays off). */
  private concertGroundAt(x: number, id: RidgeActorId): number {
    if (id === 'cicka' || id === 'crowd') return GROUND_Y;
    const centre = this.worldXForProgress(CONCERT_LAYOUT.stage);
    const half = CONCERT_LAYOUT.stageHalfWidth * (this.stageWidth - 160);
    const inside = half - Math.abs(x - centre);
    if (inside <= 0) return GROUND_Y;
    return GROUND_Y - CONCERT_STAGE_RISE * Math.min(1, inside / STAGE_STEP_ON);
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

    const gig = easeInOut(this.gigBlend);
    if (gig > 0) {
      const framing = this.gigFraming(view);
      zoom = lerp(zoom, framing.zoom, gig);
      centerX = lerp(centerX, framing.centerX, gig);
      centerY = lerp(centerY, framing.centerY, gig);
    }

    const lesson = easeInOut(this.lessonBlend);
    if (lesson > 0) {
      const framing = this.lessonFraming();
      zoom = lerp(zoom, framing.zoom, lesson);
      centerX = lerp(centerX, framing.centerX, lesson);
      centerY = lerp(centerY, framing.centerY, lesson);
    }

    if (build > 0) {
      const framing = this.buildFraming();
      zoom = lerp(zoom, framing.zoom, build);
      centerX = lerp(centerX, framing.centerX, build);
      centerY = lerp(centerY, framing.centerY, build);
    }

    if (cam.zoom !== zoom) cam.setZoom(zoom);
    // Zoomed out on a tall phone the view can outgrow the stage; the table
    // stays centred and the paper background fills the rest.
    cam.useBounds = build === 0;
    cam.centerOn(centerX, centerY);
  }

  /**
   * Fit the drawing table between the tip card and the toolbar, inside the
   * part of the canvas the cover crop actually leaves on screen (a portrait
   * phone only sees a middle slice of the 1000-wide canvas).
   */
  private buildFraming(): { zoom: number; centerX: number; centerY: number } {
    const cam = this.scene.cameras.main;
    const { cell, columns, minRow, waterDepth } = BLUEPRINT_BRIDGE_PUZZLE;
    const origin = this.bridgeGapOrigin();
    const narrow = window.innerWidth < NARROW_VIEWPORT_CSS;
    const left = origin.x - (narrow ? BUILD_MARGIN_LEFT_NARROW : BUILD_MARGIN_LEFT);
    const right = origin.x + columns * cell + (narrow ? BUILD_MARGIN_RIGHT_NARROW : BUILD_MARGIN_RIGHT);
    const top = origin.y + minRow * cell - BUILD_MARGIN_TOP;
    const bottom = origin.y + waterDepth + BUILD_MARGIN_BOTTOM;

    const parent = this.scene.scale.parentSize;
    const visible = getCoverVisibleRegion({
      viewport: { width: parent.width, height: parent.height },
      designSize: { width: cam.width, height: cam.height }
    });
    const [reserveTopCss, reserveBottomCss] = buildChromeReserve();
    const reserveTop = reserveTopCss * visible.canvasPerCss;
    const reserveBottom = reserveBottomCss * visible.canvasPerCss;
    const usableHeight = Math.max(visible.height * 0.4, visible.height - reserveTop - reserveBottom);

    // Fitting the whole table wins over the readable figure size: a cut-off
    // bank cannot be drawn to.
    const zoom = clamp(
      Math.min(visible.width / (right - left), usableHeight / (bottom - top)),
      BUILD_MIN_ZOOM,
      this.baseZoom * 2.4
    );
    // Centre the table in the band between the chrome, not the whole frame.
    const shift = (reserveTop - reserveBottom) / 2 / zoom;
    return { zoom, centerX: (left + right) / 2, centerY: (top + bottom) / 2 - shift };
  }

  /**
   * Fit performer and audience in the part of the canvas the cover crop leaves
   * visible, centred on the gap between them where the highway draws. The
   * audience is the crowd at the Concert, or the cats at Last-Stop Plaza.
   */
  private gigFraming(view: RidgeVisualViewModel): { zoom: number; centerX: number; centerY: number } {
    const cam = this.scene.cameras.main;
    const xOf = (id: RidgeActorId, fallback: number) =>
      this.worldXForProgress(view.actors.find((actor) => actor.id === id)?.progress ?? fallback);
    const audience = view.areaId === 'concert' ? xOf('crowd', CONCERT_LAYOUT.crowd) : this.worldXForProgress(DANCE_LAYOUT.chairs);
    const performer = xOf('player', CONCERT_LAYOUT.stage);
    const left = Math.min(performer, audience) - GIG_SIDE_MARGIN;
    const right = Math.max(performer, audience) + GIG_SIDE_MARGIN;
    const parent = this.scene.scale.parentSize;
    const visible = getCoverVisibleRegion({
      viewport: { width: parent.width, height: parent.height },
      designSize: { width: cam.width, height: cam.height }
    });
    // Off stage the highway docks right: fit the performer and the cats in what is left.
    const cardCanvas =
      view.areaId === 'concert'
        ? 0
        : (gigCardWidthCss(visible.width / visible.canvasPerCss) + GIG_CARD_EDGE_CSS * 2) * visible.canvasPerCss;
    const zoom = clamp((visible.width - cardCanvas) / (right - left), this.baseZoom * 0.72, this.baseZoom * 1.05);
    const viewHeight = visible.height / zoom;
    // Centre on the visible slice, not the whole canvas, so the ground sits low on any screen.
    return {
      zoom,
      centerX: (left + right) / 2 + cardCanvas / 2 / zoom,
      centerY: GROUND_Y - viewHeight * (GIG_GROUND_AT - 0.5)
    };
  }

  /** The three dancers behind the shuttle shelter, over the step strip. */
  private lessonFraming(): { zoom: number; centerX: number; centerY: number } {
    const cam = this.scene.cameras.main;
    const left = this.worldXForProgress(DANCE_LAYOUT.lesson.teacher) - LESSON_SIDE_MARGIN;
    const right = this.worldXForProgress(DANCE_LAYOUT.lesson.driver) + LESSON_SIDE_MARGIN;
    const parent = this.scene.scale.parentSize;
    const visible = getCoverVisibleRegion({
      viewport: { width: parent.width, height: parent.height },
      designSize: { width: cam.width, height: cam.height }
    });
    const zoom = clamp(visible.width / (right - left), this.baseZoom * 0.8, this.baseZoom * 1.35);
    const viewHeight = visible.height / zoom;
    const fine = window.matchMedia?.('(pointer: fine)').matches ?? false;
    const groundAt = fine ? LESSON_GROUND_AT.fine : LESSON_GROUND_AT.coarse;
    return { zoom, centerX: (left + right) / 2, centerY: GROUND_Y - viewHeight * (groundAt - 0.5) };
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
      const x = this.worldXForProgress(actor.progress);
      // A memory frames everyone near its focus, not a talking pair.
      const inShot = view.memoryShot !== null && Math.abs(x - playerX) <= MEMORY_FRAME_RANGE;
      if (!isSpeaker && actor.id !== view.partnerActorId && !inShot) continue;
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
  // In a memory the player is not there to turn toward.
  if (frame.view.memoryShot !== null) return actor.facing;
  if (Math.abs(actor.progress - frame.playerProgress) >= AWARENESS_RANGE) return actor.facing;
  return frame.playerX >= x ? 'right' : 'left';
}

/** What the actor holds or sits on, and the strum arm a performance moves. */
function heldPoseOf(actor: RidgeVisualViewModel['actors'][number], nudge: ActorNudge) {
  return { prop: actor.prop, seated: actor.seated, strum: nudge.strum, dance: nudge.dance };
}

/** Mini-game body nudge (Cicka's Standoff lunges and hops), or none. */
function nudgeFor(view: RidgeVisualViewModel, id: RidgeActorId): ActorNudge {
  return view.actorNudges?.[id] ?? NO_NUDGE;
}

function speakingEmotionFor(view: RidgeVisualViewModel, isTalking: boolean): RidgeEmotion | null {
  return isTalking ? view.speakingEmotion : null;
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

/** CSS pixels the builder chrome takes at the top and bottom of the frame. */
function buildChromeReserve(): [number, number] {
  if (window.innerHeight <= SHORT_VIEWPORT_CSS) return [BUILD_RESERVE_TOP_SHORT, BUILD_RESERVE_BOTTOM_SHORT];
  if (window.innerWidth < NARROW_VIEWPORT_CSS) return [BUILD_RESERVE_TOP_NARROW, BUILD_RESERVE_BOTTOM_NARROW];
  return [BUILD_RESERVE_TOP, BUILD_RESERVE_BOTTOM];
}
