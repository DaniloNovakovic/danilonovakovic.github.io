/**
 * Concert songs as authored chart data. Pure: no audio, no timing source.
 *
 * Each bar is eight eighth-note slots. A slot is `.` (rest), a lane digit
 * `0`-`2`, or a two-lane chord: `x` = 0+1, `y` = 1+2, `z` = 0+2. Lanes are
 * chord tones of the bar's chord (root, third, fifth), so any hit lands in
 * key and the adapter can voice it without a separate melody track.
 */

export type GigLane = 0 | 1 | 2;

export type GigChord = 'Am' | 'F' | 'C' | 'G' | 'Dm';

/**
 * `riff` is Steve's phrase on its own; the show grows out of it. The kind
 * drives the backing band's feel and the coach's callouts.
 */
export type GigSectionKind = 'riff' | 'intro' | 'verse' | 'chorus' | 'breakdown' | 'finale';

export interface GigBarSpec {
  chord: GigChord;
  pattern: string;
}

export interface GigSectionSpec {
  kind: GigSectionKind;
  bars: readonly GigBarSpec[];
}

export interface GigSongSpec {
  id: string;
  bpm: number;
  /** Bars of drummer count-in before the first section. */
  countInBars: number;
  /** Beats the last chord rings before the song counts as over. */
  outroBeats: number;
  sections: readonly GigSectionSpec[];
}

export interface GigNote {
  /** Index into the song's note list. */
  id: number;
  timeMs: number;
  lane: GigLane;
  chord: GigChord;
  section: number;
  /** True for both halves of a two-lane chord. */
  chordHit: boolean;
}

export interface GigSection {
  index: number;
  kind: GigSectionKind;
  startMs: number;
  endMs: number;
  /** Notes in this section, by id range [firstNote, lastNote). */
  firstNote: number;
  lastNote: number;
}

export interface GigBar {
  startMs: number;
  chord: GigChord;
  section: number;
}

export interface GigSong {
  id: string;
  bpm: number;
  beatMs: number;
  barMs: number;
  /** Song time the first section starts (after the count-in). */
  startMs: number;
  /** Song time the song is over (last bar plus the outro ring). */
  endMs: number;
  notes: readonly GigNote[];
  sections: readonly GigSection[];
  bars: readonly GigBar[];
}

const SLOTS_PER_BAR = 8;
const CHORDS: Record<string, readonly GigLane[]> = { x: [0, 1], y: [1, 2], z: [0, 2] };

/** Expand a chart into timed notes, bars, and sections. */
export function compileGigSong(spec: GigSongSpec): GigSong {
  const beatMs = 60_000 / spec.bpm;
  const barMs = beatMs * 4;
  const slotMs = barMs / SLOTS_PER_BAR;
  const startMs = spec.countInBars * barMs;
  const notes: GigNote[] = [];
  const sections: GigSection[] = [];
  const bars: GigBar[] = [];
  let cursor = startMs;

  spec.sections.forEach((section, sectionIndex) => {
    const firstNote = notes.length;
    const sectionStart = cursor;
    for (const bar of section.bars) {
      if (bar.pattern.length !== SLOTS_PER_BAR) {
        throw new Error(`Bar "${bar.pattern}" in ${spec.id} needs ${SLOTS_PER_BAR} slots.`);
      }
      bars.push({ startMs: cursor, chord: bar.chord, section: sectionIndex });
      for (let slot = 0; slot < SLOTS_PER_BAR; slot += 1) {
        const lanes = lanesFor(bar.pattern[slot]!);
        for (const lane of lanes) {
          notes.push({
            id: notes.length,
            timeMs: Math.round(cursor + slot * slotMs),
            lane,
            chord: bar.chord,
            section: sectionIndex,
            chordHit: lanes.length > 1
          });
        }
      }
      cursor += barMs;
    }
    sections.push({
      index: sectionIndex,
      kind: section.kind,
      startMs: sectionStart,
      endMs: cursor,
      firstNote,
      lastNote: notes.length
    });
  });

  return {
    id: spec.id,
    bpm: spec.bpm,
    beatMs,
    barMs,
    startMs,
    endMs: cursor + spec.outroBeats * beatMs,
    notes,
    sections,
    bars
  };
}

function lanesFor(slot: string): readonly GigLane[] {
  if (slot === '.') return [];
  if (slot === '0' || slot === '1' || slot === '2') return [Number(slot) as GigLane];
  const chord = CHORDS[slot];
  if (!chord) throw new Error(`Unknown chart slot "${slot}".`);
  return chord;
}

/** Steve's phrase: seven notes, the seed of the whole song. */
const RIFF_A: GigBarSpec = { chord: 'Am', pattern: '0.1.2.1.' };
const RIFF_B: GigBarSpec = { chord: 'F', pattern: '2.1.0...' };
const BREATH: GigBarSpec = { chord: 'G', pattern: '........' };

/**
 * Forgiving Practice Riff: the phrase, a breath, then again. Practice ends as
 * soon as one pass lands well enough.
 */
export const PRACTICE_RIFF_SPEC: GigSongSpec = {
  id: 'practice-riff',
  bpm: 96,
  countInBars: 1,
  outroBeats: 2,
  sections: [
    { kind: 'riff', bars: [RIFF_A, RIFF_B, BREATH] },
    { kind: 'riff', bars: [RIFF_A, RIFF_B, BREATH] },
    { kind: 'riff', bars: [RIFF_A, RIFF_B, BREATH] }
  ]
};

/** "Still Here" by Steve & the Late Show, as played over the crossing. */
export const CROSSING_SHOW_SPEC: GigSongSpec = {
  id: 'still-here',
  bpm: 116,
  countInBars: 1,
  outroBeats: 4,
  sections: [
    {
      kind: 'intro',
      bars: [RIFF_A, RIFF_B, RIFF_A, { chord: 'G', pattern: '2.1.0.0.' }]
    },
    {
      kind: 'verse',
      bars: [
        { chord: 'Am', pattern: '0.0.1.2.' },
        { chord: 'F', pattern: '1.1.0...' },
        { chord: 'C', pattern: '0.1.2.1.' },
        { chord: 'G', pattern: '2...1...' },
        { chord: 'Am', pattern: '0.0.1.2.' },
        { chord: 'F', pattern: '1.1.0.1.' },
        { chord: 'C', pattern: '2.1.0.1.' },
        { chord: 'G', pattern: '2.2.1...' }
      ]
    },
    {
      kind: 'chorus',
      bars: [
        { chord: 'F', pattern: 'z...0.1.' },
        { chord: 'C', pattern: '2.1.2.1.' },
        { chord: 'G', pattern: 'z...1.2.' },
        { chord: 'Am', pattern: '1.0.1.2.' },
        { chord: 'F', pattern: 'z...0.1.' },
        { chord: 'C', pattern: '2.1.2.1.' },
        { chord: 'G', pattern: '0.1.2.0.' },
        { chord: 'Am', pattern: 'y...y...' }
      ]
    },
    {
      kind: 'breakdown',
      bars: [
        { chord: 'F', pattern: '0.......' },
        { chord: 'G', pattern: '1.......' },
        { chord: 'Am', pattern: '2.......' },
        { chord: 'G', pattern: '1...2...' }
      ]
    },
    {
      kind: 'finale',
      bars: [
        { chord: 'F', pattern: 'z.0.1.2.' },
        { chord: 'C', pattern: '21212...' },
        { chord: 'G', pattern: 'z.1.0.1.' },
        { chord: 'Am', pattern: '2.1.0121' },
        { chord: 'F', pattern: 'z.0.1.2.' },
        { chord: 'C', pattern: '21212...' },
        { chord: 'G', pattern: '0.1.2.1.' },
        { chord: 'C', pattern: 'z.......' }
      ]
    }
  ]
};
