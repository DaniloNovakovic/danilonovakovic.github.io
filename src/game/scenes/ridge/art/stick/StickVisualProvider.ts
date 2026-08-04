import type * as Phaser from 'phaser';
import type { RidgeVisualProvider, RidgeVisualViewModel } from '../types';
import { drawRidgeAreaSet } from './areaSets';
import { drawCrtAtmosphere } from './atmosphere';
import { GROUND_Y, PAPER, STAGE_HEIGHT, STAGE_WIDTH } from './palette';
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
  drawStickTraveler
} from './stickFigures';

const BG_TEXTURE_KEY = 'ridge-stick-bg';
const CRT_TEXTURE_KEY = 'ridge-stick-crt';

export interface StickVisualProviderOptions {
  stageWidth?: number;
  stageHeight?: number;
}

/**
 * Stick-figure Ridge presentation.
 *
 * Performance rules:
 * - Scenery bakes once to a WebGL DynamicTexture (1 quad/frame). Never use
 *   Graphics#generateTexture (Canvas + willReadFrequently) for full stages.
 * - Stick Graphics redraw only when actors move.
 * - Text labels update only when text/position actually changes.
 */
export class StickVisualProvider implements RidgeVisualProvider {
  private readonly scene: Phaser.Scene;
  private readonly stageWidth: number;
  private readonly stageHeight: number;
  private readonly actors: Phaser.GameObjects.Graphics;
  private bgImage?: Phaser.GameObjects.Image;
  private crtImage?: Phaser.GameObjects.Image;
  private promptText?: Phaser.GameObjects.Text;
  private readonly nameLabels = new Map<string, Phaser.GameObjects.Text>();
  private readonly labelState = new Map<string, { text: string; x: number; y: number }>();
  private lastBackdropKey = '';
  private lastOverlayKey = '';
  private lastActorKey = '';
  private lastPrompt = '';
  private destroyed = false;

  constructor(scene: Phaser.Scene, options: StickVisualProviderOptions = {}) {
    this.scene = scene;
    this.stageWidth = options.stageWidth ?? STAGE_WIDTH;
    this.stageHeight = options.stageHeight ?? STAGE_HEIGHT;

    this.actors = scene.add.graphics().setDepth(20);

    this.promptText = scene.add
      .text(0, 0, '', {
        fontFamily: 'Caveat, Comic Neue, cursive',
        fontSize: '24px',
        color: '#1a1a1a',
        backgroundColor: '#fbfbf9ee',
        padding: { x: 12, y: 7 }
      })
      .setOrigin(0.5, 1)
      .setDepth(40)
      .setVisible(false);

    scene.cameras.main.setBounds(0, 0, this.stageWidth, this.stageHeight);
    scene.cameras.main.setBackgroundColor(PAPER);
    scene.cameras.main.setZoom(1.15);
  }

  worldXForProgress(progress: number): number {
    return 80 + progress * (this.stageWidth - 160);
  }

  sync(view: RidgeVisualViewModel): void {
    if (this.destroyed) return;

    // Beat only affects Relay threshold art; elsewhere crossingOpen covers before/after.
    const backdropKey =
      view.areaId === 'relay'
        ? `${view.areaId}|${view.beat}`
        : `${view.areaId}|${view.crossingOpen}`;

    if (backdropKey !== this.lastBackdropKey) {
      this.lastBackdropKey = backdropKey;
      this.bakeBackground(view);
    }

    const cam = this.scene.cameras.main;
    const overlayKey = `${Math.round(cam.width)}x${Math.round(cam.height)}`;
    if (overlayKey !== this.lastOverlayKey) {
      this.lastOverlayKey = overlayKey;
      this.bakeCrtOverlay(Math.round(cam.width), Math.round(cam.height));
    }

    const actorKey = buildActorKey(view);
    if (actorKey !== this.lastActorKey) {
      this.lastActorKey = actorKey;
      this.redrawActors(view);
    }

    const player = view.actors.find((actor) => actor.id === 'player');
    if (player) {
      const playerX = this.worldXForProgress(player.progress);
      if (this.promptText) {
        if (view.nearbyPrompt && view.mode === 'explore') {
          const prompt = `[E] ${view.nearbyPrompt}`;
          if (prompt !== this.lastPrompt) {
            this.lastPrompt = prompt;
            this.promptText.setText(prompt);
          }
          this.promptText.setPosition(playerX, GROUND_Y - 138).setVisible(true);
        } else {
          if (this.lastPrompt !== '') this.lastPrompt = '';
          this.promptText.setVisible(false);
        }
      }
      cam.centerOn(playerX, GROUND_Y - 80);
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.actors.destroy();
    this.bgImage?.destroy();
    this.crtImage?.destroy();
    this.promptText?.destroy();
    this.promptText = undefined;
    this.bgImage = undefined;
    this.crtImage = undefined;
    for (const label of this.nameLabels.values()) label.destroy();
    this.nameLabels.clear();
    this.labelState.clear();
    if (this.scene.textures.exists(BG_TEXTURE_KEY)) this.scene.textures.remove(BG_TEXTURE_KEY);
    if (this.scene.textures.exists(CRT_TEXTURE_KEY)) this.scene.textures.remove(CRT_TEXTURE_KEY);
  }

  private bakeBackground(view: RidgeVisualViewModel): void {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    drawRidgeAreaSet(g, view.areaId, view.crossingOpen, view.beat, {
      worldXForProgress: (p) => this.worldXForProgress(p),
      tick: 0,
      motion: false
    });

    try {
      const texture = replaceDynamicTexture(
        this.scene,
        BG_TEXTURE_KEY,
        this.stageWidth,
        this.stageHeight
      );
      texture.draw(g);
      texture.render();
      g.destroy();

      if (this.bgImage) {
        this.bgImage.setTexture(BG_TEXTURE_KEY).setVisible(true);
      } else {
        this.bgImage = this.scene.add
          .image(0, 0, BG_TEXTURE_KEY)
          .setOrigin(0, 0)
          .setDepth(10);
      }
    } catch {
      // Fallback: keep the Graphics object as a static (never-cleared) layer.
      g.setDepth(10);
      this.bgImage?.setVisible(false);
    }
  }

  private bakeCrtOverlay(width: number, height: number): void {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    drawCrtAtmosphere(g, w, h, 0, false);

    const texture = replaceDynamicTexture(this.scene, CRT_TEXTURE_KEY, w, h);
    texture.draw(g);
    texture.render();
    g.destroy();

    if (this.crtImage) {
      this.crtImage.setTexture(CRT_TEXTURE_KEY);
      this.crtImage.setDisplaySize(w, h);
    } else {
      this.crtImage = this.scene.add
        .image(0, 0, CRT_TEXTURE_KEY)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(50)
        .setDisplaySize(w, h);
    }
  }

  private redrawActors(view: RidgeVisualViewModel): void {
    this.actors.clear();
    const visibleIds = new Set<string>();

    for (const actor of view.actors) {
      if (!actor.visible) continue;
      visibleIds.add(actor.id);
      const x = this.worldXForProgress(actor.progress);
      const y = GROUND_Y;

      switch (actor.id) {
        case 'player':
          drawStickPlayer(this.actors, x, y, actor.facing, 1.15);
          break;
        case 'cicka':
        case 'counterpart-cat':
          drawStickCicka(this.actors, x, y, actor.id === 'counterpart-cat' ? 0.95 : 1.1);
          break;
        case 'draftsperson':
          drawStickDraftsperson(this.actors, x, y, actor.facing, 1.05);
          break;
        case 'toy-car':
          drawStickToyCar(this.actors, x + 18, y + 4, 1.1);
          break;
        case 'guitarist':
          drawStickGuitarist(this.actors, x, y, actor.facing, 1.05);
          break;
        case 'crowd':
          drawStickCrowd(this.actors, x, y, 1);
          break;
        case 'guitar':
          drawStickGuitar(this.actors, x + 16, y + 2, 1.1);
          break;
        case 'traveler':
          drawStickTraveler(this.actors, x, y, actor.facing, 1);
          break;
        case 'driver':
          drawStickDriver(this.actors, x, y, actor.facing, 1.05);
          break;
        case 'operations-helper':
          drawStickOperationsHelper(this.actors, x, y, actor.facing, 1.05);
          break;
        case 'dance-teacher':
          drawStickDanceTeacher(this.actors, x, y, actor.facing, 1.05);
          break;
        case 'steward':
          drawStickSteward(this.actors, x, y, actor.facing, 1);
          break;
        case 'shuttle':
          drawStickShuttle(this.actors, x, y, 1.1);
          break;
      }

      if (actor.id !== 'player' && actor.id !== 'toy-car' && actor.id !== 'guitar') {
        this.syncNameLabel(actor.id, actor.label, x, GROUND_Y - 82);
      }
    }

    for (const [id, label] of this.nameLabels) {
      if (!visibleIds.has(id)) label.setVisible(false);
    }
  }

  private syncNameLabel(id: string, text: string, x: number, y: number): void {
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    const prev = this.labelState.get(id);
    let label = this.nameLabels.get(id);

    if (!label) {
      label = this.scene.add
        .text(roundedX, roundedY, text, {
          fontFamily: 'Caveat, Comic Neue, cursive',
          fontSize: '17px',
          color: '#1a1a1a',
          backgroundColor: '#f4f1eadd',
          padding: { x: 6, y: 2 }
        })
        .setOrigin(0.5, 1)
        .setDepth(35);
      this.nameLabels.set(id, label);
      this.labelState.set(id, { text, x: roundedX, y: roundedY });
      return;
    }

    label.setVisible(true);
    if (!prev || prev.text !== text) label.setText(text);
    if (!prev || prev.x !== roundedX || prev.y !== roundedY) {
      label.setPosition(roundedX, roundedY);
    }
    this.labelState.set(id, { text, x: roundedX, y: roundedY });
  }
}

function buildActorKey(view: RidgeVisualViewModel): string {
  let key = `${view.areaId}|`;
  for (const actor of view.actors) {
    if (!actor.visible) continue;
    key += `${actor.id}:${Math.round(actor.progress * 2880)}:${actor.facing}|`;
  }
  return key;
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
