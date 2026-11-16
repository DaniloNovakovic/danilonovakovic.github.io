/**
 * Karplus-Strong plucked-string synthesis.
 *
 * A noise burst circulates through a delay line whose length sets the pitch;
 * a two-tap averaging filter with a slight loss factor makes it decay like a
 * real string. The averaging adds half a sample of delay, and the integer
 * delay length quantizes pitch, so the exact rendered pitch is returned and
 * callers correct it with `playbackRate`.
 */

export interface PluckOptions {
  sampleRate: number;
  durationSeconds: number;
  /** Feedback loss per pass (0..1); lower values decay faster. */
  decay?: number;
  /** 0..1 excitation brightness; lower is a softer, thumb-like pluck. */
  brightness?: number;
  random?: () => number;
}

export interface PluckedString {
  samples: Float32Array;
  /** Frequency the buffer actually rings at, before playbackRate correction. */
  renderedFrequency: number;
}

const FADE_OUT_SECONDS = 0.05;

export function renderPluckedString(frequency: number, options: PluckOptions): PluckedString {
  const { sampleRate, durationSeconds, decay = 0.996, brightness = 0.55, random = Math.random } = options;
  const delayLength = Math.max(2, Math.round(sampleRate / frequency - 0.5));
  const line = new Float32Array(delayLength);

  let previous = 0;
  for (let i = 0; i < delayLength; i++) {
    const noise = random() * 2 - 1;
    previous = brightness * noise + (1 - brightness) * previous;
    line[i] = previous;
  }

  const length = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const samples = new Float32Array(length);
  let index = 0;
  let peak = 0;
  for (let n = 0; n < length; n++) {
    const next = index + 1 === delayLength ? 0 : index + 1;
    const current = line[index]!;
    samples[n] = current;
    line[index] = decay * 0.5 * (current + line[next]!);
    index = next;
    const magnitude = Math.abs(current);
    if (magnitude > peak) peak = magnitude;
  }

  normalizeWithFadeOut(samples, peak, Math.floor(sampleRate * FADE_OUT_SECONDS));
  return { samples, renderedFrequency: sampleRate / (delayLength + 0.5) };
}

function normalizeWithFadeOut(samples: Float32Array, peak: number, fadeLength: number): void {
  const scale = peak > 0 ? 0.9 / peak : 0;
  const last = samples.length - 1;
  const fadeStart = Math.max(0, last - fadeLength);
  for (let n = 0; n < samples.length; n++) {
    const fade = n < fadeStart || last === fadeStart ? 1 : (last - n) / (last - fadeStart);
    samples[n] = samples[n]! * scale * fade;
  }
}
