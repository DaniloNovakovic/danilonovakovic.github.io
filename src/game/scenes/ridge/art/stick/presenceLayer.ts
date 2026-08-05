import type * as Phaser from 'phaser';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { DEPTH, INK, PAPER, PAPER_WARM } from './palette';

const INK_CSS = '#1a1a1a';
const PAPER_CSS = '#fbfbf9';

export interface NameplateContent {
  name: string;
  role: string;
}

export interface PlacedPresence extends NameplateContent {
  id: string;
  x: number;
  y: number;
  alpha: number;
}

export interface FocusPrompt {
  key: string;
  label: string;
  x: number;
  y: number;
}

export interface ActiveBark {
  id: string;
  text: string;
  x: number;
  y: number;
  alpha: number;
}

/**
 * Floating world chrome: who someone is, what you can do with them, and the
 * throwaway things they say as you pass.
 *
 * Every piece draws its paper chrome once into container-local space, so
 * following an actor around only costs a transform update.
 */
export class PresenceLayer {
  private readonly scene: Phaser.Scene;
  private readonly nameplates = new Map<string, Nameplate>();
  private readonly barks = new Map<string, SpeechBubble>();
  private focus?: FocusPip;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  syncNameplates(entries: readonly PlacedPresence[]): void {
    const seen = new Set<string>();

    for (const entry of entries) {
      seen.add(entry.id);
      let plate = this.nameplates.get(entry.id);
      if (!plate) {
        plate = new Nameplate(this.scene);
        this.nameplates.set(entry.id, plate);
      }
      plate.setContent(entry);
      plate.place(entry.x, entry.y, entry.alpha);
    }

    for (const [id, plate] of this.nameplates) {
      if (!seen.has(id)) plate.hide();
    }
  }

  syncFocus(prompt: FocusPrompt | null, bob: number): void {
    if (!prompt) {
      this.focus?.hide();
      return;
    }
    if (!this.focus) this.focus = new FocusPip(this.scene);
    this.focus.setLabel(prompt.key, prompt.label);
    this.focus.place(prompt.x, prompt.y + bob);
  }

  syncBarks(active: readonly ActiveBark[]): void {
    const seen = new Set<string>();

    for (const bark of active) {
      seen.add(bark.id);
      let bubble = this.barks.get(bark.id);
      if (!bubble) {
        bubble = new SpeechBubble(this.scene);
        this.barks.set(bark.id, bubble);
      }
      bubble.setText(bark.text);
      bubble.place(bark.x, bark.y, bark.alpha);
    }

    for (const [id, bubble] of this.barks) {
      if (!seen.has(id)) bubble.hide();
    }
  }

  destroy(): void {
    for (const plate of this.nameplates.values()) plate.destroy();
    for (const bubble of this.barks.values()) bubble.destroy();
    this.nameplates.clear();
    this.barks.clear();
    this.focus?.destroy();
    this.focus = undefined;
  }
}

/** Name over a role tag, on a torn paper chip. */
class Nameplate {
  private readonly container: Phaser.GameObjects.Container;
  private readonly chip: Phaser.GameObjects.Graphics;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly roleText: Phaser.GameObjects.Text;
  private contentKey = '';
  private placedX = Number.NaN;
  private placedY = Number.NaN;
  private placedAlpha = -1;

  constructor(scene: Phaser.Scene) {
    this.chip = scene.add.graphics();
    this.nameText = createUiText(scene, 0, 0, '', {
      fontSize: '17px',
      color: INK_CSS
    }).setOrigin(0.5, 1);
    this.roleText = createUiText(scene, 0, 0, '', {
      fontSize: '11px',
      color: INK_CSS
    }).setOrigin(0.5, 1);
    this.roleText.setAlpha(0.75);

    this.container = scene.add
      .container(0, 0, [this.chip, this.nameText, this.roleText])
      .setDepth(DEPTH.presence)
      .setVisible(false);
  }

  setContent({ name, role }: NameplateContent): void {
    const key = `${name}|${role}`;
    if (key === this.contentKey) return;
    this.contentKey = key;

    this.nameText.setText(name);
    this.roleText.setText(role.toUpperCase());

    const hasRole = role.length > 0;
    const nameH = Math.ceil(this.nameText.height);
    const roleH = hasRole ? Math.ceil(this.roleText.height) : 0;

    this.roleText.setY(0);
    this.nameText.setY(hasRole ? -roleH - 1 : 0);

    const width = Math.max(this.nameText.width, this.roleText.width) + 18;
    const height = nameH + roleH + 9;
    const top = -height + 4;

    this.chip.clear();
    // Hard offset shadow first, matching the paper-cutout UI convention.
    this.chip.fillStyle(INK, 0.3);
    this.chip.fillRect(-width / 2 + 4, top + 4, width, height);
    this.chip.fillStyle(PAPER_WARM, 1);
    this.chip.fillRect(-width / 2, top, width, height);
    this.chip.lineStyle(2.4, INK, 1);
    this.chip.strokeRect(-width / 2, top, width, height);
    // Stem down toward the head.
    this.chip.lineStyle(2, INK, 0.55);
    this.chip.lineBetween(0, top + height, 0, top + height + 8);
  }

  place(x: number, y: number, alpha: number): void {
    const rx = Math.round(x);
    const ry = Math.round(y);
    if (rx !== this.placedX || ry !== this.placedY) {
      this.placedX = rx;
      this.placedY = ry;
      this.container.setPosition(rx, ry);
    }
    if (alpha !== this.placedAlpha) {
      this.placedAlpha = alpha;
      this.container.setAlpha(alpha);
    }
    this.container.setVisible(alpha > 0.02);
  }

  hide(): void {
    this.container.setVisible(false);
    this.placedAlpha = -1;
  }

  destroy(): void {
    this.container.destroy();
  }
}

/** The "you can talk to this" pip that hovers over the focused target. */
class FocusPip {
  private readonly container: Phaser.GameObjects.Container;
  private readonly chrome: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private labelKey = '';

  constructor(scene: Phaser.Scene) {
    this.chrome = scene.add.graphics();
    this.label = createUiText(scene, 0, 0, '', {
      fontSize: '14px',
      color: PAPER_CSS
    }).setOrigin(0.5, 1);

    this.container = scene.add
      .container(0, 0, [this.chrome, this.label])
      .setDepth(DEPTH.presence + 2)
      .setVisible(false);
  }

  setLabel(key: string, text: string): void {
    if (key === this.labelKey) return;
    this.labelKey = key;
    this.label.setText(text);

    const width = this.label.width + 22;
    const height = Math.ceil(this.label.height) + 10;
    const top = -height;

    this.chrome.clear();
    this.chrome.fillStyle(INK, 0.94);
    this.chrome.fillRect(-width / 2, top, width, height);
    this.chrome.lineStyle(2, PAPER, 0.85);
    this.chrome.strokeRect(-width / 2, top, width, height);
    // Caret pointing down at the target.
    this.chrome.fillStyle(INK, 0.94);
    this.chrome.fillTriangle(-7, top + height - 1, 7, top + height - 1, 0, top + height + 9);

    this.label.setY(-7);
  }

  place(x: number, y: number): void {
    this.container.setPosition(Math.round(x), Math.round(y)).setVisible(true);
  }

  hide(): void {
    this.container.setVisible(false);
  }

  destroy(): void {
    this.container.destroy();
  }
}

/** Small overheard line — the passing chatter of the street. */
class SpeechBubble {
  private readonly container: Phaser.GameObjects.Container;
  private readonly chrome: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private textKey = '';

  constructor(scene: Phaser.Scene) {
    this.chrome = scene.add.graphics();
    this.label = createUiText(scene, 0, 0, '', {
      fontSize: '14px',
      color: INK_CSS
    }).setOrigin(0.5, 1);

    this.container = scene.add
      .container(0, 0, [this.chrome, this.label])
      .setDepth(DEPTH.presence + 1)
      .setVisible(false);
  }

  setText(text: string): void {
    if (text === this.textKey) return;
    this.textKey = text;
    this.label.setText(text);

    const width = this.label.width + 22;
    const height = Math.ceil(this.label.height) + 12;
    const top = -height;

    this.chrome.clear();
    this.chrome.fillStyle(PAPER, 0.96);
    this.chrome.fillRect(-width / 2, top, width, height);
    this.chrome.lineStyle(2.2, INK, 0.85);
    this.chrome.strokeRect(-width / 2, top, width, height);
    this.chrome.fillStyle(PAPER, 1);
    this.chrome.fillTriangle(-9, top + height - 2, 5, top + height - 2, -4, top + height + 10);
    this.chrome.lineStyle(2.2, INK, 0.85);
    this.chrome.lineBetween(-9, top + height - 1, -4, top + height + 10);
    this.chrome.lineBetween(-4, top + height + 10, 5, top + height - 1);

    this.label.setY(-8);
  }

  place(x: number, y: number, alpha: number): void {
    this.container
      .setPosition(Math.round(x), Math.round(y))
      .setAlpha(alpha)
      .setVisible(alpha > 0.02);
  }

  hide(): void {
    this.container.setVisible(false);
  }

  destroy(): void {
    this.container.destroy();
  }
}
