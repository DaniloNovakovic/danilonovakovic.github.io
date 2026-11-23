import type * as Phaser from 'phaser';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { DEPTH, INK, INK_CSS, PAPER, PAPER_CSS, PAPER_WARM } from './palette';

export interface FocusPrompt {
  key: string;
  /** What pressing interact does, e.g. "Pet Cicka". */
  action: string;
  /** Who the action is aimed at; omitted for scenery spots. */
  name?: string;
  role?: string;
  x: number;
  y: number;
}

export interface FrameBounds {
  left: number;
  right: number;
}

/** Gap kept between a bubble and the frame edge, in world units. */
const FRAME_MARGIN = 8;

export interface ActiveBark {
  id: string;
  text: string;
  x: number;
  y: number;
  alpha: number;
}

/**
 * Floating world chrome: who the focused resident is, what you can do with
 * them, and the throwaway things others say as you pass.
 *
 * Identity lives on the focus card only. Ambient per-actor nameplates were
 * dropped: on a crowded stage they read as a wall of signs, collided with each
 * other, and short actors (cats) pinned their plate over the player's head.
 *
 * Every piece draws its paper chrome once into container-local space, so
 * following an actor around only costs a transform update.
 */
export class PresenceLayer {
  private readonly scene: Phaser.Scene;
  private readonly barks = new Map<string, SpeechBubble>();
  private readonly seenIds = new Set<string>();
  private focus?: FocusCard;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  syncFocus(prompt: FocusPrompt | null, bob: number): void {
    if (!prompt) {
      this.focus?.hide();
      return;
    }
    if (!this.focus) this.focus = new FocusCard(this.scene);
    this.focus.setContent(prompt);
    this.focus.place(prompt.x, prompt.y + bob);
  }

  /** `frame` is the camera's world view; bubbles are kept inside it. */
  syncBarks(active: readonly ActiveBark[], frame: FrameBounds | null = null): void {
    this.seenIds.clear();

    for (const bark of active) {
      this.seenIds.add(bark.id);
      let bubble = this.barks.get(bark.id);
      if (!bubble) {
        bubble = new SpeechBubble(this.scene);
        this.barks.set(bark.id, bubble);
      }
      bubble.setText(bark.text);
      bubble.place(bark.x, bark.y, bark.alpha, frame);
    }

    for (const [id, bubble] of this.barks) {
      if (!this.seenIds.has(id)) bubble.hide();
    }
  }

  destroy(): void {
    for (const bubble of this.barks.values()) bubble.destroy();
    this.barks.clear();
    this.focus?.destroy();
    this.focus = undefined;
  }
}

/**
 * The focused target: a small paper tab naming who it is, over an ink strip
 * saying what interact will do. Origin is the caret tip.
 */
class FocusCard {
  private readonly container: Phaser.GameObjects.Container;
  private readonly chrome: Phaser.GameObjects.Graphics;
  private readonly actionText: Phaser.GameObjects.Text;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly roleText: Phaser.GameObjects.Text;
  private contentKey = '';

  constructor(scene: Phaser.Scene) {
    this.chrome = scene.add.graphics();
    this.actionText = createUiText(scene, 0, 0, '', {
      fontSize: '14px',
      color: PAPER_CSS
    }).setOrigin(0.5, 1);
    this.nameText = createUiText(scene, 0, 0, '', {
      fontSize: '13px',
      color: INK_CSS
    }).setOrigin(0, 1);
    this.roleText = createUiText(scene, 0, 0, '', {
      fontSize: '10px',
      color: INK_CSS
    })
      .setOrigin(0, 1)
      .setAlpha(0.7);

    this.container = scene.add
      .container(0, 0, [this.chrome, this.actionText, this.nameText, this.roleText])
      .setDepth(DEPTH.presence + 2)
      .setVisible(false);
  }

  setContent({ key, action, name: rawName, role }: FocusPrompt): void {
    // Called every frame while focused: bail on the raw inputs before any
    // tokenizing so an unchanged card costs one string compare.
    const contentKey = `${key}|${action}|${rawName}|${role}`;
    if (contentKey === this.contentKey) return;
    this.contentKey = contentKey;

    // "Talk to Draftsperson" already says who; the tab only earns its place
    // when the action doesn't ("Practice Riff", "Clear Gate").
    const name = rawName && !mentions(action, rawName) ? rawName : undefined;
    const shownRole = name && role && !sameWords(name, role) ? role : '';

    this.actionText.setText(action);
    this.nameText.setText(name ?? '').setVisible(Boolean(name));
    this.roleText.setText(shownRole.toUpperCase()).setVisible(shownRole.length > 0);

    const caret = 8;
    const barW = Math.ceil(this.actionText.width) + 22;
    const barH = Math.ceil(this.actionText.height) + 8;
    const barTop = -caret - barH;

    this.chrome.clear();
    if (name) {
      const gap = shownRole ? 6 : 0;
      const nameW = Math.ceil(this.nameText.width);
      const roleW = shownRole ? Math.ceil(this.roleText.width) : 0;
      const tabW = nameW + gap + roleW + 16;
      const tabH = Math.ceil(this.nameText.height) + 5;
      // Tab tucks 2px under the strip so the two read as one card.
      const tabTop = barTop - tabH + 2;
      const left = -tabW / 2 + 8;

      this.chrome.fillStyle(INK, 0.25);
      this.chrome.fillRect(-tabW / 2 + 3, tabTop + 3, tabW, tabH);
      this.chrome.fillStyle(PAPER_WARM, 1);
      this.chrome.fillRect(-tabW / 2, tabTop, tabW, tabH);
      this.chrome.lineStyle(2, INK, 1);
      this.chrome.strokeRect(-tabW / 2, tabTop, tabW, tabH);

      const baseline = barTop - 1;
      this.nameText.setPosition(left, baseline);
      // Role sits on the name's baseline, nudged up to optically match.
      this.roleText.setPosition(left + nameW + gap, baseline - 2);
    }

    this.chrome.fillStyle(INK, 0.94);
    this.chrome.fillRect(-barW / 2, barTop, barW, barH);
    this.chrome.lineStyle(2, PAPER, 0.85);
    this.chrome.strokeRect(-barW / 2, barTop, barW, barH);
    // Caret pointing down at the target.
    this.chrome.fillStyle(INK, 0.94);
    this.chrome.fillTriangle(-7, -caret - 1, 7, -caret - 1, 0, 0);

    this.actionText.setY(-caret - 4);
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

/** "Bridge Draftsperson" over "bridge draftsperson" says the same thing twice. */
function sameWords(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** True when the action text already names the target by any word of its name. */
function mentions(action: string, name: string): boolean {
  const actionWords = new Set(words(action));
  return words(name).some((word) => word.length > 2 && actionWords.has(word));
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** Small overheard line — the passing chatter of the street. */
class SpeechBubble {
  private readonly container: Phaser.GameObjects.Container;
  private readonly chrome: Phaser.GameObjects.Graphics;
  private readonly label: Phaser.GameObjects.Text;
  private textKey = '';
  private width = 0;
  private height = 0;
  /** Where the tail meets the speaker, relative to the bubble's centre. */
  private tailX = Number.NaN;

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
    this.width = this.label.width + 22;
    this.height = Math.ceil(this.label.height) + 12;
    this.tailX = Number.NaN;
    this.label.setY(-8);
  }

  /**
   * Paper slip with a hard offset shadow and a tail aimed at the speaker.
   * Redrawn only when the tail has to move, which is only near frame edges.
   */
  private drawChrome(tailX: number): void {
    if (tailX === this.tailX) return;
    this.tailX = tailX;
    const { width, height } = this;
    const top = -height;
    const bottom = top + height;
    const tail = Math.max(-width / 2 + 14, Math.min(width / 2 - 14, tailX));

    this.chrome.clear();
    this.chrome.fillStyle(INK, 0.85);
    this.chrome.fillRect(-width / 2 + 3, top + 3, width, height);
    this.chrome.fillStyle(PAPER, 1);
    this.chrome.fillRect(-width / 2, top, width, height);
    this.chrome.lineStyle(2.2, INK, 0.9);
    this.chrome.strokeRect(-width / 2, top, width, height);
    this.chrome.fillStyle(PAPER, 1);
    this.chrome.fillTriangle(tail - 7, bottom - 2, tail + 7, bottom - 2, tailX, bottom + 10);
    this.chrome.lineStyle(2.2, INK, 0.9);
    this.chrome.lineBetween(tail - 7, bottom - 1, tailX, bottom + 10);
    this.chrome.lineBetween(tailX, bottom + 10, tail + 7, bottom - 1);
  }

  place(x: number, y: number, alpha: number, frame: FrameBounds | null): void {
    let centerX = x;
    if (frame) {
      const half = this.width / 2 + FRAME_MARGIN;
      const min = frame.left + half;
      const max = frame.right - half;
      if (min <= max) centerX = Math.max(min, Math.min(max, x));
    }
    centerX = Math.round(centerX);
    this.drawChrome(Math.round(x) - centerX);
    this.container
      .setPosition(centerX, Math.round(y))
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
