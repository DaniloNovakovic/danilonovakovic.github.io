/**
 * OverworldScene — thin orchestrator.
 * Delegates environment/buildings/particles to street view modules,
 * and player logic to PlayerController.
 */
import * as Phaser from 'phaser';
import { TextureGenerator } from '@/game/sharedSceneRuntime/textures/TextureGenerator';
import {
  BASEMENT_SCENE_ID,
  HOBBIES_SCENE_ID,
  OVERWORLD_SCENE_ID,
  type SceneId
} from '@/game/scenes/sceneIds';
import type { OverlayId } from '@/game/overlays/overlayIds';
import {
  BANANA_PEEL_CLUE_ID,
  OVERWORLD_BASEMENT_HOLE,
  OVERWORLD_BILLBOARD_X,
  OVERWORLD_BUILDING_TRIGGERS,
  OVERWORLD_CHICK,
  OVERWORLD_CIRCUIT_SLOT,
  OVERWORLD_GLASSES_SECRET_SLOTS,
  OVERWORLD_INTERACT_PROMPT_OFFSET_Y,
  OVERWORLD_PLAYER_RESUME_Y_CLAMP,
  OVERWORLD_PLAYER_SPAWN_MARGIN_X,
  OVERWORLD_PLAYER_START,
  OVERWORLD_SIGNPOST_X,
  OVERWORLD_WIDTH
} from '../worldLayout';
import { getMessages } from '@/shared/i18n';
import {
  GAME_DESIGN_HEIGHT,
  SIDE_VIEW_JUMP_VELOCITY_Y,
  SIDE_VIEW_PLAYER_GRAVITY_Y,
  SIDE_VIEW_SPRINT_SPEED,
  SIDE_VIEW_WALK_SPEED
} from '@/game/sharedSceneRuntime/config';
import {
  bridgeActions,
  bridgeStore,
  isItemEquipped,
  isItemOwned,
  isSecretDiscovered,
  type OpenOverlayOptions
} from '@/game/bridge/store';
import {
  GameConsoleSession,
  getOverworldProgress,
  getSketchDetailLevel,
  type GameCommandResult,
  type NearbyThing
} from '@/game/core/console';
import { loadRidgeRouteDialogueCatalog } from '@/game/scenes/ridge/content/routeCatalog';
import { applyGameConsoleEvents } from '@/game/scenes/shared/applyGameConsoleEvents';
import {
  buildStreetEnvironment,
  buildStreetForeground,
  setupStreetCamera
} from './street/StreetEnvironment';
import { buildStreetBuildings, type StreetBuildingLayers } from './street/StreetBuildings';
import { updateStreetParticles } from './street/StreetParticles';
import { StreetBirds, StreetFootsteps } from './street/StreetLife';
import { StreetCrt } from './street/StreetCrt';
import { StreetSignpost } from './street/StreetSignpost';
import { StreetHatch } from './street/StreetHatch';
import { StreetDetail } from './street/StreetDetail';
import { StreetBillboard } from './street/StreetBillboard';
import { StreetChick } from './street/StreetChick';
import { prefersReducedMotion, sketchTick } from '@/game/sharedSceneRuntime/motion/sketchMotion';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import type { OverworldBuildingSlot } from '@/game/core/ecs/systems/overworldInteractSystems';
import { DistanceHazeVision } from '@/game/sharedSceneRuntime/vision/DistanceHazeVision';
import {
  createSideViewPlayerRuntime,
  type SideViewPlayerRuntime
} from '@/game/sharedSceneRuntime/player/SideViewPlayerRuntime';
import type { SideViewCameraRuntime } from '@/game/sharedSceneRuntime/camera/sideViewCameraRuntime';
import type { SceneUiActionRequest } from '@/game/sceneUi/types';
import {
  CHICK_CHASE_CHOICE,
  CRT_SEAT_CHOICE,
  StreetConversation,
  chickConversation,
  crtConversation,
  litterConversation,
  signpostConversation,
  type StreetConversationOutcome,
  type StreetConversationScript
} from './streetConversation';

/** Street ground line; talks frame the speakers' feet. */
const STREET_GROUND_Y = 550;
/**
 * Talk framing, matching Ridge: ease in, and seat the ground line high enough
 * that the docked box along the bottom leaves both speakers in view.
 */
const TALK_ZOOM = 1.3;
const TALK_GROUND_AT = 0.6;
const TALK_EASE_MS = 320;

interface StreetTalk {
  conversation: StreetConversation;
  onEnd: (outcome: StreetConversationOutcome) => void;
}

export class OverworldScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  streetBuildings!: StreetBuildingLayers;
  interactPrompt!: Phaser.GameObjects.Text;

  private playerRuntime?: SideViewPlayerRuntime;
  private onEnterScene?: (sceneId: SceneId) => void;
  private onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  private isPaused: boolean = false;
  private resumePosition?: { x: number; y: number };
  private readonly buildingSlots: OverworldBuildingSlot[] = [];
  private lensRevealScratch: boolean[] = [];
  private preGlassesVision?: DistanceHazeVision;
  private bananaFloorIcon?: Phaser.GameObjects.Graphics;
  private circuitCrt?: StreetCrt;
  private signpost?: StreetSignpost;
  private hatch?: StreetHatch;
  private streetDetail?: StreetDetail;
  private droppingIntoHatch = false;
  /** Where the player stood before the hatch tween, so the return isn't inside the ground. */
  private preDropPosition?: { x: number; y: number };
  private birds?: StreetBirds;
  private chick?: StreetChick;
  private footsteps?: StreetFootsteps;
  private motion = true;
  private glassesSecretHint?: Phaser.GameObjects.Text;
  private session?: GameConsoleSession;
  private camera?: SideViewCameraRuntime;
  /** The open street conversation; the player stands still while it runs. */
  private talk?: StreetTalk;

  constructor() {
    super({ key: 'MainScene' });
  }

  init(data: {
    onEnterScene: (sceneId: SceneId) => void;
    onOpenOverlay: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
    isPaused: boolean;
    resumePosition?: { x: number; y: number };
  }) {
    this.onEnterScene = data.onEnterScene;
    this.onOpenOverlay = data.onOpenOverlay;
    this.isPaused = data.isPaused;
    this.resumePosition = data.resumePosition;
    this.talk = undefined;
    this.resetBananaPeelFlow();
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    if (this.droppingIntoHatch && this.preDropPosition) return this.preDropPosition;
    return this.playerRuntime?.captureResume() ?? null;
  }

  shutdown(): void {
    this.closeTalkPanel();
    this.resetBananaPeelFlow();
  }

  setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused && !this.talk) {
      this.resetBananaPeelFlow();
    }
    this.syncPlayerPause();
  }

  /** Menus and talks both hold the player; either one keeps them still. */
  private syncPlayerPause(): void {
    this.playerRuntime?.setPaused(this.isPaused || this.talk !== undefined);
  }

  preload() {
    TextureGenerator.generatePlayer(this);
    OVERWORLD_BUILDING_TRIGGERS.forEach((trigger) => {
      TextureGenerator.generateBuilding(this, trigger.id);
    });
  }

  create() {
    const messages = getMessages();
    const bridge = bridgeStore.getState();
    this.session = new GameConsoleSession({
      dialogue: loadRidgeRouteDialogueCatalog(),
      sceneId: 'overworld',
      ownedItemIds: bridge.inventory.ownedItemIds,
      equippedItemIds: bridge.equipment.equippedItemIds,
      discoveredSecretIds: bridge.progress.discoveredSecretIds
    });

    this.physics.world.setBounds(0, 0, OVERWORLD_WIDTH, GAME_DESIGN_HEIGHT);

    this.motion = !prefersReducedMotion();
    const { groundZone } = buildStreetEnvironment(this);
    this.streetDetail = new StreetDetail(this);
    new StreetBillboard(this, OVERWORLD_BILLBOARD_X, bridge.progress.streetDoodle);
    this.streetBuildings = buildStreetBuildings(this);
    this.signpost = new StreetSignpost(this, OVERWORLD_SIGNPOST_X);
    this.droppingIntoHatch = false;
    this.hatch = new StreetHatch(this, OVERWORLD_BASEMENT_HOLE.x, OVERWORLD_BASEMENT_HOLE.y);
    this.buildingSlots.length = 0;
    for (const bldg of this.streetBuildings.interactables.getChildren() as Phaser.GameObjects.Sprite[]) {
      this.buildingSlots.push({
        buildingId: bldg.getData('name') as string,
        x: bldg.x,
        y: bldg.y
      });
    }
    this.lensRevealScratch = this.streetBuildings.faces.map(() => false);

    this.playerRuntime = createSideViewPlayerRuntime({
      scene: this,
      start: OVERWORLD_PLAYER_START,
      resumePosition: this.resumePosition,
      resumeClamp: {
        minX: OVERWORLD_PLAYER_SPAWN_MARGIN_X,
        maxX: OVERWORLD_WIDTH - OVERWORLD_PLAYER_SPAWN_MARGIN_X,
        minY: OVERWORLD_PLAYER_RESUME_Y_CLAMP.min,
        maxY: OVERWORLD_PLAYER_RESUME_Y_CLAMP.max
      },
      sprite: {
        depth: 25,
        gravityY: SIDE_VIEW_PLAYER_GRAVITY_Y
      },
      movement: {
        walkSpeed: SIDE_VIEW_WALK_SPEED,
        sprintSpeed: SIDE_VIEW_SPRINT_SPEED,
        jumpVelocityY: SIDE_VIEW_JUMP_VELOCITY_Y
      },
      input: {
        allowJump: true,
        allowSprint: true
      },
      appearance: {
        isGlassesEquipped: () => isItemEquipped('glasses'),
        idleTextureKey: 'player_idle',
        glassesTextureKey: 'player_glasses'
      }
    });
    this.player = this.playerRuntime.player;
    this.physics.add.collider(this.player, groundZone);

    buildStreetForeground(this);
    this.camera = setupStreetCamera(this, this.player);

    // --- UI ---
    this.interactPrompt = createUiText(this, 0, 0, messages.navigation.enter, {
      fontSize: '18px',
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setVisible(false).setDepth(20);
    this.bananaFloorIcon = this.add.graphics().setDepth(21).setVisible(false);
    this.drawBananaFloorIcon();
    this.circuitCrt = new StreetCrt(this, OVERWORLD_CIRCUIT_SLOT.x, OVERWORLD_CIRCUIT_SLOT.y, 18);
    this.circuitCrt.update(isItemOwned('circuit'), 0, this.motion);
    this.birds = new StreetBirds(this);
    this.chick = new StreetChick(this, OVERWORLD_CHICK.x);
    this.footsteps = new StreetFootsteps(this);

    this.preGlassesVision = new DistanceHazeVision(this, {
      depth: 15,
      color: 0xfbfbf9,
      tileSize: 30,
      clearRadius: 120,
      maxRadius: 560,
      minAlpha: 0.24,
      maxAlpha: 0.88
    });
    this.createGlassesSecret();
    this.setPaused(this.isPaused);
    this.playerRuntime.syncAppearance();
    this.updateLensReveal();
  }

  update(time: number, delta: number) {
    if (this.droppingIntoHatch) return;
    const playerUpdate = this.playerRuntime?.update();
    this.updateLensReveal();

    if (this.talk) {
      if (!this.isPaused) this.updateTalk(time, delta);
      return;
    }
    if (!playerUpdate || playerUpdate.paused) {
      return;
    }

    const { commands, step } = playerUpdate;
    if (commands.exitContext) {
      this.onEnterScene?.(HOBBIES_SCENE_ID);
      return;
    }

    const tick = sketchTick(time);
    this.updateStreetProps(time, delta, tick);
    updateStreetParticles(this);

    const nearby = this.updateOverworldInteraction(step.interactRequested);
    this.streetBuildings.applyFocus(
      nearby?.kind === 'building' ? nearby.id : null,
      tick,
      this.motion
    );
    this.updateProgressProps(tick, nearby?.kind === 'prop');
  }

  private updateStreetProps(time: number, delta: number, tick: number): void {
    const hasCircuit = isItemOwned('circuit');
    const sprinting = Math.abs(this.player.body.velocity.x) > SIDE_VIEW_WALK_SPEED + 1;
    const glassesOn = isItemEquipped('glasses');
    this.setBananaFloorVisible(glassesOn);
    this.chick?.update(time, delta, this.player.x, glassesOn, this.motion);
    this.circuitCrt?.update(hasCircuit, tick, this.motion);
    this.hatch?.update({ hasGlasses: isItemOwned('glasses'), hasCircuit }, this.player.x, tick, this.motion);
    this.birds?.update(time, delta, this.player.x, sprinting, this.motion);
    this.footsteps?.update(this.player, time, sprinting, this.motion);
  }

  private updateProgressProps(tick: number, nearProp: boolean): void {
    if (!this.session) return;
    const state = this.session.getState();
    const { stage } = getOverworldProgress(state);
    this.signpost?.update(stage, tick, nearProp, this.motion);
    this.streetDetail?.update(getSketchDetailLevel(state), tick, this.motion);
  }


  private updateOverworldInteraction(interactRequested: boolean): NearbyThing | undefined {
    if (!this.session) return undefined;

    const bridge = bridgeStore.getState();
    this.session.syncInventory(bridge.inventory.ownedItemIds, bridge.equipment.equippedItemIds);
    const sync = this.session.syncPlayerPosition(this.player.x, this.player.y);
    this.applySessionResult(sync);

    if (interactRequested && !this.startTalkFor(this.session.observe().nearby[0])) {
      this.applySessionResult(this.session.exec('interact'));
    }
    if (this.talk) {
      this.interactPrompt.setVisible(false);
      return undefined;
    }

    const nearby = this.session.observe().nearby[0];
    this.applyOverworldNearbyPrompt(nearby);
    return nearby;
  }

  /**
   * Some street interactions talk first and only act on the player's answer.
   * The console still owns the act itself: a yes runs the same `interact`.
   */
  private startTalkFor(nearby: NearbyThing | undefined): boolean {
    if (nearby?.kind === 'npc' && this.chick) {
      this.openTalk(chickConversation(isItemOwned('glasses')), this.chick.x, (outcome) => {
        if (outcome === CHICK_CHASE_CHOICE) this.interactAfterTalk();
      });
      return true;
    }
    if (nearby?.kind === 'crt' && isItemOwned('circuit')) {
      this.openTalk(crtConversation(), OVERWORLD_CIRCUIT_SLOT.x, (outcome) => {
        if (outcome === CRT_SEAT_CHOICE) this.interactAfterTalk();
      });
      return true;
    }
    return false;
  }

  private interactAfterTalk(): void {
    if (this.session) this.applySessionResult(this.session.exec('interact'));
  }

  private openTalk(
    script: StreetConversationScript,
    partnerX: number,
    onEnd: StreetTalk['onEnd']
  ): void {
    this.talk = { conversation: new StreetConversation(script, partnerX), onEnd };
    this.interactPrompt.setVisible(false);
    this.chick?.hush();
    // Face whoever you are talking to.
    if (Math.abs(partnerX - this.player.x) > 4) this.player.setFlipX(partnerX < this.player.x);
    this.syncPlayerPause();
    this.camera?.focus({
      x: (this.player.x + partnerX) / 2,
      y: STREET_GROUND_Y,
      zoom: TALK_ZOOM,
      screenY: TALK_GROUND_AT,
      durationMs: this.motion ? TALK_EASE_MS : 0
    });
    this.publishTalk();
  }

  private updateTalk(time: number, delta: number): void {
    this.updateStreetProps(time, delta, sketchTick(time));
    this.chick?.hush();
    for (let action = bridgeActions.consumeSceneUiAction(OVERWORLD_SCENE_ID); action && this.talk; ) {
      this.handleTalkAction(action);
      action = bridgeActions.consumeSceneUiAction(OVERWORLD_SCENE_ID);
    }
    // Taps and E presses made while talking must not fire once the box closes.
    bridgeActions.consumeTouchOneShots();
  }

  private handleTalkAction(action: SceneUiActionRequest): void {
    const conversation = this.talk?.conversation;
    if (!conversation) return;
    let outcome: StreetConversationOutcome | null = null;
    if (action.action === 'ridgeConversationAdvance') outcome = conversation.advance();
    else if (action.action === 'ridgeConversationLeave') outcome = 'left';
    else if (action.action === 'ridgeConversationChoose') outcome = conversation.choose(readChoiceId(action.params));
    if (outcome) this.endTalk(outcome);
    else this.publishTalk();
  }

  private endTalk(outcome: StreetConversationOutcome): void {
    const talk = this.talk;
    if (!talk) return;
    this.talk = undefined;
    this.closeTalkPanel();
    this.camera?.focus(null);
    this.syncPlayerPause();
    talk.onEnd(outcome);
  }

  /** Street talks borrow Ridge's docked conversation box. */
  private publishTalk(): void {
    if (!this.talk) return;
    bridgeActions.setSceneUiPanel(
      OVERWORLD_SCENE_ID,
      'ridgeConversation',
      this.talk.conversation.view(this.player.x)
    );
  }

  private closeTalkPanel(): void {
    if (bridgeStore.getState().sceneUi.panel?.ownerSceneId === OVERWORLD_SCENE_ID) {
      bridgeActions.clearSceneUiPanel(OVERWORLD_SCENE_ID);
    }
  }

  private applySessionResult(result: GameCommandResult): void {
    if (!this.session) return;
    applyGameConsoleEvents(result.events, {
      onEnterScene: (sceneId) => this.enterSceneFromStreet(sceneId),
      onOpenOverlay: (overlayId) => {
        this.onOpenOverlay?.(overlayId);
        this.session?.restoreExploreAfterOverlay();
      },
      onBananaPeelDiscovered: () => this.startBananaPeelDiscovery(),
      onBananaPeelCancelled: () => this.resetBananaPeelFlow(),
      onSignpostRead: ({ stage, found, total }) => {
        this.signpost?.markRead(stage);
        this.openTalk(signpostConversation(stage, found, total), OVERWORLD_SIGNPOST_X, () => {});
      }
    });
  }

  private applyOverworldNearbyPrompt(nearby: NearbyThing | undefined): void {
    if (!nearby || this.session?.getState().overworld.bananaFirstPeelPending) {
      this.interactPrompt.setVisible(false);
      return;
    }

    const text = this.localizedPromptForNearby(nearby);
    const building = this.buildingSlots.find((slot) => slot.buildingId === nearby.id);
    const promptX =
      nearby.promptX ??
      (building?.x ?? (nearby.id === 'banana-peel' ? OVERWORLD_GLASSES_SECRET_SLOTS[0].x : this.player.x));
    const promptY = building
      ? building.y + OVERWORLD_INTERACT_PROMPT_OFFSET_Y
      : (nearby.promptY ?? this.player.y - 40);

    this.interactPrompt.setText(text).setPosition(promptX, promptY).setVisible(true);
  }

  private localizedPromptForNearby(nearby: NearbyThing): string {
    const nav = getMessages().navigation;
    const overworld = getMessages().scenes.overworld;
    switch (nearby.kind) {
      case 'hatch':
        return nav.interact;
      case 'prop':
        return overworld.signpostPrompt;
      case 'secret':
        return isSecretDiscovered(BANANA_PEEL_CLUE_ID)
          ? overworld.bananaDiscoveredPrompt
          : overworld.bananaUndiscoveredPrompt;
      case 'npc':
        return overworld.chickPrompt;
      case 'crt':
        return isItemOwned('circuit')
          ? overworld.circuitCrtReadyPrompt
          : overworld.circuitCrtLockedPrompt;
      default:
        return nav.enter;
    }
  }

  /**
   * Glasses secret: a little litter pile (crumpled paper + a tipped soda can)
   * with raccoon paw prints trotting off toward the dumpster. Ids still say
   * banana for save compatibility.
   */
  private drawBananaFloorIcon(): void {
    if (!this.bananaFloorIcon) return;
    const g = this.bananaFloorIcon;
    g.clear();
    const ink = 0x1a1a1a;
    const paper = 0xfbfbf9;

    // Crumpled paper ball.
    g.fillStyle(paper, 1);
    g.lineStyle(3, ink, 0.95);
    g.beginPath();
    const ball = [[-24, 10], [-19, 2], [-11, 1], [-5, 7], [-6, 16], [-13, 21], [-22, 19]];
    ball.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.lineStyle(2, ink, 0.7);
    g.beginPath();
    g.moveTo(-19, 6); g.lineTo(-14, 11); g.lineTo(-17, 16);
    g.moveTo(-14, 11); g.lineTo(-8, 10);
    g.strokePath();

    // Soda can tipped on its side.
    g.fillStyle(paper, 1);
    g.lineStyle(3, ink, 0.95);
    g.fillRoundedRect(-3, 10, 22, 11, 3);
    g.strokeRoundedRect(-3, 10, 22, 11, 3);
    g.strokeEllipse(19, 15.5, 4, 11);
    g.lineStyle(2, ink, 0.7);
    g.beginPath();
    g.moveTo(4, 13); g.lineTo(12, 13);
    g.strokePath();

    // Raccoon paw prints trotting away.
    g.fillStyle(ink, 0.85);
    [[30, 18], [40, 12], [50, 18]].forEach(([x, y]) => {
      g.fillEllipse(x, y, 6, 5);
      g.fillCircle(x - 3.5, y - 4, 1.3);
      g.fillCircle(x, y - 5, 1.3);
      g.fillCircle(x + 3.5, y - 4, 1.3);
    });
  }

  private setBananaFloorVisible(visible: boolean): void {
    if (!this.bananaFloorIcon) return;
    if (!visible) {
      this.bananaFloorIcon.setVisible(false);
      return;
    }
    this.bananaFloorIcon
      .setPosition(
        OVERWORLD_GLASSES_SECRET_SLOTS[0].x - 12,
        OVERWORLD_GLASSES_SECRET_SLOTS[0].y - 12
      )
      .setRotation(0)
      .setVisible(true);
  }

  private updateLensReveal(): void {
    if (!this.streetBuildings?.faces.length) return;
    const hasGlasses = isItemEquipped('glasses');
    for (let i = 0; i < this.lensRevealScratch.length; i++) {
      // Keep monochrome sketch style for now.
      this.lensRevealScratch[i] = false;
    }
    this.streetBuildings.applyLensProximityReveal(this.lensRevealScratch);
    this.updateLensFog(hasGlasses);
    this.updateGlassesSecrets(hasGlasses);
  }

  private updateLensFog(hasGlasses: boolean): void {
    if (!this.preGlassesVision) return;
    const centerScreenX = this.player.x - this.cameras.main.scrollX;
    const centerScreenY = this.player.y - this.cameras.main.scrollY - 45;
    this.preGlassesVision.render(!hasGlasses, centerScreenX, centerScreenY);
  }

  private createGlassesSecret(): void {
    const messages = getMessages();
    const bananaSecret = OVERWORLD_GLASSES_SECRET_SLOTS[0];
    this.glassesSecretHint = createUiText(
      this,
      bananaSecret.x,
      bananaSecret.y + 23,
      messages.scenes.overworld.glassesSecretHint,
      {
        fontSize: '12px',
        color: '#1a1a1a',
        backgroundColor: '#fbfbf9',
        padding: { x: 4, y: 2 }
      }
    )
      .setOrigin(0.5)
      .setDepth(18)
      .setVisible(false);
  }

  private updateGlassesSecrets(hasGlasses: boolean): void {
    const discovered = isSecretDiscovered(BANANA_PEEL_CLUE_ID);
    this.glassesSecretHint?.setVisible(hasGlasses && !discovered);
    if (!hasGlasses) {
      this.resetBananaPeelFlow();
    }
  }

  /** Clears the first-peel beat (safe on every overworld init / shutdown). */
  private resetBananaPeelFlow(): void {
    if (this.session) {
      this.session.getState().overworld.bananaFirstPeelPending = false;
    }
  }

  /**
   * First find of the litter pile: a short talk, and reading it through slips
   * you into the dumpster. Stepping back leaves the pile for later.
   */
  private startBananaPeelDiscovery(): void {
    this.openTalk(litterConversation(), OVERWORLD_GLASSES_SECRET_SLOTS[0].x, (outcome) => {
      if (outcome === 'finished' && this.session) {
        this.applySessionResult(this.session.commitBananaPeelWarp());
      } else {
        this.resetBananaPeelFlow();
      }
    });
  }

  private enterSceneFromStreet(sceneId: SceneId): void {
    if (sceneId !== BASEMENT_SCENE_ID || !this.hatch || this.droppingIntoHatch) {
      this.onEnterScene?.(sceneId);
      return;
    }
    this.preDropPosition = { x: this.player.x, y: this.player.y };
    this.droppingIntoHatch = true;
    this.interactPrompt.setVisible(false);
    this.hatch.dropIn(this.player, this.motion, () => this.onEnterScene?.(sceneId));
  }
}

function readChoiceId(params: unknown): string {
  if (!params || typeof params !== 'object') return '';
  const choiceId = (params as { choiceId?: unknown }).choiceId;
  return typeof choiceId === 'string' ? choiceId : '';
}
