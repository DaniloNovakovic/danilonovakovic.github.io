import { describe, expect, it } from 'vitest';
import { ConcertGig, GIG_GOOD_MS, isGigLane, playNextNotePerfectly } from './gig';
import { compileGigSong, CROSSING_SHOW_SPEC, PRACTICE_RIFF_SPEC } from './song';

function playAll(gig: ConcertGig): void {
  while (gig.nextPendingNote()) playNextNotePerfectly(gig);
  gig.advance(gig.song.endMs + 1);
}

describe('compileGigSong', () => {
  it('times notes on eighth-note slots after the count-in', () => {
    const song = compileGigSong(PRACTICE_RIFF_SPEC);
    const beat = 60_000 / PRACTICE_RIFF_SPEC.bpm;
    expect(song.startMs).toBeCloseTo(beat * 4);
    // "0.1.2.1." then "2.1.0...": seven notes a pass, on the beat.
    const pass = song.notes.filter((note) => note.section === 0);
    expect(pass.map((note) => note.lane)).toEqual([0, 1, 2, 1, 2, 1, 0]);
    expect(pass[1]!.timeMs - pass[0]!.timeMs).toBe(Math.round(beat));
  });

  it('splits chord slots into one note per lane', () => {
    const song = compileGigSong(CROSSING_SHOW_SPEC);
    const chords = song.notes.filter((note) => note.chordHit);
    expect(chords.length).toBeGreaterThan(0);
    expect(chords.length % 2).toBe(0);
    expect(song.sections.map((section) => section.kind)).toEqual([
      'intro',
      'verse',
      'chorus',
      'breakdown',
      'finale'
    ]);
    // About a minute of music: long enough to feel like a show, not a chore.
    expect(song.endMs / 1000).toBeGreaterThan(55);
    expect(song.endMs / 1000).toBeLessThan(80);
  });
});

describe('ConcertGig show', () => {
  it('counts in, then judges perfect strums and builds combo and hype', () => {
    const gig = new ConcertGig({ mode: 'show' });
    gig.advance(100);
    expect(gig.phase).toBe('countIn');
    const first = gig.nextPendingNote()!;
    const result = gig.strum(first.lane, first.timeMs + 20);
    expect(result.kind).toBe('hit');
    expect(result.kind === 'hit' && result.hit.judgment).toBe('perfect');
    expect(gig.phase).toBe('playing');
    expect(gig.combo).toBe(1);
    expect(gig.hype).toBeGreaterThan(0.5);
  });

  it('grades late-but-close strums as good and far ones as stray', () => {
    const gig = new ConcertGig({ mode: 'show' });
    const first = gig.nextPendingNote()!;
    const good = gig.strum(first.lane, first.timeMs + 100);
    expect(good.kind === 'hit' && good.hit.judgment).toBe('good');
    const next = gig.nextPendingNote()!;
    // Wrong lane, nothing there: the crowd doesn't mind, but the combo breaks.
    const wrongLane = ((next.lane + 1) % 3) as 0 | 1 | 2;
    const hype = gig.hype;
    expect(gig.strum(wrongLane, next.timeMs).kind).toBe('stray');
    expect(gig.combo).toBe(0);
    expect(gig.hype).toBe(hype);
  });

  it('never rewards mashing every lane over playing the notes', () => {
    const gig = new ConcertGig({ mode: 'show' });
    for (let t = 0; t < gig.song.endMs; t += 40) {
      for (const lane of [0, 1, 2] as const) gig.strum(lane, t);
    }
    gig.advance(gig.song.endMs + 1);
    expect(gig.counts.miss).toBe(0);
    expect(gig.grade).toBe('rough');
    expect(gig.bestCombo).toBeLessThan(5);
  });

  it('marks notes missed once their window closes and drains hype', () => {
    const gig = new ConcertGig({ mode: 'show' });
    const first = gig.nextPendingNote()!;
    gig.advance(first.timeMs + GIG_GOOD_MS + 1);
    expect(gig.judgmentOf(first.id)).toBe('miss');
    expect(gig.hype).toBeLessThan(0.5);
    expect(gig.combo).toBe(0);
  });

  it('never fails: a silent show still finishes, graded rough', () => {
    const gig = new ConcertGig({ mode: 'show' });
    gig.advance(gig.song.endMs + 1);
    expect(gig.phase).toBe('finished');
    expect(gig.counts.miss).toBe(gig.song.notes.length);
    expect(gig.grade).toBe('rough');
    expect(gig.hype).toBe(0);
  });

  it('letting the band finish plays out the rest as misses and ends the show', () => {
    const gig = new ConcertGig({ mode: 'show' });
    playNextNotePerfectly(gig);
    gig.finish();
    expect(gig.phase).toBe('finished');
    expect(gig.counts.perfect).toBe(1);
    expect(gig.counts.miss).toBe(gig.song.notes.length - 1);
  });

  it('only accepts the three lanes from untrusted params', () => {
    expect([0, 1, 2].every(isGigLane)).toBe(true);
    expect([3, -1, 0.5, '1', undefined].some(isGigLane)).toBe(false);
  });

  it('a clean show is legendary with a full combo', () => {
    const gig = new ConcertGig({ mode: 'show' });
    playAll(gig);
    expect(gig.phase).toBe('finished');
    expect(gig.grade).toBe('legendary');
    expect(gig.bestCombo).toBe(gig.song.notes.length);
    expect(gig.multiplier).toBe(4);
    expect(gig.hype).toBe(1);
  });

  it('starts warmer when someone has the crowd clapping', () => {
    expect(new ConcertGig({ mode: 'show', startHype: 0.65 }).hype).toBe(0.65);
  });

  it('ignores strums after the show', () => {
    const gig = new ConcertGig({ mode: 'show' });
    gig.advance(gig.song.endMs + 1);
    expect(gig.strum(0).kind).toBe('ignored');
  });
});

describe('ConcertGig practice', () => {
  it('passes after the first pass that lands enough notes', () => {
    const gig = new ConcertGig({ mode: 'practice' });
    expect(gig.loopNeeded).toBe(5);
    while (gig.nextPendingNote()?.section === 0) playNextNotePerfectly(gig);
    expect(gig.phase).not.toBe('finished');
    gig.advance(gig.song.sections[0]!.endMs);
    expect(gig.phase).toBe('finished');
    expect(gig.passed).toBe(true);
  });

  it('loops on a weak pass, then lets you through after the last try', () => {
    const gig = new ConcertGig({ mode: 'practice' });
    gig.advance(gig.song.sections[0]!.endMs + 1);
    expect(gig.phase).toBe('playing');
    expect(gig.loop).toBe(1);
    gig.advance(gig.song.endMs);
    expect(gig.phase).toBe('finished');
    expect(gig.passed).toBe(false);
  });
});
