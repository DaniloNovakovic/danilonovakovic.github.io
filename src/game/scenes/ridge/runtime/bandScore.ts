// Backing parts are arrangement data; the branching is the band's feel per section.
// fallow-ignore-file complexity
import {
  isBachataSection,
  type BachataSectionKind,
  type ConcertSectionKind,
  type GigBar,
  type GigChord,
  type GigLane,
  type GigSong
} from '@/game/core/ridge';

/**
 * What the backing band plays under a chart, as timed hits. Pure: the synth
 * voices live in ConcertGigAudio. Two bands share it: the Late Show's street
 * kit at the Concert Crossing, and a bachata trio at Last-Stop Plaza (güira,
 * bongó, bass, and a requinto that answers the dancers).
 */

export type BandHit =
  | 'kick'
  | 'snare'
  | 'hat'
  | 'click'
  | 'crash'
  | 'clap'
  | 'bass'
  | 'hum'
  | 'guira'
  | 'bongoHigh'
  | 'bongoLow'
  | 'requinto';

export interface BandEvent {
  timeMs: number;
  hit: BandHit;
  /** Bass / hum / requinto pitch. */
  hz?: number;
  level: number;
}

/** MIDI-ish semitone of each chord's root, around A3. */
const CHORD_ROOT: Record<GigChord, number> = { Am: 57, F: 53, C: 60, G: 55, Dm: 62, E: 52 };
const MINOR = new Set<GigChord>(['Am', 'Dm']);

const hzOf = (semitone: number) => 440 * 2 ** ((semitone - 69) / 12);

/** Lead voice for a lane: root, third, fifth of the bar's chord. */
export function laneHz(chord: GigChord, lane: GigLane): number {
  const root = CHORD_ROOT[chord];
  const offset = lane === 0 ? 0 : lane === 1 ? (MINOR.has(chord) ? 3 : 4) : 7;
  return hzOf(root + offset);
}

/** What the street band plays under each Concert section. The lead is the player's. */
const FEEL: Record<ConcertSectionKind, { kick: number[]; snare: number[]; hat: number; bass: number[]; clap?: number[] }> = {
  // Beats are 0-based within the bar; eighths as .5.
  riff: { kick: [0], snare: [], hat: 1, bass: [0, 2] },
  intro: { kick: [0, 2], snare: [], hat: 1, bass: [0, 2] },
  verse: { kick: [0, 2], snare: [1, 3], hat: 0.5, bass: [0, 1, 2, 3] },
  chorus: { kick: [0, 1.5, 2], snare: [1, 3], hat: 0.5, bass: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] },
  breakdown: { kick: [], snare: [], hat: 0, bass: [0], clap: [1, 3] },
  finale: { kick: [0, 1.5, 2, 3.5], snare: [1, 3], hat: 0.5, bass: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] }
};

export interface BandOptions {
  /** The skater kid got the front row clapping: claps on two and four from the count-in through the intro. */
  frontRowClap?: boolean;
}

/** Expand the song into backing-band hits, sorted by time. */
export function buildBandEvents(song: GigSong, options: BandOptions = {}): BandEvent[] {
  const events: BandEvent[] = [];
  const beat = song.beatMs;
  const bachata = song.sections.length > 0 && isBachataSection(song.sections[0]!.kind);
  // Count-in: the drummer clicks four on the sticks; the Profe claps them.
  for (let t = 0; t < song.startMs - 1; t += beat) {
    events.push(bachata ? { timeMs: t, hit: 'clap', level: 0.55 } : { timeMs: t, hit: 'click', level: 1 });
  }
  if (options.frontRowClap) {
    const introEnd = song.sections.find((section) => section.kind === 'intro')?.endMs ?? song.startMs;
    for (let t = beat; t < introEnd - 1; t += beat * 2) events.push({ timeMs: t, hit: 'clap', level: 0.8 });
  }

  song.bars.forEach((bar, index) => {
    const kind = song.sections[bar.section]!.kind;
    if (isBachataSection(kind)) {
      events.push(...bachataBar(bar, kind, beat));
      return;
    }
    const feel = FEEL[kind];
    const soft = kind === 'riff' ? 0.6 : 1;
    const firstOfSection = index === 0 || song.bars[index - 1]!.section !== bar.section;
    if (firstOfSection && (kind === 'chorus' || kind === 'finale')) {
      events.push({ timeMs: bar.startMs, hit: 'crash', level: 1 });
    }
    const at = (beats: number) => bar.startMs + beats * beat;
    const rootHz = hzOf(CHORD_ROOT[bar.chord] - 12);
    for (const b of feel.kick) events.push({ timeMs: at(b), hit: 'kick', level: soft });
    for (const b of feel.snare) events.push({ timeMs: at(b), hit: 'snare', level: soft });
    for (const b of feel.clap ?? []) events.push({ timeMs: at(b), hit: 'clap', level: 1 });
    if (feel.hat > 0) {
      for (let b = 0; b < 4; b += feel.hat) events.push({ timeMs: at(b), hit: 'hat', level: soft * (b % 1 === 0 ? 1 : 0.6) });
    }
    feel.bass.forEach((b, i) => {
      // Root, with a hop to the fifth on the off-beats in busy feels.
      const fifth = feel.bass.length > 4 && i % 2 === 1;
      events.push({ timeMs: at(b), hit: 'bass', hz: fifth ? rootHz * 1.5 : rootHz, level: soft });
    });
    if (kind === 'breakdown') {
      events.push({ timeMs: at(0), hit: 'hum', hz: laneHz(bar.chord, 1), level: 1 });
      events.push({ timeMs: at(0), hit: 'hum', hz: laneHz(bar.chord, 2), level: 0.8 });
    }
  });

  const last = song.bars[song.bars.length - 1];
  if (last && bachata) {
    // A bongó slap and a low root to land the last tap.
    events.push({ timeMs: last.startMs + beat * 4, hit: 'bongoHigh', level: 1.2 });
    events.push({ timeMs: last.startMs + beat * 4, hit: 'bass', hz: hzOf(CHORD_ROOT.Am - 12), level: 1 });
  } else if (last) {
    events.push({ timeMs: last.startMs, hit: 'crash', level: 1.2 });
    events.push({ timeMs: last.startMs, hit: 'kick', level: 1.2 });
  }
  return events.sort((a, b) => a.timeMs - b.timeMs);
}

/** The bongó's martillo, in eighths: high-low with the slap landing on four. */
const MARTILLO: readonly ('bongoHigh' | 'bongoLow')[] = [
  'bongoHigh',
  'bongoLow',
  'bongoHigh',
  'bongoLow',
  'bongoHigh',
  'bongoLow',
  'bongoHigh',
  'bongoLow'
];
/** Requinto arpeggio over the bar, an octave up: chord-tone lanes per eighth. */
const REQUINTO: readonly GigLane[] = [0, 1, 2, 1, 2, 1, 0, 1];

/**
 * One bar of bachata. `count` is the Profe alone: claps on one, two, three
 * and a long güira scrape on the tap. The band comes in on `basic`, the
 * requinto answers once the driver joins, and the serenade is the band
 * playing quietly under your guitar.
 */
function bachataBar(bar: GigBar, kind: BachataSectionKind, beat: number): BandEvent[] {
  const at = (beats: number) => bar.startMs + beats * beat;
  const events: BandEvent[] = [];
  if (kind === 'count') {
    for (const b of [0, 1, 2]) events.push({ timeMs: at(b), hit: 'clap', level: 0.7 });
    events.push({ timeMs: at(3), hit: 'guira', hz: 1, level: 1 });
    return events;
  }
  const soft = kind === 'serenade' ? 0.55 : 1;
  // Güira: a scrape on every eighth, the downbeats long and the offbeats quick.
  for (let i = 0; i < 8; i += 1) {
    events.push({ timeMs: at(i / 2), hit: 'guira', hz: i % 2 === 0 ? 1 : 0, level: soft * (i % 2 === 0 ? 0.9 : 0.55) });
  }
  MARTILLO.forEach((hit, i) => {
    // The slap on four is what the hip answers.
    const accent = i === 6 ? 1.25 : i % 2 === 0 ? 0.8 : 0.6;
    events.push({ timeMs: at(i / 2), hit, level: soft * accent });
  });
  // Bass walks the root with a push into the next bar.
  const root = hzOf(CHORD_ROOT[bar.chord] - 12);
  for (const [b, hz] of [
    [0, root],
    [1.5, root * 1.5],
    [2, root],
    [3.5, root * 1.5]
  ] as const) {
    events.push({ timeMs: at(b), hit: 'bass', hz, level: soft * 0.9 });
  }
  if (kind === 'together' || kind === 'flourish') {
    REQUINTO.forEach((lane, i) => {
      events.push({ timeMs: at(i / 2), hit: 'requinto', hz: laneHz(bar.chord, lane) * 2, level: i === 0 ? 0.42 : 0.3 });
    });
  }
  return events;
}
