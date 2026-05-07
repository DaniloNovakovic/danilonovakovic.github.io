import * as Phaser from 'phaser';
import { STAMPEDE_ARENA } from './movement';
import type { StampedePressureSnapshot } from './pressure';
import type { StampedeSessionSnapshot } from './session';

export type StampedeHudFeedback = 'smudged' | 'blanketHeld' | 'crowded' | string;

export interface StampedeHudSnapshot {
  timeRemainingSeconds?: number;
  timerSeconds?: number;
  pageNoise?: number;
  phaseLabel?: string;
  feedback?: StampedeHudFeedback;
}

interface StampedeHudRuntimeOptions {
  scene: Phaser.Scene;
}

export interface StampedeHudRuntime {
  update(snapshot: StampedeHudSnapshot): void;
  destroy(): void;
}

export function createStampedeHudSnapshot(
  session: StampedeSessionSnapshot,
  pressure?: StampedePressureSnapshot
): StampedeHudSnapshot {
  const remainingMs = Math.max(0, session.durationMs - session.elapsedMs);

  return {
    timeRemainingSeconds: remainingMs / 1000,
    pageNoise: resolveHudNoise(session, pressure),
    phaseLabel: resolvePhaseLabel(session, pressure),
    feedback: resolveHudFeedback(session)
  };
}

export function createStampedeHudRuntime(
  options: StampedeHudRuntimeOptions
): StampedeHudRuntime {
  return new PhaserStampedeHudRuntime(options.scene);
}

class PhaserStampedeHudRuntime implements StampedeHudRuntime {
  private readonly root: Phaser.GameObjects.Container;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly phaseText: Phaser.GameObjects.Text;
  private readonly noiseText: Phaser.GameObjects.Text;
  private readonly feedbackText: Phaser.GameObjects.Text;
  private readonly noiseFill: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    const width = 340;
    const x = STAMPEDE_ARENA.safeLeft + 16;
    const y = 140;
    const panel = scene.add.rectangle(0, 0, width, 38, 0xfbfbf9, 0.88)
      .setOrigin(0, 0)
      .setStrokeStyle(3, 0x1a1a1a, 0.86);

    this.timerText = createHudText(scene, 12, 10, '0:00', 17, '#1a1a1a');
    this.phaseText = createHudText(scene, 74, 12, 'Kite ideas', 12, '#4b4337');
    this.noiseText = createHudText(scene, 198, 12, 'Noise', 12, '#4b4337');

    const noiseTrack = scene.add.rectangle(248, 19, 74, 8, 0xf4f1ea, 1)
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0x1a1a1a, 0.62);
    this.noiseFill = scene.add.rectangle(250, 19, 0, 4, 0x1a1a1a, 0.78)
      .setOrigin(0, 0.5);

    this.feedbackText = createHudText(scene, 74, 25, '', 10, '#1a1a1a');
    this.root = scene.add.container(x, y, [
      panel,
      this.timerText,
      this.phaseText,
      this.noiseText,
      noiseTrack,
      this.noiseFill,
      this.feedbackText
    ]).setDepth(80);
  }

  update(snapshot: StampedeHudSnapshot): void {
    const seconds = snapshot.timeRemainingSeconds ?? snapshot.timerSeconds ?? 0;
    const noise = Phaser.Math.Clamp(snapshot.pageNoise ?? 0, 0, 1);

    this.timerText.setText(formatTimer(seconds));
    this.phaseText.setText(snapshot.phaseLabel ?? 'Calm');
    this.noiseFill.width = Math.round(70 * noise);
    this.feedbackText.setText(formatFeedback(snapshot.feedback));
  }

  destroy(): void {
    this.root.destroy(true);
  }
}

function createHudText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  fontSize: number,
  color: string
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontFamily: 'monospace',
    fontSize: `${fontSize}px`,
    color
  });
}

function formatTimer(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  const paddedSeconds = `${wholeSeconds % 60}`.padStart(2, '0');

  return `${minutes}:${paddedSeconds}`;
}

function formatFeedback(feedback: StampedeHudFeedback | undefined): string {
  if (!feedback) return '';

  switch (feedback) {
    case 'smudged':
      return 'Smudged!';
    case 'blanketHeld':
      return 'Blanket held';
    case 'crowded':
      return 'Page got crowded';
    default:
      return feedback;
  }
}

function resolveHudNoise(
  session: StampedeSessionSnapshot,
  pressure?: StampedePressureSnapshot
): number {
  if (session.phase === 'failed') return 1;
  if (session.phase === 'cleared') return 0.08;
  return pressure?.pressure ?? 0.12;
}

function resolvePhaseLabel(
  session: StampedeSessionSnapshot,
  pressure?: StampedePressureSnapshot
): string {
  if (session.phase === 'failed') return 'Page crowded';
  if (session.phase === 'cleared') return 'Blanket held';

  switch (pressure?.band) {
    case 'build':
      return 'Noise rising';
    case 'surge':
      return 'Surge';
    case 'recover':
      return 'Breather';
    case 'calm':
    default:
      return 'Kite ideas';
  }
}

function resolveHudFeedback(
  session: StampedeSessionSnapshot
): StampedeHudFeedback | undefined {
  if (session.phase === 'failed') return 'crowded';
  if (session.phase === 'cleared') return 'blanketHeld';
  if (session.recentContact) return 'smudged';
  return undefined;
}
