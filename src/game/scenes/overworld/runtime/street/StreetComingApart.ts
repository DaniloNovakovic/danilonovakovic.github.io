/**
 * The screen destroyer on the street (#164): the drawing coming apart as the
 * console's progress says, one kind of thing at a time, and a hit on any one
 * of them hits them all (so nobody hunts the street for the right building):
 *
 * - **labels**: every building label tilts on its bolts, then they all tumble
 *   off.
 * - **buildings**: every building shudders and leans, then they all crash
 *   down (the door tape with them), and bits of the sky come loose.
 * - **street**: every pole and sign wobbles, then they topple, and the rest of
 *   the street (pavement, the alarm, the sky) falls with them, front to back,
 *   until only blank paper is left.
 *
 * Everything spreads out from where the hammer landed. The card and the glass
 * are the shell's (they break in React).
 *
 * `apply` is idempotent: a scene created part-way through (a remount) shows
 * the same damage at once. Reduced motion: pieces are simply gone, with no
 * animated falling, sliding or shaking, and nothing ever flashes.
 */
import * as Phaser from 'phaser';
import { screenLayer, type ScreenDestroyerProgress, type ScreenLayerId } from '@/game/core/console';

const PAPER_CSS = '#fbfbf9';
/** The page around the card: once the card falls away, the game is the same paper edge to edge. */
const PAGE_CSS = '#f4f1ea';
const FALL_PX = 760;
const FALL_MS = 900;
const LABEL_SLIDE_PX = { x: 30, y: 26 };
const LABEL_TILT_RAD = 0.3;
const LABEL_JOLT_RAD = 0.18;
/** A building hit: a hard shudder, and it's left leaning. */
const SHUDDER_MS = 70;
const BUILDING_LEAN_RAD = 0.05;
const COLLAPSE_FALL_MS = 750;
const COLLAPSE_TILT_RAD = 0.4;
/** How fast a hit spreads along the street: ms of delay per pixel from the hammer. */
const SPREAD_MS_PER_PX = 0.25;
const SPREAD_MAX_MS = 650;
/** The rest of the street coming loose: one piece after another, front to back. */
const CASCADE_MS = 14;
const CASCADE_MAX_MS = 700;
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
  x: number;
  /** Every drawing of it (sketch and pixel), which fall together. */
  sprites: readonly Phaser.GameObjects.Sprite[];
  label: Phaser.GameObjects.Text;
}

/** The poles and signs: what the hammer can hit once the buildings are gone. */
export interface ComingApartProps {
  /** Where they stand (world x), and how wide a swing can be and still hit. */
  spots: readonly { x: number; halfWidth: number }[];
  /** Their drawings. */
  objects: readonly Phaser.GameObjects.GameObject[];
}

function asPieces(objects: readonly Phaser.GameObjects.GameObject[]): Piece[] {
  return objects
    .flatMap((obj) => (obj instanceof Phaser.GameObjects.Layer ? obj.getChildren() : [obj]))
    .filter((obj): obj is Piece => 'setVisible' in obj && !(obj instanceof Phaser.GameObjects.Zone));
}

export class StreetComingApart {
  private readonly scene: Phaser.Scene;
  private readonly motion: boolean;
  /** The rest of the street, front to back: the foreground goes first, the sky last. */
  private readonly backdrop: Piece[];
  private readonly labels: LabelHome[];
  private readonly buildings: readonly ComingApartBuilding[];
  private readonly withBuildings: Piece[];
  private readonly props: ComingApartProps;
  private readonly propPieces: Piece[];
  private readonly fallen = new Set<Piece>();
  private readonly done = new Set<string>();
  private started = false;
  private streetBreaking = false;
  private from = 0;

  /**
   * `street` is everything drawn on the street before the fight began.
   * `withBuildings` falls with the buildings (the tape across their doors).
   */
  constructor(options: {
    scene: Phaser.Scene;
    motion: boolean;
    street: readonly Phaser.GameObjects.GameObject[];
    buildings: readonly ComingApartBuilding[];
    withBuildings: readonly Phaser.GameObjects.GameObject[];
    props: ComingApartProps;
  }) {
    this.scene = options.scene;
    this.motion = options.motion;
    this.buildings = options.buildings;
    this.props = options.props;
    this.labels = options.buildings.map(({ label }, i) => ({
      text: label,
      x: label.x,
      y: label.y,
      side: i % 2 === 0 ? 1 : -1
    }));
    this.withBuildings = asPieces(options.withBuildings);
    this.propPieces = asPieces(options.props.objects);
    const own = new Set<Phaser.GameObjects.GameObject>([
      ...options.buildings.flatMap((b) => [...b.sprites, b.label]),
      ...this.withBuildings,
      ...this.propPieces
    ]);
    this.backdrop = asPieces(options.street)
      .filter((piece) => !own.has(piece))
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

  /**
   * Whether a swing from `x` lands on something of the layer breaking now:
   * any building for the labels and the buildings, any pole or sign after.
   */
  canHit(layer: ScreenLayerId, x: number): boolean {
    if (layer === 'labels' || layer === 'buildings')
      return this.buildings.some((b) => Math.abs(b.x - x) <= BUILDING_HALF_WIDTH_PX);
    if (layer === 'street') return this.props.spots.some((spot) => Math.abs(spot.x - x) <= spot.halfWidth);
    return false;
  }

  /** `fromX`: where the hammer just landed (world x); the damage spreads out from there. */
  apply(progress: ScreenDestroyerProgress | null, animate: boolean, fromX?: number): void {
    if (!progress || progress.hits === 0) return;
    const anim = animate && this.motion;
    if (fromX !== undefined) this.from = fromX;
    if (!this.started) {
      this.started = true;
      // Behind the drawing there was only ever blank paper.
      this.scene.cameras.main.setBackgroundColor(PAPER_CSS);
    }
    const labels = screenLayer(progress, 'labels');
    const buildings = screenLayer(progress, 'buildings');
    const street = screenLayer(progress, 'street');
    this.streetBreaking = buildings.hitsTaken > 0;

    if (labels.gone) this.once('labels:gone', () => this.labelsFall(anim));
    else this.labelsTilt(labels.damage, anim);
    if (buildings.gone) this.once('buildings:gone', () => this.buildingsFall(anim));
    else if (buildings.hitsTaken > 0) this.once('buildings:hit', () => this.buildingsLean(anim));
    if (street.gone) this.once('street:gone', () => this.fallAll(this.propPieces, anim));
    else if (street.hitsTaken > 0) this.once('street:hit', () => this.propsWobble(anim));
    // The rest of the street comes loose in thirds: with the buildings, at the first pole, with the last.
    this.backdropFalls(((buildings.gone ? 1 : 0) + street.hitsTaken) / (1 + street.hits), anim);

    if (screenLayer(progress, 'card').gone) this.scene.cameras.main.setBackgroundColor(PAGE_CSS);
  }

  private once(step: string, run: () => void): void {
    if (this.done.has(step)) return;
    this.done.add(step);
    run();
  }

  /** Delay before the damage reaches something at `x`, spreading out from the hammer. */
  private spread(x: number, anim: boolean): number {
    return anim ? Math.min(Math.abs(x - this.from) * SPREAD_MS_PER_PX, SPREAD_MAX_MS) : 0;
  }

  /** Every label tilted as far as they've been hit, jolting past it and settling. */
  private labelsTilt(damage: number, anim: boolean): void {
    for (const { text, x, y, side } of this.labels) {
      const to = {
        x: x + side * LABEL_SLIDE_PX.x * damage,
        y: y + LABEL_SLIDE_PX.y * damage,
        rotation: side * LABEL_TILT_RAD * damage
      };
      if (!anim) {
        text.setPosition(to.x, to.y).setRotation(to.rotation);
        continue;
      }
      this.scene.tweens.add({
        targets: text,
        x: to.x,
        y: to.y,
        rotation: { from: to.rotation + side * LABEL_JOLT_RAD, to: to.rotation },
        delay: this.spread(x, anim),
        duration: 420,
        ease: 'Elastic.Out'
      });
    }
  }

  private labelsFall(anim: boolean): void {
    for (const { text, side } of this.labels) this.fall(text, side, anim, this.spread(text.x, anim));
  }

  /** Every building takes the hit: a hard shudder, and it's left leaning. */
  private buildingsLean(anim: boolean): void {
    for (const [i, building] of this.buildings.entries()) {
      const lean = (i % 2 === 0 ? 1 : -1) * BUILDING_LEAN_RAD;
      for (const sprite of building.sprites) {
        if (!anim) {
          sprite.setRotation(lean);
          continue;
        }
        const x = sprite.x;
        this.scene.tweens.chain({
          targets: sprite,
          delay: this.spread(building.x, anim),
          tweens: [
            { x: x + 7, duration: SHUDDER_MS, yoyo: true, repeat: 1, ease: 'Stepped' },
            { rotation: lean, duration: 260, ease: 'Back.Out' }
          ]
        });
      }
    }
  }

  /** Every building folds over and crashes down, the tape on their doors with them. */
  private buildingsFall(anim: boolean): void {
    for (const [i, building] of this.buildings.entries()) {
      const delay = this.spread(building.x, anim);
      for (const sprite of building.sprites) this.collapse(sprite, i % 2 === 0 ? 1 : -1, anim, delay);
    }
    this.fallAll(this.withBuildings, anim);
  }

  /** Every pole and sign shakes on its footing. */
  private propsWobble(anim: boolean): void {
    if (!anim) return;
    for (const piece of this.propPieces) {
      if (typeof piece.x !== 'number') continue;
      this.scene.tweens.add({
        targets: piece,
        x: piece.x + 6,
        duration: SHUDDER_MS,
        yoyo: true,
        repeat: 2,
        ease: 'Stepped'
      });
    }
  }

  private fallAll(pieces: readonly Piece[], anim: boolean): void {
    for (const [i, piece] of pieces.entries()) {
      if (this.fallen.has(piece)) continue;
      this.fallen.add(piece);
      this.fall(piece, i % 2 === 0 ? 1 : -1, anim, 0);
    }
  }

  /** The front `share` of the rest of the street has come loose, one piece after another. */
  private backdropFalls(share: number, anim: boolean): void {
    const count = Math.floor(this.backdrop.length * share);
    let order = 0;
    for (const [i, piece] of this.backdrop.slice(0, count).entries()) {
      if (this.fallen.has(piece)) continue;
      this.fallen.add(piece);
      const delay = anim ? Math.min(order * CASCADE_MS, CASCADE_MAX_MS) : 0;
      order += 1;
      this.fall(piece, i % 2 === 0 ? 1 : -1, anim, delay);
    }
  }

  /** A building crashes down: it folds over and drops out of the picture. */
  private collapse(sprite: Phaser.GameObjects.Sprite, side: 1 | -1, anim: boolean, delay: number): void {
    if (!anim) {
      sprite.setVisible(false);
      return;
    }
    this.scene.tweens.add({
      targets: sprite,
      y: sprite.y + FALL_PX,
      rotation: side * COLLAPSE_TILT_RAD,
      alpha: 0,
      delay,
      duration: COLLAPSE_FALL_MS,
      ease: 'Cubic.In',
      onComplete: () => sprite.setVisible(false)
    });
  }

  private fall(piece: Piece, side: 1 | -1, anim: boolean, delay: number): void {
    if (!anim || typeof piece.y !== 'number') {
      piece.setVisible(false);
      return;
    }
    this.scene.tweens.add({
      targets: piece,
      y: piece.y + FALL_PX,
      rotation: (piece.rotation ?? 0) + side * 0.5,
      alpha: 0,
      delay,
      duration: FALL_MS,
      ease: 'Cubic.In',
      onComplete: () => piece.setVisible(false)
    });
  }
}
