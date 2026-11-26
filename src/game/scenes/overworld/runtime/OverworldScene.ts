// Thin adapter update loop; branching mirrors input, talks and console event application.
// fallow-ignore-file complexity
/**
 * OverworldScene — thin orchestrator.
 * Delegates environment/buildings/particles to street view modules,
 * and player logic to PlayerController.
 */
import * as Phaser from 'phaser';
import { TextureGenerator } from '@/game/sharedSceneRuntime/textures/TextureGenerator';
import { BASEMENT_SCENE_ID, HOBBIES_SCENE_ID, OVERWORLD_SCENE_ID, type SceneId } from '@/game/scenes/sceneIds';
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
  EVIL_CHICK_LINES,
  GameConsoleSession,
  getOverworldProgress,
  getSketchDetailLevel,
  isStreetInAlarm,
  OUT_OF_BOUNDS_STREET_TEXT,
  STREET_ALARM_THOUGHT,
  STREET_FIGHT_CLEARED_THOUGHT,
  STREET_FIGHT_HURT_THOUGHTS,
  STREET_LOCKDOWN_THOUGHT,
  streetFightProgress,
  type GameCommandResult,
  type NearbyThing,
  type StreetFightProgress
} from '@/game/core/console';
import { loadRidgeRouteDialogueCatalog } from '@/game/scenes/ridge/content/routeCatalog';
import { applyGameConsoleEvents } from '@/game/scenes/shared/applyGameConsoleEvents';
import { buildStreetEnvironment, buildStreetForeground, setupStreetCamera } from './street/StreetEnvironment';
import { buildStreetBuildings, type StreetBuildingLayers } from './street/StreetBuildings';
import { updateStreetParticles } from './street/StreetParticles';
import { StreetBirds, StreetFootsteps } from './street/StreetLife';
import { StreetCrt } from './street/StreetCrt';
import { StreetSignpost } from './street/StreetSignpost';
import { StreetHatch } from './street/StreetHatch';
import { StreetDetail } from './street/StreetDetail';
import { StreetBillboard } from './street/StreetBillboard';
import { StreetChick } from './street/StreetChick';
import { StreetAlarm } from './street/StreetAlarm';
import { StreetFight, type StreetFightHit } from './street/StreetFight';
import { PlayerThoughtText } from '@/game/sharedSceneRuntime/text/PlayerThoughtText';
import { prefersReducedMotion, sketchTick } from '@/game/sharedSceneRuntime/motion/sketchMotion';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import type { OverworldBuildingSlot } from '@/game/core/ecs/systems/overworldInteractSystems';
import { DistanceHazeVision, NEARSIGHTED_HAZE } from '@/game/sharedSceneRuntime/vision/DistanceHazeVision';
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
  onEnd?: (outcome: StreetConversationOutcome) => void;
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
  /** Out of Bounds escape: the street is a manhunt at night, and the fight is on. */
  private alarm?: StreetAlarm;
  private fight?: StreetFight;
  private swingKey?: Phaser.Input.Keyboard.Key;
  private parryKey?: Phaser.Input.Keyboard.Key;
  private thought?: PlayerThoughtText;
  private confrontPending = false;

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
      discoveredSecretIds: bridge.progress.discoveredSecretIds,
      screenSmashes: bridge.screenDamage.cracks.length
    });
    const inAlarm = isStreetInAlarm({
      ownedItemIds: bridge.inventory.ownedItemIds
    });
    this.alarm = undefined;
    this.fight = undefined;
    this.confrontPending = false;

    this.physics.world.setBounds(0, 0, OVERWORLD_WIDTH, GAME_DESIGN_HEIGHT);

    this.motion = !prefersReducedMotion();
    const { groundZone } = buildStreetEnvironment(this);
    this.streetDetail = new StreetDetail(this);
    new StreetBillboard(this, OVERWORLD_BILLBOARD_X, bridge.progress.streetDoodle);
    this.streetBuildings = buildStreetBuildings(this);
    this.signpost = new StreetSignpost(this, OVERWORLD_SIGNPOST_X);
    this.droppingIntoHatch = false;
    this.hatch = new StreetHatch(this, OVERWORLD_BASEMENT_HOLE.x, STREET_GROUND_Y);
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
    })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(20);
    this.bananaFloorIcon = this.add.graphics().setDepth(21).setVisible(false);
    this.drawBananaFloorIcon();
    this.circuitCrt = new StreetCrt(this, OVERWORLD_CIRCUIT_SLOT.x, STREET_GROUND_Y, 18);
    this.circuitCrt.update(isItemOwned('circuit'), 0, this.motion);
    this.birds = new StreetBirds(this);
    // During the alarm the chick is the evil one, out in the fight instead.
    this.chick = inAlarm ? undefined : new StreetChick(this, OVERWORLD_CHICK.x);
    this.footsteps = new StreetFootsteps(this);
    this.thought = new PlayerThoughtText(this, { target: this.player });

    this.preGlassesVision = new DistanceHazeVision(this, NEARSIGHTED_HAZE);
    this.createGlassesSecret();
    this.setPaused(this.isPaused);
    this.playerRuntime.syncAppearance();
    this.updateLensReveal();
    if (inAlarm) this.startAlarm();
  }

  /** Up through the hatch while the simulation is broken: night, searchlights, and the evil chick. */
  private startAlarm(): void {
    const progress = this.fightProgress();
    this.alarm = new StreetAlarm(this, this.player.x);
    const fight = new StreetFight({
      scene: this,
      player: this.player,
      progress,
      motion: this.motion,
      getAudioContext: () => (this.sound as Partial<Phaser.Sound.WebAudioSoundManager>).context ?? null,
      holdPlayer: (held) => this.holdPlayerForFight(held),
      onSmash: (hit) => this.landSmash(hit),
      onHurt: (kind) => {
        this.thought?.show(STREET_FIGHT_HURT_THOUGHTS[kind]);
        if (this.motion) this.cameras.main.shake(110, 0.004);
      }
    });
    this.fight = fight;
    this.swingKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.parryKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    if (progress.phase !== 'chick') {
      this.publishFightPanel(progress);
      this.thought?.show(progress.phase === 'cleared' ? STREET_FIGHT_CLEARED_THOUGHT : STREET_ALARM_THOUGHT);
      return;
    }
    this.confrontPending = true;
  }

  /** `H`/`Esc` on the street goes back to Hobbies, except in alarm, when it's taped shut too. */
  private leaveStreet(): boolean {
    if (this.alarm) {
      this.thought?.show(STREET_LOCKDOWN_THOUGHT);
      return false;
    }
    this.onEnterScene?.(HOBBIES_SCENE_ID);
    return true;
  }

  /** The evil chick speaks up once Danilo has both feet on the street. */
  private maybeStartConfrontation(): void {
    const fight = this.fight;
    if (!this.confrontPending || !fight || !this.player.body.blocked.down) return;
    this.confrontPending = false;
    this.openTalk(evilChickConversation(), fight.evilChickX, () => {
      fight.startChickAttack();
      this.publishFightPanel(this.fightProgress());
    });
  }

  /** A stun takes Danilo's legs for a moment; menus and talks still hold him as usual. */
  private holdPlayerForFight(held: boolean): void {
    const controller = this.playerRuntime?.controller;
    if (!controller) return;
    if (held) controller.pause();
    else if (!this.isPaused && !this.talk) controller.resume();
  }

  private fightProgress(): StreetFightProgress {
    return streetFightProgress(this.session?.getState().screenSmashes ?? 0);
  }

  private publishFightPanel(progress: StreetFightProgress): void {
    if (this.talk) return;
    bridgeActions.setSceneUiPanel(OVERWORLD_SCENE_ID, 'streetFight', progress);
  }

  /** F / R or the touch buttons: swing the hammer, or parry. */
  private updateFightInput(): void {
    const fight = this.fight;
    if (!fight) return;
    let swung = this.swingKey ? Phaser.Input.Keyboard.JustDown(this.swingKey) : false;
    let parried = this.parryKey ? Phaser.Input.Keyboard.JustDown(this.parryKey) : false;
    for (let action = bridgeActions.consumeSceneUiAction(OVERWORLD_SCENE_ID); action;) {
      if (action.action === 'streetFightSwing') swung = true;
      if (action.action === 'streetFightParry') parried = true;
      action = bridgeActions.consumeSceneUiAction(OVERWORLD_SCENE_ID);
    }
    if (parried) fight.parry();
    if (swung) fight.swing();
  }

  /** A hammer hit or a parried egg knocked something out: tell the console; a chick or raccoon cracks the screen. */
  private landSmash(hit: StreetFightHit): void {
    if (!this.session) return;
    const result = this.session.exec(hit.target === 'chick' ? 'swing' : `swing ${hit.target}`);
    for (const event of result.events) {
      if (event.type === 'screen_smashed') {
        const seed = event.smashes * 7919 + Math.floor(Math.random() * 1e6);
        // The screen breaks at a corner: every other one on the side of the hit, the rest
        // across from it, so a horde's worth of cracks spreads over all four (top or bottom at random).
        const hitX = this.toViewportFraction(hit).x;
        bridgeActions.crackScreen({ x: event.smashes % 2 === 0 ? hitX : 1 - hitX, y: Math.random(), seed });
      }
      if (event.type === 'street_fight_cleared') this.thought?.show(STREET_FIGHT_CLEARED_THOUGHT);
    }
    if (this.motion) this.cameras.main.shake(140, 0.006);
    const progress = this.fightProgress();
    this.fight?.setProgress(progress);
    this.publishFightPanel(progress);
  }

  /** Where a world point sits on the browser viewport, as fractions: the crack starts there. */
  private toViewportFraction(point: { x: number; y: number }): {
    x: number;
    y: number;
  } {
    const camera = this.cameras.main;
    const view = camera.worldView;
    const canvas = this.game.canvas.getBoundingClientRect();
    const inCanvasX = (camera.x + ((point.x - view.x) / view.width) * camera.width) / this.scale.width;
    const inCanvasY = (camera.y + ((point.y - view.y) / view.height) * camera.height) / this.scale.height;
    return {
      x: Phaser.Math.Clamp((canvas.left + inCanvasX * canvas.width) / window.innerWidth, 0, 1),
      y: Phaser.Math.Clamp((canvas.top + inCanvasY * canvas.height) / window.innerHeight, 0, 1)
    };
  }

  update(time: number, delta: number) {
    if (this.droppingIntoHatch) return;
    const playerUpdate = this.playerRuntime?.update();
    this.updateLensReveal();
    this.thought?.update();

    if (this.talk) {
      if (!this.isPaused) this.updateTalk(time, delta);
      return;
    }
    if (!playerUpdate || playerUpdate.paused) {
      return;
    }

    const { commands, step } = playerUpdate;
    if (commands.exitContext && this.leaveStreet()) return;
    this.maybeStartConfrontation();
    this.updateFightInput();

    const tick = sketchTick(time);
    this.updateStreetProps(time, delta, tick);
    updateStreetParticles(this);

    const nearby = this.updateOverworldInteraction(step.interactRequested);
    this.streetBuildings.applyFocus(nearby?.kind === 'building' ? nearby.id : null, tick, this.motion);
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
    this.alarm?.update(time, delta, this.player.x, this.motion);
    this.fight?.update(time, delta);
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

    if (interactRequested && !this.startTalkFor(this.session.observe().nearby[0])) this.interactOnStreet();
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
      // Still away after a scare: the talk would frame an empty patch of street.
      if (!this.chick.isHome) return true;
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

  /** The console decides; in alarm a taped-shut door just gets a thought. */
  private interactOnStreet(): void {
    if (!this.session) return;
    const result = this.session.exec('interact');
    if (result.message === OUT_OF_BOUNDS_STREET_TEXT.lockdown) this.thought?.show(STREET_LOCKDOWN_THOUGHT);
    this.applySessionResult(result);
  }

  private interactAfterTalk(): void {
    if (this.session) this.applySessionResult(this.session.exec('interact'));
  }

  private openTalk(script: StreetConversationScript, partnerX: number, onEnd?: StreetTalk['onEnd']): void {
    this.talk = {
      conversation: new StreetConversation(script, partnerX),
      onEnd
    };
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
    for (let action = bridgeActions.consumeSceneUiAction(OVERWORLD_SCENE_ID); action && this.talk;) {
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
    talk.onEnd?.(outcome);
  }

  /** Street talks borrow Ridge's docked conversation box. */
  private publishTalk(): void {
    if (!this.talk) return;
    bridgeActions.setSceneUiPanel(
      OVERWORLD_SCENE_ID,
      'ridgeConversation',
      this.talk.conversation.view(this.player.x, isItemEquipped('glasses'))
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
        this.openTalk(signpostConversation(stage, found, total), OVERWORLD_SIGNPOST_X);
      }
    });
  }

  private applyOverworldNearbyPrompt(nearby: NearbyThing | undefined): void {
    const chickAway = nearby?.kind === 'npc' && this.chick?.isHome === false;
    if (!nearby || chickAway || this.session?.getState().overworld.bananaFirstPeelPending) {
      this.interactPrompt.setVisible(false);
      return;
    }

    const text = this.localizedPromptForNearby(nearby);
    const building = this.buildingSlots.find((slot) => slot.buildingId === nearby.id);
    const promptX =
      nearby.promptX ??
      building?.x ??
      (nearby.id === 'banana-peel' ? OVERWORLD_GLASSES_SECRET_SLOTS[0].x : this.player.x);
    const promptY = building ? building.y + OVERWORLD_INTERACT_PROMPT_OFFSET_Y : (nearby.promptY ?? this.player.y - 40);

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
        return isItemOwned('circuit') ? overworld.circuitCrtReadyPrompt : overworld.circuitCrtLockedPrompt;
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
    const ball = [
      [-24, 10],
      [-19, 2],
      [-11, 1],
      [-5, 7],
      [-6, 16],
      [-13, 21],
      [-22, 19]
    ];
    ball.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.lineStyle(2, ink, 0.7);
    g.beginPath();
    g.moveTo(-19, 6);
    g.lineTo(-14, 11);
    g.lineTo(-17, 16);
    g.moveTo(-14, 11);
    g.lineTo(-8, 10);
    g.strokePath();

    // Soda can tipped on its side.
    g.fillStyle(paper, 1);
    g.lineStyle(3, ink, 0.95);
    g.fillRoundedRect(-3, 10, 22, 11, 3);
    g.strokeRoundedRect(-3, 10, 22, 11, 3);
    g.strokeEllipse(19, 15.5, 4, 11);
    g.lineStyle(2, ink, 0.7);
    g.beginPath();
    g.moveTo(4, 13);
    g.lineTo(12, 13);
    g.strokePath();

    // Raccoon paw prints trotting away.
    g.fillStyle(ink, 0.85);
    [
      [30, 18],
      [40, 12],
      [50, 18]
    ].forEach(([x, y]) => {
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
      .setPosition(OVERWORLD_GLASSES_SECRET_SLOTS[0].x - 12, OVERWORLD_GLASSES_SECRET_SLOTS[0].y - 12)
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

/** The evil chick's confrontation, from the console's copy. */
function evilChickConversation(): StreetConversationScript {
  return {
    id: 'evil-chick',
    lines: EVIL_CHICK_LINES.map((line) =>
      line.speaker === 'chick'
        ? {
            speakerId: 'chick' as const,
            text: line.text,
            emotion: 'determined' as const
          }
        : {
            speakerId: 'player' as const,
            text: line.text,
            emotion: 'surprised' as const
          }
    )
  };
}

function readChoiceId(params: unknown): string {
  if (!params || typeof params !== 'object') return '';
  const choiceId = (params as { choiceId?: unknown }).choiceId;
  return typeof choiceId === 'string' ? choiceId : '';
}
