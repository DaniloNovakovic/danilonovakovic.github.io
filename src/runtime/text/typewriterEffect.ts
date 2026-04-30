import * as Phaser from 'phaser';

export type TypewriterEffectHandle = {
  /** Stops the effect; does not call `onComplete`. Safe to call more than once. */
  cancel(): void;
};

export type StartTypewriterEffectOptions = {
  /** Milliseconds between revealing each additional character (after the first). */
  charDelayMs: number;
  /** Invoked once the full string is visible (including immediately for length 0–1). */
  onComplete?: () => void;
};

/**
 * Reveals `fullText` on a Phaser `Text` one character at a time using the scene clock.
 * Shows the first character immediately, then ticks on `charDelayMs` until done.
 */
export function startTypewriterEffect(
  scene: Phaser.Scene,
  text: Phaser.GameObjects.Text,
  fullText: string,
  options: StartTypewriterEffectOptions
): TypewriterEffectHandle {
  let timer: Phaser.Time.TimerEvent | undefined;

  const cancel = (): void => {
    if (timer) {
      timer.destroy();
      timer = undefined;
    }
  };

  if (fullText.length === 0) {
    text.setText('');
    text.setVisible(true);
    options.onComplete?.();
    return { cancel: () => {} };
  }

  text.setVisible(true);
  text.setText(fullText.slice(0, 1));
  if (fullText.length === 1) {
    options.onComplete?.();
    return { cancel: () => {} };
  }

  let i = 1;
  timer = scene.time.addEvent({
    delay: options.charDelayMs,
    repeat: fullText.length - 2,
    callback: () => {
      i += 1;
      text.setText(fullText.slice(0, i));
      if (i >= fullText.length) {
        cancel();
        options.onComplete?.();
      }
    }
  });

  return { cancel };
}
