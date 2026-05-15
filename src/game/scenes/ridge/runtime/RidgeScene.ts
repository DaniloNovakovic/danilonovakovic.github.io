import * as Phaser from 'phaser';
import { PHASER_SCENE_KEYS } from '@/game/scenes/sceneIds';
import {
  bridgeStore,
  isItemEquipped,
  type OpenOverlayOptions
} from '@/game/bridge/store';
import { TRAIL_CARD_OVERLAY_ID, type OverlayId } from '@/game/overlays/overlayIds';
import { getMessages } from '@/shared/i18n';
import {
  GAME_DESIGN_HEIGHT,
  GAME_DESIGN_WIDTH,
  SIDE_VIEW_JUMP_VELOCITY_Y,
  SIDE_VIEW_PLAYER_GRAVITY_Y,
  SIDE_VIEW_SPRINT_SPEED,
  SIDE_VIEW_WALK_SPEED
} from '@/game/sharedSceneRuntime/config';
import {
  createSideViewPlayerRuntime,
  type SideViewPlayerRuntime
} from '@/game/sharedSceneRuntime/player/SideViewPlayerRuntime';
import { TextureGenerator } from '@/game/sharedSceneRuntime/textures/TextureGenerator';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import {
  createInteriorInteractionRuntime,
  type InteriorInteractionRuntime
} from '@/game/sharedSceneRuntime/interactions/InteriorInteractionRuntime';
import {
  RIDGE_BLOCKOUT,
  compileRidgeBlockoutFacts,
  deriveRidgeBlockoutGeometry,
  type RidgeBlockoutAnchorPoint,
  type RidgeBlockoutAssistZone,
  type RidgeBlockoutBounds,
  type RidgeBlockoutCollider,
  type RidgeBlockoutGeometry,
  type RidgeBlockoutFacts,
  type RidgeBlockoutRoomBounds,
  type RidgeAnchorFact,
  findRidgeBlockoutFactAnchor
} from '../blockout';
import {
  RIDGE_TRAIL_CARD_TARGETS,
  type RidgeTrailCardTargetId
} from '../worldLayout';
import {
  getRidgeWorldMemories,
  hasRidgeWorldMemory,
  type RidgeWorldMemory
} from '../worldMemory';
import {
  CICKA_INTERACTION_TARGET_ID,
  getCickaInteractionResponse,
  shouldShowCickaInteractionPrompt,
  type CickaInteractionCopy,
  type CickaInteractionResponse
} from '../cicka/interaction';
import {
  createCickaAnimations,
  preloadCickaAssets
} from '../cicka/assets';
import {
  createCickaPerch,
  type CickaPerch
} from '../cicka/CickaPerch';
import type { TrailCardOverlayParams } from '@/game/overlays/trailCard/types';
import {
  createRidgeTraversalRuntime,
  type RidgeTraversalRuntime
} from './ridgeTraversalRuntime';

interface RidgeSceneStartData {
  onClose?: () => void;
  onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  isPaused?: boolean;
  resumePosition?: { x: number; y: number };
}

type RidgeInteractionEffect =
  | { kind: 'close' }
  | { kind: 'openTrailCard'; params: TrailCardOverlayParams }
  | { kind: 'showCickaResponse'; response: CickaInteractionResponse };

type RidgeInteractionTargetId =
  | RidgeTrailCardTargetId
  | typeof CICKA_INTERACTION_TARGET_ID;

const PLAYER_SPAWN_OFFSET_Y = -80;
const CICKA_PERCH_OFFSET_Y = -10;
const TRAIL_CARD_PROMPT_OFFSET_Y = -86;
const RIDGE_PLAYER_EDGE_PADDING = 48;
const RIDGE_COYOTE_TIME_MS = 120;
const RIDGE_JUMP_BUFFER_MS = 120;

export class RidgeScene extends Phaser.Scene {
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  interactPrompt?: Phaser.GameObjects.Text;

  private playerRuntime?: SideViewPlayerRuntime;
  private traversalRuntime?: RidgeTraversalRuntime;
  private interactionRuntime?: InteriorInteractionRuntime<RidgeInteractionTargetId, RidgeInteractionEffect>;
  private cickaPerch?: CickaPerch;
  private onClose: () => void = () => {};
  private onOpenOverlay?: (overlayId: OverlayId, options?: OpenOverlayOptions) => void;
  private isPaused = false;
  private resumePosition?: { x: number; y: number };

  constructor() {
    super(PHASER_SCENE_KEYS.ridge);
  }

  init(data: RidgeSceneStartData = {}): void {
    this.onClose = data.onClose ?? (() => {});
    this.onOpenOverlay = data.onOpenOverlay;
    this.isPaused = data.isPaused ?? false;
    this.resumePosition = data.resumePosition;
  }

  preload(): void {
    if (!this.textures.exists('player_idle')) {
      TextureGenerator.generatePlayer(this);
    }
    preloadCickaAssets(this);
  }

  getResumeCapturePosition(): { x: number; y: number } | null {
    return this.playerRuntime?.captureResume() ?? null;
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.playerRuntime?.setPaused(paused);
  }

  create(data: RidgeSceneStartData = {}): void {
    this.onClose = data.onClose ?? this.onClose;
    this.onOpenOverlay = data.onOpenOverlay ?? this.onOpenOverlay;
    const messages = getMessages();
    const ridgeProgress = bridgeStore.getState().progress.ridge;
    const blockout = RIDGE_BLOCKOUT;
    const geometry = deriveRidgeBlockoutGeometry(blockout, {
      stampIds: ridgeProgress.stampIds
    });
    const facts = compileRidgeBlockoutFacts(blockout, {
      stampIds: ridgeProgress.stampIds,
      geometry
    });
    this.traversalRuntime = undefined;

    this.cameras.main.setBackgroundColor('#f7f1df');
    this.physics.world.setBounds(
      geometry.bounds.x,
      geometry.bounds.y,
      geometry.bounds.width,
      geometry.bounds.height
    );
    createCickaAnimations(this);

    const worldMemories = getRidgeWorldMemories(ridgeProgress);
    this.addBackdrop(geometry.bounds);
    this.addRoomBounds(geometry.roomBounds);
    this.addFutureRoutePromises(facts);
    this.addTraversalConnectorVisuals(geometry);
    const platforms = this.addBlockoutColliders(geometry);
    this.addShortcutPromises(facts);
    this.addAnchorMarkers(geometry);
    this.addLandmarksFromBlockout(
      facts,
      messages.scenes.ridge.memory.stampedeFirstClearLabel,
      messages.scenes.ridge.memory.cickaWalkByBark,
      worldMemories
    );
    this.addPlaceholderCopy(facts);
    this.createPlayer(platforms, facts, geometry);
    this.createRidgeInteractions(
      messages.navigation.interact,
      messages.scenes.ridge.cicka.interaction,
      facts
    );
    this.setPaused(this.isPaused);
    this.playerRuntime?.syncAppearance();
  }

  update(_time: number, delta: number): void {
    if (this.player) {
      this.traversalRuntime?.primeGrounding(this.player);
    }
    const playerUpdate = this.playerRuntime?.update();
    if (!playerUpdate || playerUpdate.paused) return;

    if (playerUpdate.commands.exitContext) {
      this.onClose();
      return;
    }

    if (this.player) {
      this.traversalRuntime?.update({
        player: this.player,
        commands: playerUpdate.commands,
        deltaMs: delta
      });
    }

    this.cickaPerch?.update({
      playerX: this.player?.x ?? 0,
      playerY: this.player?.y ?? 0,
      nowMs: this.time.now
    });

    const interaction = this.interactionRuntime?.update({
      playerX: this.player?.x ?? 0,
      playerY: this.player?.y ?? 0,
      interactRequested: playerUpdate.step.interactRequested,
      exitRequested: playerUpdate.commands.exitContext
    });

    if (!interaction) {
      this.interactPrompt?.setVisible(false);
      return;
    }

    if (interaction.effect?.kind === 'openTrailCard') {
      this.onOpenOverlay?.(TRAIL_CARD_OVERLAY_ID, {
        params: interaction.effect.params,
        returnToSceneId: PHASER_SCENE_KEYS.ridge
      });
    } else if (interaction.effect?.kind === 'showCickaResponse') {
      this.cickaPerch?.showLine(interaction.effect.response.line, this.time.now);
    }

    if (
      !interaction.prompt.visible ||
      !shouldShowCickaInteractionPrompt({
        activeTargetId: interaction.activeTarget?.id ?? null,
        responseVisible: this.cickaPerch?.isSpeechVisible(this.time.now) ?? false
      })
    ) {
      this.interactPrompt?.setVisible(false);
      return;
    }

    this.interactPrompt?.setPosition(interaction.prompt.x, interaction.prompt.y).setVisible(true);
  }

  private addBackdrop(bounds: RidgeBlockoutBounds): void {
    this.add.rectangle(
      bounds.width / 2,
      bounds.height / 2,
      bounds.width,
      bounds.height,
      0xf7f1df,
      1
    ).setDepth(-100);

    const graphics = this.add.graphics().setDepth(-90);
    graphics.lineStyle(3, 0x1f1f1d, 0.06);
    for (let y = 160; y < bounds.height; y += 420) {
      graphics.strokeLineShape(new Phaser.Geom.Line(0, y, bounds.width, y));
    }

    for (let x = 180; x < bounds.width; x += 420) {
      const y = 260 + Math.sin(x / 180) * 34;
      graphics.lineStyle(4, 0x1f1f1d, 0.12);
      graphics.strokeLineShape(new Phaser.Geom.Line(x - 150, y + 34, x + 150, y - 34));
      graphics.lineStyle(3, 0x1f1f1d, 0.09);
      graphics.strokeLineShape(new Phaser.Geom.Line(x - 52, y + 60, x + 140, y + 24));
    }
  }

  private addRoomBounds(roomBounds: readonly RidgeBlockoutRoomBounds[]): void {
    roomBounds.forEach((room) => {
      this.add.rectangle(
        room.x + room.width / 2,
        room.y + room.height / 2,
        room.width,
        room.height,
        0xf7f1df,
        0.03
      )
        .setStrokeStyle(2, 0x1f1f1d, 0.12)
        .setDepth(-20);
      this.add.text(room.x + 12, room.y + 12, room.title, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#4b4337',
        backgroundColor: '#f7f1dfcc',
        padding: { x: 4, y: 2 }
      }).setDepth(20);
    });
  }

  private addFutureRoutePromises(facts: RidgeBlockoutFacts): void {
    const graphics = this.add.graphics().setDepth(-8);
    graphics.lineStyle(3, 0x596f8f, 0.18);

    facts.futureRoutes.forEach((route) => {
      route.links.forEach((link) => {
        const from = this.getRoomCenter(facts, link.fromRoomId);
        const to = this.getRoomCenter(facts, link.toRoomId);
        if (!from || !to) return;
        graphics.strokeLineShape(new Phaser.Geom.Line(from.x, from.y, to.x, to.y));
      });
    });
  }

  private addTraversalConnectorVisuals(geometry: RidgeBlockoutGeometry): void {
    const graphics = this.add.graphics().setDepth(3);
    geometry.routeConnectors.forEach((connector) => {
      connector.assistZones.forEach((zone) => {
        const color = getAssistZoneColor(zone);
        if (zone.kind === 'climb') {
          drawLadderVisual(graphics, zone, color);
          this.add.rectangle(zone.x, zone.y, 24, zone.height, 0x1f1f1d, 0.08)
            .setStrokeStyle(2, color, 0.28)
            .setDepth(2);
          return;
        }

        graphics.lineStyle(8, color, zone.kind === 'drop' ? 0.24 : 0.38);
        graphics.strokeLineShape(new Phaser.Geom.Line(
          zone.from.x,
          zone.from.y,
          zone.to.x,
          zone.to.y
        ));
      });
    });

    geometry.shortcutConnections.forEach((connection) => {
      connection.assistZones.forEach((zone) => {
        graphics.lineStyle(6, getAssistZoneColor(zone), 0.3);
        graphics.strokeLineShape(new Phaser.Geom.Line(
          zone.from.x,
          zone.from.y,
          zone.to.x,
          zone.to.y
        ));
      });
    });
  }

  private addBlockoutColliders(
    geometry: RidgeBlockoutGeometry
  ): Phaser.GameObjects.Zone[] {
    return geometry.colliders.map((collider) => {
      this.addColliderVisual(collider);
      const zone = this.add.zone(collider.x, collider.y, collider.width, collider.height);
      this.physics.add.existing(zone, true);
      return zone;
    });
  }

  private addColliderVisual(collider: RidgeBlockoutCollider): void {
    const style = getColliderStyle(collider);
    this.add.rectangle(
      collider.x,
      collider.y,
      collider.width,
      collider.height,
      style.fill,
      style.alpha
    )
      .setStrokeStyle(style.strokeWidth, 0x1f1f1d, style.strokeAlpha)
      .setDepth(style.depth);
  }

  private addShortcutPromises(facts: RidgeBlockoutFacts): void {
    facts.shortcuts.forEach((connection) => {
      if (!connection.from) return;
      const graphics = this.add.graphics().setDepth(6);
      graphics.lineStyle(4, connection.available ? 0xf0d35f : 0x1f1f1d, connection.available ? 0.34 : 0.16);
      graphics.strokeLineShape(new Phaser.Geom.Line(
        connection.from.x,
        connection.from.y,
        connection.to.x,
        connection.to.y
      ));

      if (!connection.available) {
        const centerX = (connection.from.x + connection.to.x) / 2;
        const centerY = (connection.from.y + connection.to.y) / 2;
        this.add.rectangle(centerX, centerY, 96, 18, 0xf7f1df, 0.24)
          .setStrokeStyle(2, 0x1f1f1d, 0.18)
          .setAngle(-4)
          .setDepth(7);
      }
    });
  }

  private addAnchorMarkers(geometry: RidgeBlockoutGeometry): void {
    geometry.anchorPoints.forEach((anchor) => {
      if (!['A', '*', '?', '^', 'N', 'M'].includes(anchor.symbol)) return;
      this.add.circle(anchor.x, anchor.y, 9, getAnchorColor(anchor), 0.58)
        .setStrokeStyle(2, 0x1f1f1d, 0.45)
        .setDepth(14);
      this.add.text(anchor.x + 12, anchor.y - 14, anchor.symbol, {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#1f1f1d',
        backgroundColor: '#f7f1df99',
        padding: { x: 2, y: 1 }
      }).setDepth(15);
    });
  }

  private addLandmarksFromBlockout(
    facts: RidgeBlockoutFacts,
    stampedeFirstClearLabel: string,
    cickaWalkByLine: string,
    worldMemories: readonly RidgeWorldMemory[]
  ): void {
    this.cickaPerch = undefined;

    const cickaPoint = requireRidgeBlockoutFactAnchor(facts, {
      roomId: 'cicka_home',
      symbol: 'C',
      kind: 'npc',
      attrId: 'cicka'
    }, 'Cicka Home perch');
    this.cickaPerch = createCickaPerch({
      scene: this,
      landmark: {
        x: cickaPoint.x,
        y: cickaPoint.y + CICKA_PERCH_OFFSET_Y
      },
      hasStampedeNoteMemory: hasRidgeWorldMemory(
        worldMemories.filter((memory) => memory.landmarkKind === 'cicka-perch'),
        'cicka-stampede-note'
      ),
      walkByLine: cickaWalkByLine
    });

    const outskirtsArtifact = requireRidgeBlockoutFactAnchor(facts, {
      roomId: 'outskirts',
      symbol: 'A',
      attrId: 'city_edge_memory'
    }, 'Outskirts artifact');
    this.addOutskirtsArtifactSlot(outskirtsArtifact.x, outskirtsArtifact.y);

    const stampedePoint = requireRidgeBlockoutFactAnchor(facts, {
      roomId: 'stampede_blanket',
      symbol: '*',
      kind: 'minigame',
      attrId: 'stampede_sketch'
    }, 'Stampede blanket');
    this.addStampedeBlanket(
      stampedePoint.x,
      stampedePoint.y,
      stampedeFirstClearLabel,
      worldMemories.filter((memory) => memory.landmarkKind === 'stampede-blanket')
    );

    const telegraphPoint = requireRidgeBlockoutFactAnchor(facts, {
      roomId: 'telegraph_terrace',
      symbol: '*',
      kind: 'minigame',
      attrId: 'telegraph_future'
    }, 'Telegraph Terrace bag');
    this.addTelegraphBag(telegraphPoint.x, telegraphPoint.y);

    const guidePoint = requireRidgeBlockoutFactAnchor(facts, {
      roomId: 'guide_overlook',
      symbol: 'N',
      kind: 'npc',
      attrId: 'ridge_guide'
    }, 'Ridge guide');
    this.addRidgeGuide(guidePoint.x, guidePoint.y);

    const relayPoint = requireRidgeBlockoutFactAnchor(facts, {
      roomId: 'relay_gate',
      symbol: '?',
      kind: 'gate',
      attrId: 'relay_proof_slots'
    }, 'Relay Gate');
    this.addRelayGate(relayPoint.x, relayPoint.y);
    this.addRelaySpire(relayPoint.x + 230, relayPoint.y - 180);

    const dominoPoint = requireRidgeBlockoutFactAnchor(facts, {
      roomId: 'domino_desk',
      symbol: 'A',
      attrId: 'domino_project_scrap'
    }, 'Domino Desk');
    this.addDominoDesk(dominoPoint.x, dominoPoint.y);

    const highLedgePoint = requireRidgeBlockoutFactAnchor(facts, {
      roomId: 'high_ledge',
      symbol: '?',
      kind: 'gate',
      attrId: 'movement_reward_tease'
    }, 'High Ledge teaser');
    this.addHighLedgeTeaser(highLedgePoint.x, highLedgePoint.y);
  }

  private createPlayer(
    platforms: readonly Phaser.GameObjects.Zone[],
    facts: RidgeBlockoutFacts,
    geometry: RidgeBlockoutGeometry
  ): void {
    const spawn = facts.spawn;
    const playerRuntime = createSideViewPlayerRuntime({
      scene: this,
      start: {
        x: spawn.x,
        y: spawn.y + PLAYER_SPAWN_OFFSET_Y
      },
      resumePosition: this.resumePosition,
      resumeClamp: {
        minX: geometry.bounds.x + RIDGE_PLAYER_EDGE_PADDING,
        maxX: geometry.bounds.x + geometry.bounds.width - RIDGE_PLAYER_EDGE_PADDING,
        minY: geometry.bounds.y + RIDGE_PLAYER_EDGE_PADDING,
        maxY: geometry.bounds.y + geometry.bounds.height - RIDGE_PLAYER_EDGE_PADDING
      },
      sprite: {
        depth: 30,
        gravityY: SIDE_VIEW_PLAYER_GRAVITY_Y
      },
      movement: {
        walkSpeed: SIDE_VIEW_WALK_SPEED,
        sprintSpeed: SIDE_VIEW_SPRINT_SPEED,
        jumpVelocityY: SIDE_VIEW_JUMP_VELOCITY_Y,
        coyoteTimeMs: RIDGE_COYOTE_TIME_MS,
        jumpBufferMs: RIDGE_JUMP_BUFFER_MS
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
        worldBounds: geometry.bounds,
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
    this.playerRuntime = playerRuntime;
    const player = playerRuntime.player;
    this.player = player;
    platforms.forEach((platform) => {
      this.physics.add.collider(player, platform);
    });
    this.traversalRuntime = createRidgeTraversalRuntime({
      geometry,
      initialSafePosition: { x: player.x, y: player.y }
    });
  }

  private createRidgeInteractions(
    promptText: string,
    cickaInteractionCopy: CickaInteractionCopy,
    facts: RidgeBlockoutFacts
  ): void {
    this.interactPrompt?.destroy();

    this.interactPrompt = createUiText(this, 0, 0, promptText, {
      fontSize: '16px',
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 2 }
    }).setOrigin(0.5).setDepth(100).setVisible(false);

    this.interactionRuntime = createInteriorInteractionRuntime<
      RidgeInteractionTargetId,
      RidgeInteractionEffect
    >({
      interactRadius: 72,
      exitEffect: { kind: 'close' },
      targets: [
        ...(this.cickaPerch ? [{
          ...this.cickaPerch.interactionFacts,
          effect: (): RidgeInteractionEffect => ({
            kind: 'showCickaResponse',
            response: getCickaInteractionResponse(
              getRidgeWorldMemories(bridgeStore.getState().progress.ridge),
              cickaInteractionCopy
            )
          })
        }] : []),
        ...this.createTrailCardTargets(facts)
      ]
    });
  }

  private createTrailCardTargets(
    facts: RidgeBlockoutFacts
  ): Array<{
    id: RidgeTrailCardTargetId;
    kind: 'trail-card';
    x: number;
    distanceAnchorY: number;
    prompt: { x: number; y: number };
    effect: RidgeInteractionEffect;
  }> {
    return RIDGE_TRAIL_CARD_TARGETS.map((target) => {
      const anchorPoint = requireRidgeBlockoutFactAnchor(
        facts,
        target.anchor,
        `${target.id} Trail Card`
      );
      return {
        id: target.id,
        kind: 'trail-card',
        x: anchorPoint.x,
        distanceAnchorY: anchorPoint.y,
        prompt: {
          x: anchorPoint.x,
          y: anchorPoint.y + TRAIL_CARD_PROMPT_OFFSET_Y
        },
        effect: {
          kind: 'openTrailCard',
          params: target.card
        }
      };
    });
  }

  private getRoomCenter(
    facts: Pick<RidgeBlockoutFacts, 'rooms'>,
    roomId: string
  ): { x: number; y: number } | undefined {
    const room = facts.rooms.find((candidate) => candidate.id === roomId);
    return room
      ? {
        x: room.bounds.x + room.bounds.width / 2,
        y: room.bounds.y + room.bounds.height / 2
      }
      : undefined;
  }

  private addOutskirtsArtifactSlot(x: number, y: number): void {
    this.add.rectangle(x - 44, y + 22, 92, 8, 0x1f1f1d, 0.2).setDepth(18);
    this.add.rectangle(x - 18, y - 4, 58, 36, 0xf7f1df, 0.94)
      .setStrokeStyle(3, 0x1f1f1d, 0.72)
      .setAngle(-5)
      .setDepth(18);
    this.add.rectangle(x + 34, y - 16, 34, 24, 0xf0d35f, 0.82)
      .setStrokeStyle(2, 0x1f1f1d, 0.72)
      .setAngle(7)
      .setDepth(18);
    this.add.circle(x + 34, y - 16, 4, 0x1f1f1d, 0.76).setDepth(19);
    this.add.circle(x + 44, y - 10, 3, 0x1f1f1d, 0.76).setDepth(19);
  }

  private addStampedeBlanket(
    x: number,
    y: number,
    stampedeFirstClearLabel: string,
    memories: readonly RidgeWorldMemory[]
  ): void {
    this.add.rectangle(x, y + 22, 104, 32, 0xb85f5a, 0.9).setDepth(16);
    this.add.rectangle(x - 26, y + 22, 18, 32, 0xf7f1df, 0.7).setDepth(17);
    this.add.rectangle(x + 26, y + 22, 18, 32, 0xf7f1df, 0.7).setDepth(17);
    this.add.circle(x - 22, y - 4, 11, 0x1f1f1d, 0.92).setDepth(17);
    this.add.circle(x + 28, y + 2, 9, 0x1f1f1d, 0.75).setDepth(17);
    if (memories.length) {
      this.addStampedeBlanketMemories(x, y + 22, stampedeFirstClearLabel, memories);
    }
  }

  private addStampedeBlanketMemories(
    x: number,
    y: number,
    stampedeFirstClearLabel: string,
    memories: readonly RidgeWorldMemory[]
  ): void {
    if (hasRidgeWorldMemory(memories, 'stampede-settled-swarm')) {
      [
        { x: -55, y: -36, radius: 4 },
        { x: -42, y: -49, radius: 3 },
        { x: -30, y: -39, radius: 2 },
        { x: 54, y: -30, radius: 3 },
        { x: 66, y: -43, radius: 2 }
      ].forEach((dot) => {
        this.add.circle(x + dot.x, y + dot.y, dot.radius, 0x1f1f1d, 0.24).setDepth(18);
      });
    }
    if (hasRidgeWorldMemory(memories, 'stampede-held-sticker')) {
      this.add.rectangle(x + 42, y - 48, 58, 26, 0xf7f1df, 1)
        .setStrokeStyle(3, 0x1f1f1d, 0.95)
        .setAngle(-8)
        .setDepth(19);
      this.add.text(x + 20, y - 57, stampedeFirstClearLabel, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#1f1f1d'
      }).setAngle(-8).setDepth(20);
    }
    if (hasRidgeWorldMemory(memories, 'stampede-glide-pip-decal')) {
      this.add.circle(x + 74, y - 18, 11, 0xf7f1df, 1)
        .setStrokeStyle(2, 0x1f1f1d, 0.9)
        .setDepth(19);
      this.add.line(x + 74, y - 18, -6, 6, 6, -6, 0x1f1f1d, 0.85).setLineWidth(2).setDepth(20);
    }
  }

  private addTelegraphBag(x: number, y: number): void {
    this.add.rectangle(x, y, 70, 54, 0x596f8f, 0.84).setDepth(16);
    this.add.rectangle(x, y - 34, 48, 16, 0x1f1f1d, 0.88).setDepth(17);
    this.add.arc(x, y - 40, 36, Math.PI, Math.PI * 2, false, 0x1f1f1d, 0.2)
      .setStrokeStyle(4, 0x1f1f1d, 0.7)
      .setDepth(17);
    this.add.line(x + 62, y - 18, -30, -20, 30, 20, 0x1f1f1d, 0.7).setLineWidth(4).setDepth(18);
  }

  private addRidgeGuide(x: number, y: number): void {
    this.add.circle(x, y - 28, 16, 0xf7f1df, 1).setStrokeStyle(3, 0x1f1f1d, 1).setDepth(18);
    this.add.rectangle(x, y + 8, 32, 58, 0xf7f1df, 1).setStrokeStyle(3, 0x1f1f1d, 1).setDepth(18);
    this.add.line(x - 8, y + 2, -30, -16, -52, -28, 0x1f1f1d, 1).setLineWidth(4).setDepth(19);
    this.add.rectangle(x + 42, y - 8, 42, 28, 0xf0d35f, 0.9).setStrokeStyle(3, 0x1f1f1d, 1).setDepth(18);
    this.add.text(x + 29, y - 17, '?', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#1f1f1d'
    }).setDepth(19);
  }

  private addRelayGate(x: number, y: number): void {
    this.add.rectangle(x, y, 108, 128, 0xf7f1df, 0.86)
      .setStrokeStyle(5, 0x1f1f1d, 0.86)
      .setDepth(16);
    this.add.rectangle(x, y + 6, 66, 98, 0x1f1f1d, 0.18)
      .setStrokeStyle(3, 0x1f1f1d, 0.58)
      .setDepth(17);
    this.add.circle(x, y - 62, 16, 0xf0d35f, 0.86)
      .setStrokeStyle(3, 0x1f1f1d, 0.72)
      .setDepth(18);
  }

  private addRelaySpire(x: number, y: number): void {
    this.add.triangle(x, y, 0, 180, 46, 0, 92, 180, 0x1c1a18, 0.56).setDepth(9);
    this.add.rectangle(x + 46, y + 125, 34, 250, 0x1c1a18, 0.56).setDepth(9);
    this.add.line(x + 46, y, -80, 35, 80, 35, 0x1c1a18, 0.34).setLineWidth(3).setDepth(9);
    this.add.circle(x + 46, y - 39, 12, 0xf0d35f, 0.84).setDepth(10);
  }

  private addDominoDesk(x: number, y: number): void {
    this.add.rectangle(x, y, 108, 50, 0xd7c78f, 0.96).setStrokeStyle(4, 0x1f1f1d, 1).setDepth(16);
    this.add.rectangle(x + 70, y - 40, 46, 94, 0xf7f1df, 1).setStrokeStyle(4, 0x1f1f1d, 1).setDepth(16);
    this.add.circle(x - 28, y - 16, 7, 0x1f1f1d, 1).setDepth(17);
    this.add.circle(x, y - 16, 7, 0x1f1f1d, 1).setDepth(17);
    this.add.circle(x + 28, y - 16, 7, 0x1f1f1d, 1).setDepth(17);
  }

  private addHighLedgeTeaser(x: number, y: number): void {
    this.add.rectangle(x, y, 142, 18, 0xf7f1df, 0.92)
      .setStrokeStyle(3, 0x1f1f1d, 0.72)
      .setDepth(16);
    this.add.rectangle(x - 42, y - 18, 48, 26, 0xf0d35f, 0.76)
      .setStrokeStyle(2, 0x1f1f1d, 0.62)
      .setAngle(-7)
      .setDepth(17);
    this.add.circle(x + 44, y - 32, 6, 0x1f1f1d, 0.68).setDepth(17);
    this.add.circle(x + 60, y - 37, 4, 0x1f1f1d, 0.58).setDepth(17);
  }

  private addPlaceholderCopy(facts: RidgeBlockoutFacts): void {
    const spawn = facts.spawn;
    this.add.text(spawn.x, spawn.y - 260, 'Sketchbook Ridge', {
      fontFamily: 'monospace',
      fontSize: '34px',
      color: '#1f1f1d'
    }).setOrigin(0.5).setDepth(60);
    this.add.text(spawn.x, spawn.y - 214, `${facts.title} - parsed ${facts.rooms.length} room beats`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#4b4337'
    }).setOrigin(0.5).setDepth(60);
  }
}

function getColliderStyle(collider: RidgeBlockoutCollider): {
  fill: number;
  alpha: number;
  strokeWidth: number;
  strokeAlpha: number;
  depth: number;
} {
  switch (collider.kind) {
    case 'solid':
      return { fill: 0x2f4736, alpha: 0.94, strokeWidth: 1, strokeAlpha: 0.16, depth: 1 };
    case 'platform':
      return { fill: 0xd7c78f, alpha: 0.94, strokeWidth: 2, strokeAlpha: 0.42, depth: 4 };
    case 'route-connector':
      return { fill: 0xf7f1df, alpha: 0.96, strokeWidth: 2, strokeAlpha: 0.52, depth: 5 };
    case 'shortcut-connector':
      return { fill: 0xf0d35f, alpha: 0.82, strokeWidth: 2, strokeAlpha: 0.6, depth: 6 };
  }
}

function getAnchorColor(anchor: RidgeBlockoutAnchorPoint): number {
  switch (anchor.symbol) {
    case '*':
      return 0xb85f5a;
    case '?':
      return 0x596f8f;
    case '^':
      return 0xf0d35f;
    case 'A':
      return 0xd7c78f;
    default:
      return 0xf7f1df;
  }
}

function getAssistZoneColor(zone: RidgeBlockoutAssistZone): number {
  switch (zone.kind) {
    case 'ramp':
      return 0xd7c78f;
    case 'climb':
      return 0x596f8f;
    case 'drop':
      return 0xf0d35f;
  }
}

function drawLadderVisual(
  graphics: Phaser.GameObjects.Graphics,
  zone: RidgeBlockoutAssistZone,
  color: number
): void {
  const railOffset = 9;
  const minY = Math.min(zone.from.y, zone.to.y);
  const maxY = Math.max(zone.from.y, zone.to.y);

  graphics.lineStyle(4, color, 0.5);
  graphics.strokeLineShape(new Phaser.Geom.Line(
    zone.from.x - railOffset,
    zone.from.y,
    zone.to.x - railOffset,
    zone.to.y
  ));
  graphics.strokeLineShape(new Phaser.Geom.Line(
    zone.from.x + railOffset,
    zone.from.y,
    zone.to.x + railOffset,
    zone.to.y
  ));

  graphics.lineStyle(3, 0x1f1f1d, 0.22);
  for (let y = minY + 20; y < maxY; y += 34) {
    graphics.strokeLineShape(new Phaser.Geom.Line(
      zone.from.x - railOffset - 4,
      y,
      zone.from.x + railOffset + 4,
      y
    ));
  }
}

function requireRidgeBlockoutFactAnchor(
  facts: RidgeBlockoutFacts,
  selector: {
    roomId: string;
    symbol?: string;
    kind?: string;
    attrId?: string;
  },
  label: string
): RidgeAnchorFact {
  const point = findRidgeBlockoutFactAnchor(facts, selector);
  if (!point) {
    throw new Error(
      `Ridge blockout anchor for ${label} could not be resolved in room "${selector.roomId}"`
    );
  }
  return point;
}
