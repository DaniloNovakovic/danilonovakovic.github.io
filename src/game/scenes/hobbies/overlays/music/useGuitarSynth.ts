import { useCallback, useRef } from 'react';
import { useHobbyAudio } from '../shared/useHobbyAudio';
import { renderPluckedString } from './karplusStrong';

/** Guitar string number, 1 = high E (top) ... 6 = low E (bottom). */
export type StringNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface GuitarStringSpec {
  number: StringNumber;
  note: string;
  frequency: number;
  /** Karplus-Strong feedback loss; treble strings ring shorter. */
  decay: number;
  /** Visual gauge (SVG stroke width). */
  gauge: number;
  wound: boolean;
}

/** Standard tuning, top (string 1, high E) to bottom (string 6, low E). */
export const GUITAR_STRINGS: readonly GuitarStringSpec[] = [
  { number: 1, note: 'E4', frequency: 329.63, decay: 0.9965, gauge: 1.2, wound: false },
  { number: 2, note: 'B3', frequency: 246.94, decay: 0.997, gauge: 1.5, wound: false },
  { number: 3, note: 'G3', frequency: 196.0, decay: 0.9972, gauge: 1.9, wound: false },
  { number: 4, note: 'D3', frequency: 146.83, decay: 0.9975, gauge: 2.4, wound: true },
  { number: 5, note: 'A2', frequency: 110.0, decay: 0.998, gauge: 3, wound: true },
  { number: 6, note: 'E2', frequency: 82.41, decay: 0.9982, gauge: 3.6, wound: true }
];

const SAMPLE_RATE = 22050;
const RING_SECONDS = 2.6;
const STRUM_STAGGER_SECONDS = 0.03;
const DAMP_SECONDS = 0.03;
const HAMMER_SECONDS = 0.02;

export interface StringExpression {
  /** Semitones above the open string. `null` chucks the string (muted in the shape). */
  fret?: number | null;
  palm?: boolean;
}

export type StrumDirection = 'down' | 'up';

interface StringBuffer {
  buffer: AudioBuffer;
  /** playbackRate that corrects the open-string render onto its true pitch. */
  openRate: number;
}

interface ContextCache {
  context: AudioContext;
  /** Shared bus so strummed chords do not clip. */
  output: DynamicsCompressorNode;
  buffers: Map<StringNumber, StringBuffer>;
  chuck: AudioBuffer | null;
}

interface Voice {
  source: AudioBufferSourceNode;
  gain: GainNode;
  openRate: number;
  fret: number;
  /** Audio-clock time this voice is scheduled to start. */
  startedAt: number;
}

function renderStringBuffer(context: AudioContext, spec: GuitarStringSpec): StringBuffer {
  const pluck = renderPluckedString(spec.frequency, {
    sampleRate: SAMPLE_RATE,
    durationSeconds: RING_SECONDS,
    decay: spec.decay
  });
  const buffer = context.createBuffer(1, pluck.samples.length, SAMPLE_RATE);
  buffer.getChannelData(0).set(pluck.samples);
  return { buffer, openRate: spec.frequency / pluck.renderedFrequency };
}

function renderChuckBuffer(context: AudioContext): AudioBuffer {
  const length = Math.floor(SAMPLE_RATE * 0.07);
  const buffer = context.createBuffer(1, length, SAMPLE_RATE);
  const data = buffer.getChannelData(0);
  let previous = 0;
  let peak = 0;
  for (let i = 0; i < length; i++) {
    const noise = Math.random() * 2 - 1;
    previous = previous * 0.55 + noise * 0.45;
    const sample = previous * Math.exp(-i / (SAMPLE_RATE * 0.012));
    data[i] = sample;
    peak = Math.max(peak, Math.abs(sample));
  }
  const scale = peak > 0 ? 0.8 / peak : 0;
  for (let i = 0; i < length; i++) data[i] = data[i]! * scale;
  return buffer;
}

function releaseOnEnded(source: AudioBufferSourceNode, ...nodes: AudioNode[]): void {
  source.onended = () => {
    source.onended = null;
    source.disconnect();
    for (const node of nodes) node.disconnect();
  };
}

/**
 * Plucked-string guitar voice. Each open string is rendered once per
 * AudioContext; frets are the same buffer played faster, which shortens the
 * speaking length the way a real fret does. Re-plucking damps the previous
 * voice. A grip change hammers ringing strings onto the new fret.
 */
export function useGuitarSynth() {
  const getAudio = useHobbyAudio();
  const cacheRef = useRef<ContextCache | null>(null);
  const voicesRef = useRef(new Map<StringNumber, Voice>());

  const cacheFor = useCallback((context: AudioContext): ContextCache => {
    if (cacheRef.current?.context !== context) {
      const output = context.createDynamicsCompressor();
      output.connect(context.destination);
      cacheRef.current = { context, output, buffers: new Map(), chuck: null };
      voicesRef.current.clear();
    }
    return cacheRef.current;
  }, []);

  const bufferFor = useCallback((cache: ContextCache, spec: GuitarStringSpec): StringBuffer => {
    let entry = cache.buffers.get(spec.number);
    if (!entry) {
      entry = renderStringBuffer(cache.context, spec);
      cache.buffers.set(spec.number, entry);
    }
    return entry;
  }, []);

  const dampVoice = useCallback((number: StringNumber, at: number) => {
    const voice = voicesRef.current.get(number);
    if (!voice) return;
    voicesRef.current.delete(number);
    const stopAt = Math.max(at + DAMP_SECONDS * 2, voice.startedAt);
    voice.gain.gain.cancelScheduledValues(at);
    voice.gain.gain.setTargetAtTime(0, at, DAMP_SECONDS / 3);
    voice.source.stop(stopAt);
  }, []);

  const chuckAt = useCallback((cache: ContextCache, at: number, velocity: number) => {
    if (!cache.chuck) cache.chuck = renderChuckBuffer(cache.context);
    const source = cache.context.createBufferSource();
    const tone = cache.context.createBiquadFilter();
    const gain = cache.context.createGain();
    source.buffer = cache.chuck;
    tone.type = 'bandpass';
    tone.frequency.value = 260 + Math.random() * 90;
    tone.Q.value = 0.7;
    gain.gain.setValueAtTime(Math.min(0.45, velocity), at);
    source.connect(tone).connect(gain).connect(cache.output);
    releaseOnEnded(source, tone, gain);
    source.start(at);
  }, []);

  const pluckAt = useCallback(
    (context: AudioContext, spec: GuitarStringSpec, at: number, velocity: number, fret: number | null, palm: boolean) => {
      const cache = cacheFor(context);
      dampVoice(spec.number, at);
      if (fret === null) {
        chuckAt(cache, at, velocity);
        return;
      }
      const { buffer, openRate } = bufferFor(cache, spec);
      const source = context.createBufferSource();
      const tone = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = buffer;
      const rate = openRate * 2 ** (fret / 12) * (1 + (Math.random() - 0.5) * 0.004);
      source.playbackRate.setValueAtTime(rate, at);
      tone.type = 'lowpass';
      tone.frequency.value = (palm ? 900 : 2500 + fret * 160) + Math.random() * (palm ? 180 : 700);
      const level = velocity * (0.36 + Math.random() * 0.08);
      gain.gain.setValueAtTime(level, at);
      if (palm) gain.gain.exponentialRampToValueAtTime(0.001, at + 0.11);
      source.connect(tone).connect(gain).connect(cache.output);
      const voice: Voice = { source, gain, openRate, fret, startedAt: at };
      source.onended = () => {
        source.onended = null;
        source.disconnect();
        tone.disconnect();
        gain.disconnect();
        if (voicesRef.current.get(spec.number) === voice) voicesRef.current.delete(spec.number);
      };
      voicesRef.current.set(spec.number, voice);
      source.start(at);
    },
    [bufferFor, cacheFor, chuckAt, dampVoice]
  );

  const pluck = useCallback(
    (spec: GuitarStringSpec, velocity = 1, expression?: StringExpression) => {
      const context = getAudio();
      if (!context) return;
      pluckAt(context, spec, context.currentTime, velocity, expression?.fret ?? 0, expression?.palm ?? false);
    },
    [getAudio, pluckAt]
  );

  /** Rake the current shape on the audio clock. Down starts on the low E. */
  const strumShape = useCallback(
    (frets: readonly (number | null)[], direction: StrumDirection, palm: boolean) => {
      const context = getAudio();
      if (!context) return;
      const start = context.currentTime + 0.012;
      const order = direction === 'down' ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
      order.forEach((index, step) => {
        const spec = GUITAR_STRINGS[index];
        if (!spec) return;
        const fret = frets[index] ?? null;
        const when = Math.max(context.currentTime, start + step * STRUM_STAGGER_SECONDS + (Math.random() - 0.5) * 0.004);
        const velocity = fret === null ? 0.22 : Math.max(0.45, 0.84 - step * 0.06);
        pluckAt(context, spec, when, velocity, fret, palm);
      });
    },
    [getAudio, pluckAt]
  );

  /** Slide ringing strings onto a new grip. Silent strings stay silent. */
  const retune = useCallback(
    (frets: readonly (number | null)[]) => {
      const context = getAudio();
      if (!context) return;
      const now = context.currentTime;
      GUITAR_STRINGS.forEach((spec, index) => {
        const voice = voicesRef.current.get(spec.number);
        if (!voice) return;
        const fret = frets[index] ?? null;
        if (fret === null) {
          dampVoice(spec.number, now);
          return;
        }
        if (fret === voice.fret) return;
        voice.source.playbackRate.cancelScheduledValues(now);
        voice.source.playbackRate.setTargetAtTime(voice.openRate * 2 ** (fret / 12), now, HAMMER_SECONDS);
        voice.fret = fret;
      });
    },
    [dampVoice, getAudio]
  );

  return { pluck, strumShape, retune };
}
