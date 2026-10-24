import { useCallback, useRef } from 'react';
import { useHobbyAudio } from '../shared/useHobbyAudio';
import { lowestSoundingIndex } from './grips';
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
/** Full tone, then gone. Long enough to hear the chord, short enough for an upbeat. */
const SHORT_SECONDS = 0.16;

export interface StringExpression {
  /** Semitones above the open string. `null` chucks the string (muted in the shape). */
  fret?: number | null;
  palm?: boolean;
  /** Staccato: the note speaks, then stops, instead of ringing. */
  short?: boolean;
}

export type StrumDirection = 'down' | 'up';

/** `null` is a dead string. A missing fret is the open string, not a mute. */
export function resolvePluckFret(fret: number | null | undefined): number | null {
  return fret === undefined ? 0 : fret;
}

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
}

interface Voice {
  source: AudioBufferSourceNode;
  gain: GainNode;
  openRate: number;
  fret: number;
  /** Audio-clock time this voice is scheduled to start. */
  startedAt: number;
}

/** Visit each string that is still ringing, with the fret the new shape asks for. */
function forEachVoice(
  voices: ReadonlyMap<StringNumber, Voice>,
  frets: readonly (number | null)[],
  visit: (spec: GuitarStringSpec, voice: Voice, fret: number | null) => void
) {
  GUITAR_STRINGS.forEach((spec, index) => {
    const voice = voices.get(spec.number);
    if (!voice) return;
    visit(spec, voice, frets[index] ?? null);
  });
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

/**
 * Plucked-string guitar voice. Each open string is rendered once per
 * AudioContext; frets are the same buffer played faster, which shortens the
 * speaking length the way a real fret does. Re-plucking damps the previous
 * voice. A grip change lets strings on the same fret keep ringing and stops
 * the ones that moved, instead of sliding them to the new pitch.
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
    const stopAt = Math.max(at + DAMP_SECONDS * 2, voice.startedAt);
    voice.gain.gain.cancelScheduledValues(at);
    voice.gain.gain.setTargetAtTime(0, at, DAMP_SECONDS / 3);
    voice.source.stop(stopAt);
  }, []);

  const pluckAt = useCallback(
    (
      context: AudioContext,
      spec: GuitarStringSpec,
      at: number,
      velocity: number,
      fret: number | null,
      palm: boolean,
      short: boolean
    ) => {
      const cache = cacheFor(context);
      dampVoice(spec.number, at);
      // An X is a dead string: a short thud, not the open note, and not left ringing.
      const choked = fret === null;
      const soundingFret = choked ? 0 : fret;
      const { buffer, openRate } = bufferFor(cache, spec);
      const source = context.createBufferSource();
      const tone = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = buffer;
      const rate = openRate * 2 ** (soundingFret / 12) * (1 + (Math.random() - 0.5) * 0.004);
      source.playbackRate.setValueAtTime(rate, at);
      tone.type = 'lowpass';
      const level = velocity * (0.36 + Math.random() * 0.08);
      if (choked) {
        tone.frequency.value = 280;
        gain.gain.setValueAtTime(Math.min(0.16, level), at);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.04);
      } else if (palm) {
        tone.frequency.value = 700 + Math.random() * 120;
        gain.gain.setValueAtTime(level * 0.7, at);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.07);
      } else if (short) {
        tone.frequency.value = 2500 + soundingFret * 160 + Math.random() * 700;
        gain.gain.setValueAtTime(level, at);
        gain.gain.setValueAtTime(level, at + 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, at + SHORT_SECONDS);
      } else {
        tone.frequency.value = 2500 + soundingFret * 160 + Math.random() * 700;
        gain.gain.setValueAtTime(level, at);
      }
      source.connect(tone).connect(gain).connect(cache.output);
      const voice: Voice = { source, gain, openRate, fret: soundingFret, startedAt: at };
      source.onended = () => {
        source.onended = null;
        source.disconnect();
        tone.disconnect();
        gain.disconnect();
        if (voicesRef.current.get(spec.number) === voice) voicesRef.current.delete(spec.number);
      };
      if (!choked) voicesRef.current.set(spec.number, voice);
      source.start(at);
    },
    [bufferFor, cacheFor, dampVoice]
  );

  const pluck = useCallback(
    (spec: GuitarStringSpec, velocity = 1, expression?: StringExpression) => {
      const context = getAudio();
      if (!context) return;
      pluckAt(
        context,
        spec,
        context.currentTime,
        velocity,
        resolvePluckFret(expression?.fret),
        expression?.palm ?? false,
        expression?.short ?? false
      );
    },
    [getAudio, pluckAt]
  );

  /** Rake the current shape on the audio clock. Down starts on the low E. */
  const strumShape = useCallback(
    (frets: readonly (number | null)[], direction: StrumDirection, palm: boolean, short = false) => {
      const context = getAudio();
      if (!context) return;
      const start = context.currentTime + 0.012;
      const order = direction === 'down' ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
      order.forEach((index, step) => {
        const spec = GUITAR_STRINGS[index];
        if (!spec) return;
        const fret = frets[index] ?? null;
        const when = Math.max(context.currentTime, start + step * STRUM_STAGGER_SECONDS + (Math.random() - 0.5) * 0.004);
        const velocity = fret === null ? 0.35 : Math.max(0.45, 0.84 - step * 0.06);
        pluckAt(context, spec, when, velocity, fret, palm, short);
      });
    },
    [getAudio, pluckAt]
  );

  /** Keep strings whose fret did not move. Stop the ones that did. */
  const holdChord = useCallback(
    (frets: readonly (number | null)[]) => {
      const context = getAudio();
      if (!context) return;
      const now = context.currentTime;
      forEachVoice(voicesRef.current, frets, (spec, voice, fret) => {
        if (fret === null || fret !== voice.fret) dampVoice(spec.number, now);
      });
    },
    [dampVoice, getAudio]
  );

  /** Pitch-glide ringing strings. Used when the whole shape slides a fret. */
  const glide = useCallback(
    (frets: readonly (number | null)[]) => {
      const context = getAudio();
      if (!context) return;
      const now = context.currentTime;
      forEachVoice(voicesRef.current, frets, (spec, voice, fret) => {
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

  /** Silence the chord and strike its lowest speaking string. Returns that string number. */
  const pluckLowest = useCallback(
    (frets: readonly (number | null)[], palm = false, short = false): number | null => {
      const context = getAudio();
      if (!context) return null;
      const now = context.currentTime;
      for (const number of [...voicesRef.current.keys()]) dampVoice(number, now);
      const index = lowestSoundingIndex(frets);
      if (index === null) return null;
      const spec = GUITAR_STRINGS[index];
      const fret = frets[index];
      if (!spec || fret === null || fret === undefined) return null;
      pluckAt(context, spec, now, 0.92, fret, palm, short);
      return spec.number;
    },
    [dampVoice, getAudio, pluckAt]
  );

  return { pluck, strumShape, holdChord, glide, pluckLowest };
}
