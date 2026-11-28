/**
 * The screen destroyer on the street (#164): the drawing coming apart as the
 * console's progress says. First the building labels tilt on their bolts (the
 * one on the building that was hit jolts), then tumble off. Then each building
 * the hammer hits crashes down, and with every one a share of the rest of the
 * street (props, pavement, the alarm, the sky) comes loose and falls, front to
 * back, until only blank paper is left. The card and the glass are the
 * shell's (they break in React).
 *
 * `apply` is idempotent: a scene created part-way through (a remount) shows
 * the same damage at once, with the fallen buildings picked in street order.
 * Reduced motion: pieces are simply gone, with no animated falling, sliding
 * or shaking, and nothing ever flashes.
 */
import * as Phaser from 'phaser';
import { screenLayer, type ScreenDestroyerProgress } from '@/game/core/console';

const PAPER_CSS = '#fbfbf9';
/** The page around the card: once the card falls away, the game is the same paper edge to edge. */
const PAGE_CSS = '#f4f1ea';
const FALL_PX = 760;
const FALL_MS = 900;
const LABEL_SLIDE_PX = { x: 30, y: 26 };
const LABEL_TILT_RAD = 0.3;
const LABEL_JOLT_RAD = 0.18;
/** A building crashing down: a shudder, then it folds over and drops. */
const COLLAPSE_SHUDDER_MS = 70;
const COLLAPSE_FALL_MS = 750;
const COLLAPSE_TILT_RAD = 0.4;
/** Half the width of a building, near enough: a swing within it lands on the building. */
const BUILDING_HALF_WIDTH_PX = 125;

type Piece = Phaser.GameObjects.GameObject &
  Phaser.GameObjects.Components.Visible &
  Partial<Phaser.GameObjects.Components.Transform>;

interface LabelHome {
  text: Phaser.GameObjects.Text;
  x: number;
  y: number;
  side: 1 | -1;
}

export interface ComingApartBuilding {
  buildingId: string;
  x: number;
  /** Every drawing of it (sketch and pixel), which fall together. */
  sprites: readonly Phaser.GameObjects.Sprite[];
  label: Phaser.GameObjects.Text;
}

export class StreetComingApart {
  private readonly scene: Phaser.Scene;
  private readonly motion: boolean;
  private readonly pieces: Piece[];
  private readonly labels: LabelHome[];
  private readonly buildings: readonly ComingApartBuilding[];
  private readonly fallen = new Set<Piece>();
  private readonly collapsed = new Set<string>();
  private labelsFallen = false;
  private started = false;
  private streetBreaking = false;

  /**
   * `street` is everything drawn on the street before the fight began, except
   * the buildings and their labels, which break on their own.
   */
  constructor(options: {
    scene: Phaser.Scene;
    motion: boolean;
    street: readonly Phaser.GameObjects.GameObject[];
    buildings: readonly ComingApartBuilding[];
  }) {
    this.scene = options.scene;
    this.motion = options.motion;
    this.buildings = options.buildings;
    this.labels = options.buildings.map(({ label }, i) => ({
      text: label,
      x: label.x,
      y: label.y,
      side: i % 2 === 0 ? 1 : -1
    }));
    const buildingSprites = new Set<Phaser.GameObjects.GameObject>(options.buildings.flatMap((b) => b.sprites));
    // Front to back: the foreground goes first, the sky last.
    this.pieces = options.street
      .flatMap((obj) => (obj instanceof Phaser.GameObjects.Layer ? obj.getChildren() : [obj]))
      .filter(
        (obj): obj is Piece =>
          'setVisible' in obj && !(obj instanceof Phaser.GameObjects.Zone) && !buildingSprites.has(obj)
      )
      .map((piece, index) => ({ piece, index, depth: (piece as Partial<{ depth: number }>).depth ?? 0 }))
      .sort((a, b) => b.depth - a.depth || a.index - b.index)
      .map(({ piece }) => piece);
  }

  /** Has the page started coming apart (so the street stops focusing its buildings). */
  get coming(): boolean {
    return this.started;
  }

  /** The street itself is breaking: its drawing stands still from here on (the simulation stops). */
  get frozen(): boolean {
    return this.streetBreaking;
  }

  /** The building a swing from `x` lands on, if one is still standing there. */
  standingBuildingAt(x: number): ComingApartBuilding | null {
    let best: ComingApartBuilding | null = null;
    for (const building of this.buildings) {
      if (this.collapsed.has(building.buildingId)) continue;
      const off = Math.abs(building.x - x);
      if (off <= BUILDING_HALF_WIDTH_PX && (!best || off < Math.abs(best.x - x))) best = building;
    }
    return best;
  }

  /** `hit`: the building the hammer just landed on, if any (it's the one that falls). */
  apply(progress: ScreenDestroyerProgress | null, animate: boolean, hit?: string): void {
    if (!progress || progress.hits === 0) return;
    const anim = animate && this.motion;
    if (!this.started) {
      this.started = true;
      // Behind the drawing there was only ever blank paper.
      this.scene.cameras.main.setBackgroundColor(PAPER_CSS);
    }
    const labels = screenLayer(progress, 'labels');
    this.applyLabels(labels, anim, labels.gone ? undefined : hit);
    const street = screenLayer(progress, 'street');
    this.streetBreaking = street.hitsTaken > 0;
    this.applyBuildings(street.hitsTaken, anim, hit);
    this.applyStreet(street.hitsTaken, street.hits, anim);
    if (screenLayer(progress, 'card').gone) this.scene.cameras.main.setBackgroundColor(PAGE_CSS);
  }

  private applyLabels(layer: { damage: number; gone: boolean }, anim: boolean, hit?: string): void {
    if (this.labelsFallen) return;
    if (layer.gone) {
      this.labelsFallen = true;
      for (const { text, side } of this.labels) this.fall(text, side, anim);
      return;
    }
    for (const [i, home] of this.labels.entries()) {
      this.tiltLabel(home, layer.damage, anim, this.buildings[i]?.buildingId === hit);
    }
  }

  /** A label tilted as far as the street has been hit; the one on the building just hit swings past and settles. */
  private tiltLabel({ text, x, y, side }: LabelHome, damage: number, anim: boolean, jolted: boolean): void {
    const to = {
      x: x + side * LABEL_SLIDE_PX.x * damage,
      y: y + LABEL_SLIDE_PX.y * damage,
      rotation: side * LABEL_TILT_RAD * damage
    };
    if (!anim) {
      text.setPosition(to.x, to.y).setRotation(to.rotation);
      return;
    }
    this.scene.tweens.add({
      targets: text,
      x: to.x,
      y: to.y,
      rotation: jolted ? { from: to.rotation + side * LABEL_JOLT_RAD, to: to.rotation } : to.rotation,
      duration: jolted ? 420 : 220,
      ease: jolted ? 'Elastic.Out' : 'Back.Out'
    });
  }

  /** One building down per hit: the one hit, or (on a remount) the next one along the street. */
  private applyBuildings(down: number, anim: boolean, hit?: string): void {
    const order = [
      ...this.buildings.filter((b) => b.buildingId === hit),
      ...this.buildings.filter((b) => b.buildingId !== hit)
    ];
    for (const building of order) {
      if (this.collapsed.size >= down) return;
      if (this.collapsed.has(building.buildingId)) continue;
      this.collapsed.add(building.buildingId);
      for (const [i, sprite] of building.sprites.entries()) this.collapse(sprite, i === 0 ? 1 : -1, anim);
    }
  }

  /** Piece i falls once its share of the street's hits has landed. */
  private applyStreet(hitsTaken: number, hits: number, anim: boolean): void {
    const total = this.pieces.length;
    for (let i = 0; i < total; i++) {
      const piece = this.pieces[i]!;
      const fallsAtHit = Math.floor((i * hits) / total) + 1;
      if (hitsTaken >= fallsAtHit && !this.fallen.has(piece)) {
        this.fallen.add(piece);
        this.fall(piece, i % 2 === 0 ? 1 : -1, anim);
      }
    }
  }

  /** A building crashes down: a hard shudder, then it folds over and drops out of the picture. */
  private collapse(sprite: Phaser.GameObjects.Sprite, side: 1 | -1, anim: boolean): void {
    if (!anim) {
      sprite.setVisible(false);
      return;
    }
    const x = sprite.x;
    this.scene.tweens.chain({
      targets: sprite,
      tweens: [
        { x: x + 7, duration: COLLAPSE_SHUDDER_MS, yoyo: true, repeat: 1, ease: 'Stepped' },
        {
          y: sprite.y + FALL_PX,
          rotation: side * COLLAPSE_TILT_RAD,
          alpha: 0,
          duration: COLLAPSE_FALL_MS,
          ease: 'Cubic.In'
        }
      ],
      onComplete: () => sprite.setVisible(false)
    });
  }

  private fall(piece: Piece, side: 1 | -1, anim: boolean): void {
    if (!anim || typeof piece.y !== 'number') {
      piece.setVisible(false);
      return;
    }
    this.scene.tweens.add({
      targets: piece,
      y: piece.y + FALL_PX,
      rotation: (piece.rotation ?? 0) + side * 0.5,
      alpha: 0,
      duration: FALL_MS,
      ease: 'Cubic.In',
      onComplete: () => piece.setVisible(false)
    });
  }
}
