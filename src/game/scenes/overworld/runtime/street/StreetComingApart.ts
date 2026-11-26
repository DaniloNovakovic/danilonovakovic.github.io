/**
 * The screen destroyer on the street (#164): the drawing coming apart, layer
 * by layer, as the console's progress says. The building labels slide and
 * then tumble off; the street drawn before the fight (buildings, sky,
 * pavement, the alarm) falls away piece by piece, front to back, into blank
 * paper; and last, Danilo is erased from the top down. The header is the
 * shell's (it peels in React).
 *
 * `apply` is idempotent: a scene created part-way through (a remount) shows
 * the same damage at once. Reduced motion: pieces are simply gone, with no
 * animated falling or sliding, and nothing ever flashes.
 */
import * as Phaser from 'phaser';
import { screenLayer, type ScreenDestroyerProgress } from '@/game/core/console';

const PAPER_CSS = '#fbfbf9';
const FALL_PX = 760;
const FALL_MS = 900;
const LABEL_SLIDE_PX = { x: 46, y: 34 };
const LABEL_TILT_RAD = 0.32;

type Piece = Phaser.GameObjects.GameObject &
  Phaser.GameObjects.Components.Visible &
  Partial<Phaser.GameObjects.Components.Transform>;

interface LabelHome {
  text: Phaser.GameObjects.Text;
  x: number;
  y: number;
  side: 1 | -1;
}

export class StreetComingApart {
  private readonly scene: Phaser.Scene;
  private readonly motion: boolean;
  private readonly pieces: Piece[];
  private readonly labels: LabelHome[];
  private readonly danilo: Phaser.GameObjects.Sprite;
  private readonly fallen = new Set<Piece>();
  private labelsFallen = false;
  private daniloDamage = 0;
  private started = false;
  private streetBreaking = false;

  /**
   * `street` is everything drawn on the street before the fight began; the
   * labels and Danilo are kept apart, since they break on their own.
   */
  constructor(options: {
    scene: Phaser.Scene;
    motion: boolean;
    street: readonly Phaser.GameObjects.GameObject[];
    labels: readonly Phaser.GameObjects.Text[];
    danilo: Phaser.GameObjects.Sprite;
  }) {
    this.scene = options.scene;
    this.motion = options.motion;
    this.danilo = options.danilo;
    this.labels = options.labels.map((text, i) => ({ text, x: text.x, y: text.y, side: i % 2 === 0 ? 1 : -1 }));
    // Front to back: the foreground goes first, the sky last.
    this.pieces = options.street
      // A layer (the buildings) comes apart building by building.
      .flatMap((obj) => (obj instanceof Phaser.GameObjects.Layer ? obj.getChildren() : [obj]))
      .filter((obj): obj is Piece => 'setVisible' in obj && !(obj instanceof Phaser.GameObjects.Zone))
      .map((piece, index) => ({ piece, index, depth: (piece as Partial<{ depth: number }>).depth ?? 0 }))
      .sort((a, b) => b.depth - a.depth || a.index - b.index)
      .map(({ piece }) => piece);
  }

  /** Has the page started coming apart (so the street stops moving its own drawing). */
  get coming(): boolean {
    return this.started;
  }

  /** The street itself is breaking: its drawing stands still from here on (the simulation stops). */
  get frozen(): boolean {
    return this.streetBreaking;
  }

  apply(progress: ScreenDestroyerProgress | null, animate: boolean): void {
    if (!progress) return;
    const anim = animate && this.motion;
    if (!this.started) {
      this.started = true;
      // Behind the drawing there was only ever blank paper.
      this.scene.cameras.main.setBackgroundColor(PAPER_CSS);
    }
    this.applyLabels(screenLayer(progress, 'labels'), anim);
    const street = screenLayer(progress, 'street');
    this.streetBreaking = street.hitsTaken > 0;
    this.applyStreet(street.hitsTaken, street.hits, anim);
    this.daniloDamage = screenLayer(progress, 'danilo').damage;
    this.update();
  }

  /** Keeps Danilo erased as far as he's been hit, whatever frame his animation is on. */
  update(): void {
    if (this.daniloDamage <= 0) return;
    if (this.daniloDamage >= 1) {
      this.danilo.setVisible(false);
      return;
    }
    const frame = this.danilo.frame;
    const top = Math.round(frame.height * this.daniloDamage);
    this.danilo.setCrop(0, top, frame.width, frame.height - top);
  }

  private applyLabels(layer: { damage: number; gone: boolean }, anim: boolean): void {
    if (this.labelsFallen) return;
    if (layer.gone) {
      this.labelsFallen = true;
      for (const { text, side } of this.labels) this.fall(text, side, anim);
      return;
    }
    for (const { text, x, y, side } of this.labels) {
      const to = {
        x: x + side * LABEL_SLIDE_PX.x * layer.damage,
        y: y + LABEL_SLIDE_PX.y * layer.damage,
        rotation: side * LABEL_TILT_RAD * layer.damage
      };
      if (anim) this.scene.tweens.add({ targets: text, ...to, duration: 220, ease: 'Back.Out' });
      else text.setPosition(to.x, to.y).setRotation(to.rotation);
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
