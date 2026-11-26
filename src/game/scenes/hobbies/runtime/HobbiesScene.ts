/**
 * HobbiesScene — thin orchestrator.
 * Delegates room layout to HobbiesRoom, player logic to PlayerController.
 */
import * as Phaser from 'phaser';
import { HOBBIES_EXIT_X, HOBBIES_ROOM_INTERACTABLES } from '../roomLayout';
import { getMessages } from '@/shared/i18n';
import type { HobbiesOverlayId, OverlayId } from '@/game/overlays/overlayIds';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH,
  HOBBIES_FLOOR_Y,
  HOBBIES_GROUND_ZONE,
  HOBBIES_INTERACT_RADIUS,
  HOBBIES_RESUME_CLAMP,
  HOBBIES_ROOM_HEIGHT,
  HOBBIES_ROOM_WIDTH,
  HOBBIES_PLAYER_START_OFFSET_Y,
  SIDE_VIEW_JUMP_VELOCITY_Y,
  SIDE_VIEW_SPRINT_SPEED,
  SIDE_VIEW_WALK_SPEED
} from '@/game/sharedSceneRuntime/config';
import { bridgeActions, bridgeStore, isItemEquipped, isItemOwned, type OpenOverlayOptions } from '@/game/bridge/store';
import { CIRCUIT_PART_HOBBY, CIRCUIT_PART_IDS } from '@/game/core/console/content/circuitParts';
import {
  DEBUGGING_TOOLS_ITEM_ID,
  HOBBIES_LEFT_WALL_X,
  HOBBIES_RIGHT_WALL_X,
  isSimulationBroken,
  OUT_OF_BOUNDS_ALERT_THOUGHT,
  OUT_OF_BOUNDS_BARRIER_THOUGHT,
  OUT_OF_BOUNDS_BARRIER_X,
  OUT_OF_BOUNDS_CAMERA_LEFT_X,
  OUT_OF_BOUNDS_ESCAPE_CAMERA_LEFT_X,
  OUT_OF_BOUNDS_ESCAPE_MAX_X,
  OUT_OF_BOUNDS_ESCAPE_MIN_X,
  OUT_OF_BOUNDS_ESCAPE_START_X,
  OUT_OF_BOUNDS_ESCAPE_WORLD_LEFT_X,
  OUT_OF_BOUNDS_ESCAPE_WORLD_RIGHT_X,
  OUT_OF_BOUNDS_TOOLBOX_X,
  OUT_OF_BOUNDS_WORLD_LEFT_X,
  BASEMENT_BREACH_ENTRY,
  reachesOutOfBoundsOpening
} from '@/game/core/console';
import { BASEMENT_SCENE_ID, HOBBIES_SCENE_ID, PHASER_SCENE_KEYS, type SceneId } from '@/game/scenes/sceneIds';
import { placeNextSceneStart } from '@/game/sharedSceneRuntime/sceneResumePolicy';
import type { SceneUiActionRequest } from '@/game/sceneUi/types';
import { prefersReducedMotion, sketchTick } from '@/game/sharedSceneRuntime/motion/sketchMotion';
import { HobbiesRoom } from './HobbiesRoom';
import { HobbiesEscape } from './HobbiesEscape';
import { HobbiesVoid } from './HobbiesVoid';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import {
  createSideViewPlayerRuntime,
  type SideViewPlayerRuntime
} from '@/game/sharedSceneRuntime/player/SideViewPlayerRuntime';
import {
  createInteriorInteractionRuntime,
  type InteriorInteractionRuntime,
  type InteriorInteractionTarget
} from '@/game/sharedSceneRuntime/interactions/InteriorInteractionRuntime';

const ROOM_CAMERA_BOUNDS = { x: 0, y: 0, width: HOBBIES_ROOM_WIDTH, height: HOBBIES_ROOM_HEIGHT };
const VOID_CAMERA_BOUNDS = {
  x: OUT_OF_BOUNDS_CAMERA_LEFT_X,
  y: 0,
  width: HOBBIES_ROOM_WIDTH - OUT_OF_BOUNDS_CAMERA_LEFT_X,
  height: HOBBIES_ROOM_HEIGHT
};

/** Once the simulation is broken: from past the opening to just beyond the scribbled-out wall. */
const ESCAPE_CAMERA_BOUNDS = {
  x: OUT_OF_BOUNDS_ESCAPE_CAMERA_LEFT_X,
  y: 0,
  width: OUT_OF_BOUNDS_BARRIER_X + 260 - OUT_OF_BOUNDS_ESCAPE_CAMERA_LEFT_X,
  height: HOBBIES_ROOM_HEIGHT
};

/** The pickup cinematic, in ms after confirming (docs/game-design/secrets/out-of-bounds.md, Act 2). */
const CINEMATIC = {
  zoomInMs: 700,
  liftAt: 750,
  zoomOutAt: 1500,
  alertAt: 2200,
  releaseAt: 2700,
  thoughtAt: 3000
} as const;
const CINEMATIC_ZOOM = 1.7;
/** Stepping into the torn opening: the view sinks into its ink, then the Basement (#162). */
const THROUGH_OPENING_FADE_MS = 360;
const INK_RGB = [26, 26, 26] as const;

/**
 * - explore: walking about.
 * - warning: the point-of-no-return panel is up; the player is held.
 * - cinematic: confirmed; the player is held while the camera does the pickup.
 * - throughOpening: stepped into the torn opening; held while the view sinks into the ink.
 */
type HobbiesSequence = 'explore' | 'warning' | 'cinematic' | 'throughOpening';

type HobbiesInteractionEffect =
  | { kind: 'close' }
  | { kind: 'openOverlay'; id: HobbiesOverlayId }
  | { kind: 'askPointOfNoReturn' };

type HobbiesInteractionId = 'exit' | 'toolbox' | HobbiesOverlayId;

/** Out of Bounds, Act 2: the Debugging Tools on the floor at the end of the void. */
function toolboxTarget(
  isExploring: () => boolean
): InteriorInteractionTarget<HobbiesInteractionId, HobbiesInteractionEffect> {
  return {
    id: 'toolbox',
    kind: 'toolbox',
    x: OUT_OF_BOUNDS_TOOLBOX_X,
    distanceAnchorY: 450,
    // The player stops 60px short of the toolbox; reach it from there.
    interactRadius: 110,
    prompt: { x: OUT_OF_BOUNDS_TOOLBOX_X, y: HOBBIES_FLOOR_Y - 120 },
    enabled: () => isExploring() && !isItemOwned(DEBUGGING_TOOLS_ITEM_ID),
    effect: { kind: 'askPointOfNoReturn' }
  };
}

export class HobbiesScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  exitPrompt!: Phaser.GameObjects.Text;

  private playerRuntime?: SideViewPlayerRuntime;
  private interactionRuntime?: InteriorInteractionRuntime<HobbiesInteractionId, HobbiesInteractionEffect>;
  private onClose?: () => void;
  private onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  private onEnterScene?: (sceneId: SceneId) => void;
  private isPaused: boolean = false;
  private room?: HobbiesRoom;
  private outOfBounds?: HobbiesVoid;
  private escape?: HobbiesEscape;
  private cameraShowsVoid = false;
  private sequence: HobbiesSequence = 'explore';
  /** The simulation was broken before or during this visit: the way back is shut. */
  private escaped = false;
  /** The toolbox has left the floor (lags the Backpack by the cinematic's zoom-in). */
  private kitLifted = false;
  private barrierThoughtShown = false;
  private motion = true;
  private readonly claimedScratch = new Set<HobbiesOverlayId>();
  private resumePosition?: { x: number; y: number };

  constructor() {
    super({ key: 'hobbies' });
  }

  init(data: {
    onClose: () => void;
    onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
    onEnterScene?: (sceneId: SceneId) => void;
    isPaused?: boolean;
    resumePosition?: { x: number; y: number };
  }) {
    this.onClose = data.onClose;
    this.onOpenOverlay = data.onOpenOverlay;
    this.onEnterScene = data.onEnterScene;
    this.isPaused = data.isPaused ?? false;
    this.resumePosition = data.resumePosition;
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    // Gone through the opening: a later visit starts back inside the barrier, not in the tear.
    if (this.sequence === 'throughOpening') {
      return { x: OUT_OF_BOUNDS_ESCAPE_START_X, y: HOBBIES_FLOOR_Y - HOBBIES_PLAYER_START_OFFSET_Y };
    }
    return this.playerRuntime?.captureResume() ?? null;
  }

  setPaused(paused: boolean) {
    this.isPaused = paused;
    this.playerRuntime?.setPaused(paused);
    this.syncHold();
  }

  /**
   * The warning and the cinematic hold the player through the controller
   * only: the keyboard stays live, so Esc still leaves the room at any moment.
   */
  private syncHold(): void {
    const controller = this.playerRuntime?.controller;
    if (!controller || this.isPaused) return;
    if (this.sequence === 'explore') controller.resume();
    else controller.pause();
  }

  create() {
    const messages = getMessages();
    const width = HOBBIES_ROOM_WIDTH;
    const floorY = HOBBIES_FLOOR_Y;

    // Right edge is the drawn wall. The left wall is drawn just as solid but has
    // no collision: beyond it runs the Out of Bounds void to the toolbox
    // (docs/game-design/secrets/out-of-bounds.md, Act 1). Once the simulation
    // is broken the world is only the escape: the opening to the barrier.
    this.escaped = isSimulationBroken(bridgeStore.getState().inventory.ownedItemIds);
    this.kitLifted = this.escaped;
    this.sequence = 'explore';
    this.barrierThoughtShown = false;
    const worldLeft = this.escaped ? OUT_OF_BOUNDS_ESCAPE_WORLD_LEFT_X : OUT_OF_BOUNDS_WORLD_LEFT_X;
    this.setWorldBounds(worldLeft, this.escaped ? OUT_OF_BOUNDS_ESCAPE_WORLD_RIGHT_X : HOBBIES_RIGHT_WALL_X);
    const start = {
      x: this.escaped ? OUT_OF_BOUNDS_ESCAPE_START_X : width / 2,
      y: floorY - HOBBIES_PLAYER_START_OFFSET_Y
    };

    this.motion = !prefersReducedMotion();
    this.room = new HobbiesRoom(this);

    this.playerRuntime = createSideViewPlayerRuntime({
      scene: this,
      start,
      resumePosition: this.resumePosition,
      resumeClamp: this.escaped
        ? { ...HOBBIES_RESUME_CLAMP, minX: OUT_OF_BOUNDS_ESCAPE_MIN_X, maxX: OUT_OF_BOUNDS_ESCAPE_MAX_X }
        : HOBBIES_RESUME_CLAMP,
      sprite: {
        depth: 8,
        gravityY: 1000
      },
      movement: {
        walkSpeed: SIDE_VIEW_WALK_SPEED,
        sprintSpeed: SIDE_VIEW_SPRINT_SPEED,
        jumpVelocityY: SIDE_VIEW_JUMP_VELOCITY_Y
      },
      input: {
        allowJump: true,
        allowSprint: true,
        includeEscapeKey: true
      },
      appearance: {
        isGlassesEquipped: () => isItemEquipped('glasses'),
        idleTextureKey: 'player_idle',
        glassesTextureKey: 'player_glasses'
      },
      camera: {
        // Framed on the room until the player glitches out (see updateCameraWorld).
        worldBounds: this.escaped ? ESCAPE_CAMERA_BOUNDS : ROOM_CAMERA_BOUNDS,
        designSize: {
          width: GAME_DESIGN_WIDTH,
          height: GAME_DESIGN_HEIGHT
        },
        profile: {
          zoom: 1,
          followOffsetY: 0
        }
      }
    });
    this.player = this.playerRuntime.player;
    this.cameraShowsVoid = this.escaped;
    this.outOfBounds = new HobbiesVoid(this, this.player, () => this.getAudioContext(), this.player.x);
    this.escape = new HobbiesEscape(this, () => this.getAudioContext());
    if (this.escaped) {
      this.escape.showBroken();
      this.player.setFlipX(true);
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => bridgeActions.clearSceneUi(HOBBIES_SCENE_ID));

    // The floor keeps going under the void even after its ink line stops, and
    // always as far as the escape's opening: confirming the toolbox widens the
    // world mid-visit, and the player must not fall through the page there.
    const groundLeft = OUT_OF_BOUNDS_ESCAPE_WORLD_LEFT_X;
    const ground = this.add.zone(
      (groundLeft + width) / 2,
      floorY + HOBBIES_GROUND_ZONE.centerOffsetY,
      width - groundLeft,
      HOBBIES_GROUND_ZONE.height
    );
    this.physics.add.existing(ground, true);
    this.physics.add.collider(this.player, ground);

    this.exitPrompt = createUiText(this, HOBBIES_EXIT_X, floorY - 150, messages.navigation.interact, {
      fontSize: '16px',
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 2 }
    })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(100);

    this.interactionRuntime = createInteriorInteractionRuntime<HobbiesInteractionId, HobbiesInteractionEffect>({
      interactRadius: HOBBIES_INTERACT_RADIUS,
      exitEffect: { kind: 'close' },
      targets: [
        ...HOBBIES_ROOM_INTERACTABLES.map((target) => ({
          ...target,
          effect:
            target.kind === 'exit'
              ? ({ kind: 'close' } satisfies HobbiesInteractionEffect)
              : ({ kind: 'openOverlay', id: target.id } satisfies HobbiesInteractionEffect)
        })),
        toolboxTarget(() => this.sequence === 'explore')
      ]
    });

    this.cameras.main.setBackgroundColor('#f4f1ea');

    this.setPaused(this.isPaused);
    this.playerRuntime.syncAppearance();
  }

  update(time: number) {
    const playerUpdate = this.playerRuntime?.update();
    if (!playerUpdate || playerUpdate.paused) {
      this.exitPrompt.setVisible(false);
      return;
    }

    const { commands, step } = playerUpdate;
    const interaction = this.interactionRuntime?.update({
      playerX: this.player.x,
      playerY: this.player.y,
      interactRequested: step.interactRequested,
      exitRequested: commands.exitContext
    });
    const activeId = interaction?.activeTarget?.id ?? null;
    this.updateRoom(activeId === 'toolbox' ? null : activeId, sketchTick(time));
    this.updateOutOfBounds(time);
    if (this.sequence === 'warning') this.updateWarning(time);
    this.updateOpening();

    if (interaction?.effect?.kind === 'close') {
      this.onClose?.();
      return;
    }

    if (!interaction || !interaction.prompt.visible) {
      this.exitPrompt.setVisible(false);
      return;
    }

    this.exitPrompt.setPosition(interaction.prompt.x, interaction.prompt.y).setVisible(true);
    if (interaction.effect) this.applyInteractionEffect(interaction.effect);
  }

  private applyInteractionEffect(effect: HobbiesInteractionEffect): void {
    switch (effect.kind) {
      case 'openOverlay':
        this.onOpenOverlay?.(effect.id);
        break;
      case 'askPointOfNoReturn':
        this.sequence = 'warning';
        this.syncHold();
        this.exitPrompt.setVisible(false);
        bridgeActions.setSceneUiPanel(HOBBIES_SCENE_ID, 'pointOfNoReturn');
        break;
      case 'close':
        break;
    }
  }

  private updateWarning(time: number): void {
    // Taps on the touch mat while the panel is up must not fire once it closes.
    bridgeActions.consumeTouchOneShots();
    let action = bridgeActions.consumeSceneUiAction(HOBBIES_SCENE_ID);
    while (action && this.sequence === 'warning') {
      this.answerWarning(action, time);
      action = this.sequence === 'warning' ? bridgeActions.consumeSceneUiAction(HOBBIES_SCENE_ID) : null;
    }
  }

  private answerWarning(action: SceneUiActionRequest, time: number): void {
    if (action.action === 'pointOfNoReturnDecline') {
      bridgeActions.clearSceneUiPanel(HOBBIES_SCENE_ID);
      this.sequence = 'explore';
      this.syncHold();
    } else if (action.action === 'pointOfNoReturnConfirm') {
      bridgeActions.clearSceneUiPanel(HOBBIES_SCENE_ID);
      this.startCinematic(time);
    }
  }

  /**
   * Confirmed: the simulation breaks now (leaving mid-cinematic still counts).
   * Zoom in on Danilo and the toolbox, lift it, ease back out, then the alert
   * and the wall. Under reduced motion every camera move is a cut.
   */
  private startCinematic(time: number): void {
    this.sequence = 'cinematic';
    this.syncHold();
    bridgeActions.collectItem(DEBUGGING_TOOLS_ITEM_ID);
    this.escaped = true;
    this.setWorldBounds(OUT_OF_BOUNDS_ESCAPE_WORLD_LEFT_X, OUT_OF_BOUNDS_ESCAPE_WORLD_RIGHT_X);
    this.cameraShowsVoid = true;
    const camera = this.playerRuntime?.cameraRuntime;
    camera?.setWorldBounds(ESCAPE_CAMERA_BOUNDS);
    camera?.focus({
      x: (this.player.x + OUT_OF_BOUNDS_TOOLBOX_X) / 2,
      y: HOBBIES_FLOOR_Y - 60,
      zoom: CINEMATIC_ZOOM,
      screenY: 0.62,
      durationMs: this.motion ? CINEMATIC.zoomInMs : 0
    });
    const at = (delay: number, run: (now: number) => void) => this.time.delayedCall(delay, () => run(time + delay));
    at(CINEMATIC.liftAt, (now) => {
      this.kitLifted = true;
      this.outOfBounds?.pickUpKit({ time: now, motion: this.motion });
    });
    at(CINEMATIC.zoomOutAt, () => camera?.focus(null));
    at(CINEMATIC.alertAt, (now) => this.escape?.playAlert({ time: now, motion: this.motion }));
    at(CINEMATIC.releaseAt, () => {
      this.sequence = 'explore';
      this.syncHold();
    });
    at(CINEMATIC.thoughtAt, (now) => this.outOfBounds?.say(OUT_OF_BOUNDS_ALERT_THOUGHT, { time: now }));
  }

  /**
   * Out of Bounds, Act 3 (#162): walking into the torn opening breaks through
   * the right wall of the real Basement. The player lands at the breach; the
   * view sinks into the opening's ink first (a cut under reduced motion).
   * Esc stays live throughout.
   */
  private updateOpening(): void {
    if (!this.escaped || this.sequence !== 'explore' || !reachesOutOfBoundsOpening(this.player.x)) return;
    this.sequence = 'throughOpening';
    this.syncHold();
    this.exitPrompt.setVisible(false);
    const go = () => {
      placeNextSceneStart(PHASER_SCENE_KEYS.basement, BASEMENT_BREACH_ENTRY);
      this.onEnterScene?.(BASEMENT_SCENE_ID);
    };
    if (!this.motion) {
      go();
      return;
    }
    this.cameras.main.fadeOut(THROUGH_OPENING_FADE_MS, ...INK_RGB);
    // Scene clock: dropped if the player leaves (Esc) before it fires.
    this.time.delayedCall(THROUGH_OPENING_FADE_MS, go);
  }

  private setWorldBounds(left: number, right: number): void {
    this.physics.world.setBounds(left, 0, right - left, HOBBIES_ROOM_HEIGHT);
  }

  /** Walking into the scribbled-out wall: Danilo notices, once a visit. */
  private updateBarrier(time: number): void {
    if (!this.escaped || this.barrierThoughtShown || this.sequence !== 'explore') return;
    if (this.player.x < OUT_OF_BOUNDS_ESCAPE_MAX_X - 2) return;
    this.barrierThoughtShown = true;
    this.outOfBounds?.say(OUT_OF_BOUNDS_BARRIER_THOUGHT, { time });
  }

  private updateOutOfBounds(time: number): void {
    this.updateCameraWorld();
    const { body } = this.player;
    this.outOfBounds?.update({
      playerX: this.player.x,
      kitOwned: this.kitLifted,
      walking: body.blocked.down && Math.abs(body.velocity.x) > 1,
      time,
      motion: this.motion
    });
    this.escape?.update({ time, motion: this.motion });
    this.updateBarrier(time);
  }

  /**
   * The camera only reveals the void once the player is out in it, so the room
   * never looks like it has anything beside it. Back inside, it re-frames the
   * room once the room fills the view again, so the switch never snaps.
   */
  private updateCameraWorld(): void {
    const camera = this.playerRuntime?.cameraRuntime;
    // During the escape the camera keeps the escape's own bounds.
    if (!camera || this.escaped) return;
    const x = this.player.x;
    if (!this.cameraShowsVoid && x < HOBBIES_LEFT_WALL_X) {
      this.cameraShowsVoid = true;
      camera.setWorldBounds(VOID_CAMERA_BOUNDS);
    } else if (this.cameraShowsVoid && x > HOBBIES_ROOM_WIDTH / 2) {
      this.cameraShowsVoid = false;
      camera.setWorldBounds(ROOM_CAMERA_BOUNDS);
    }
  }

  private getAudioContext(): AudioContext | null {
    const sound = this.sound as Partial<Phaser.Sound.WebAudioSoundManager>;
    return sound.context ?? null;
  }

  private updateRoom(activeId: Exclude<HobbiesInteractionId, 'toolbox'> | null, tick: number): void {
    const state = bridgeStore.getState();
    this.claimedScratch.clear();
    for (const partId of CIRCUIT_PART_IDS) {
      if (state.inventory.ownedItemIds.includes(partId)) this.claimedScratch.add(CIRCUIT_PART_HOBBY[partId]);
    }
    if (state.progress.streetDoodle) this.claimedScratch.add('art');
    this.room?.update(
      { claimed: this.claimedScratch, focusId: activeId === 'exit' ? null : activeId },
      tick,
      this.motion
    );
  }
}
