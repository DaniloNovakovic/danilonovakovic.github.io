import type * as Phaser from 'phaser';

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
 * How many painted glyphs are inside the first `visibleCount` characters.
 * Line breaks take a typewriter step but Phaser does not draw them.
 */
export function visibleGlyphCount(fullText: string, visibleCount: number): number {
  const end = Math.max(0, Math.min(visibleCount, fullText.length));
  let count = 0;
  for (let index = 0; index < end; index += 1) {
    const char = fullText[index];
    if (char !== '\n' && char !== '\r') count += 1;
  }
  return count;
}

/**
 * Runs `redraw` while canvas text draws only the first `glyphLimit` glyphs.
 * The string itself stays complete, so word wrap and alignment are computed once.
 */
export function applyTypewriterClip(
  painter: CanvasRenderingContext2D,
  glyphLimit: number,
  redraw: () => void
): void {
  const originalFill = painter.fillText;
  const originalStroke = painter.strokeText;
  let drawn = 0;

  const clip = (content: string, advance: boolean): string | null => {
    const start = drawn;
    if (advance) drawn += content.length;
    if (content.length === 0 || start >= glyphLimit) return null;
    const take = Math.min(content.length, glyphLimit - start);
    return take > 0 ? content.slice(0, take) : null;
  };

  const paint = (
    original: typeof originalFill,
    content: string,
    x: number,
    y: number,
    maxWidth: number | undefined,
    advance: boolean
  ): void => {
    const visible = clip(content, advance);
    if (!visible) return;
    if (maxWidth === undefined) original.call(painter, visible, x, y);
    else original.call(painter, visible, x, y, maxWidth);
  };

  painter.fillText = (content, x, y, maxWidth) => {
    paint(originalFill, content, x, y, maxWidth, true);
  };
  painter.strokeText = (content, x, y, maxWidth) => {
    paint(originalStroke, content, x, y, maxWidth, false);
  };

  try {
    redraw();
  } finally {
    painter.fillText = originalFill;
    painter.strokeText = originalStroke;
  }
}

/**
 * Reveals `fullText` on a Phaser `Text` one character at a time using the scene clock.
 * The full string stays laid out from the first frame; later characters are simply not drawn.
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

  const reveal = (visibleCount: number): void => {
    applyTypewriterClip(text.context, visibleGlyphCount(fullText, visibleCount), () => {
      if (text.text !== fullText) text.setText(fullText);
      else text.updateText();
    });
  };

  if (fullText.length === 0) {
    text.setText('');
    text.setVisible(true);
    options.onComplete?.();
    return { cancel: () => {} };
  }

  text.setVisible(true);
  reveal(1);
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
      reveal(i);
      if (i >= fullText.length) {
        cancel();
        options.onComplete?.();
      }
    }
  });

  return { cancel };
}
