import { useCallback, useRef } from 'react';
import { useHobbyAudio } from '../shared/useHobbyAudio';
import { renderPluckedString } from './karplusStrong';
import type { StringNumber } from './riff';

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
const STRUM_STAGGER_SECONDS = 0.035;
const DAMP_SECONDS = 0.03;

interface StringBuffer {
  buffer: AudioBuffer;
  playbackRate: number;
}

interface ContextCache {
  context: AudioContext;
  /** Shared bus so strummed chords do not clip. */
  output: DynamicsCompressorNode;
  buffers: Map<StringNumber, StringBuffer>;
}

interface Voice {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

function renderStringBuffer(context: AudioContext, spec: GuitarStringSpec): StringBuffer {
  const pluck = renderPluckedString(spec.frequency, {
    sampleRate: SAMPLE_RATE,
    durationSeconds: RING_SECONDS,
    decay: spec.decay
  });
  const buffer = context.createBuffer(1, pluck.samples.length, SAMPLE_RATE);
  buffer.getChannelData(0).set(pluck.samples);
  return { buffer, playbackRate: spec.frequency / pluck.renderedFrequency };
}

/**
 * Plucked-string guitar voice. Each string's buffer is rendered once per
 * AudioContext and replayed with small pitch/level/tone variation; re-plucking
 * a ringing string damps the previous voice like a real guitar.
 */
export function useGuitarSynth() {
  const getAudio = useHobbyAudio();
  const cacheRef = useRef<ContextCache | null>(null);
  const voicesRef = useRef(new Map<StringNumber, Voice>());

  const cacheFor = useCallback((context: AudioContext): ContextCache => {
    if (cacheRef.current?.context !== context) {
      const output = context.createDynamicsCompressor();
      output.connect(context.destination);
      cacheRef.current = { context, output, buffers: new Map() };
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
    voice.gain.gain.setTargetAtTime(0, at, DAMP_SECONDS / 3);
    voice.source.stop(at + DAMP_SECONDS * 2);
  }, []);

  const pluckAt = useCallback(
    (context: AudioContext, spec: GuitarStringSpec, at: number, velocity: number) => {
      const cache = cacheFor(context);
      const { buffer, playbackRate } = bufferFor(cache, spec);
      dampVoice(spec.number, at);
      const source = context.createBufferSource();
      const tone = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate * (1 + (Math.random() - 0.5) * 0.004);
      tone.type = 'lowpass';
      tone.frequency.value = 2600 + Math.random() * 900;
      gain.gain.value = velocity * (0.36 + Math.random() * 0.08);
      source.connect(tone).connect(gain).connect(cache.output);
      const voice = { source, gain };
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
    [bufferFor, cacheFor, dampVoice]
  );

  const pluck = useCallback(
    (spec: GuitarStringSpec, velocity = 1) => {
      const context = getAudio();
      if (context) pluckAt(context, spec, context.currentTime, velocity);
    },
    [getAudio, pluckAt]
  );

  /** Down-strum from low E to high E, staggered on the audio clock. */
  const strumAll = useCallback(() => {
    const context = getAudio();
    if (!context) return;
    const start = context.currentTime + 0.02;
    for (let i = GUITAR_STRINGS.length - 1, step = 0; i >= 0; i--, step++) {
      pluckAt(context, GUITAR_STRINGS[i]!, start + step * STRUM_STAGGER_SECONDS, 0.8);
    }
  }, [getAudio, pluckAt]);

  return { pluck, strumAll };
}
