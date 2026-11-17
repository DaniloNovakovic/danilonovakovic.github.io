import { describe, expect, it } from 'vitest';
import { BACHATA_LESSON_FOOTWORK, BACHATA_REST, bachataStepOf, createBachataLesson } from './lesson';
import { playNextNotePerfectly } from '../concertGig';

describe('bachata lesson', () => {
  it('dances the basic: step, close, step, tap, and back again', () => {
    const lesson = createBachataLesson();
    const firstEight = lesson.song.notes.slice(0, 8).map((note) => bachataStepOf(note.lane));
    expect(firstEight).toEqual(['left', 'left', 'left', 'tap', 'right', 'right', 'right', 'tap']);
    expect(BACHATA_LESSON_FOOTWORK.slice(0, 8)).toEqual([
      { offset: 0, stance: 'open' },
      { offset: 0, stance: 'together' },
      { offset: -1, stance: 'open' },
      { offset: -1, stance: 'tap-right' },
      { offset: 0, stance: 'open' },
      { offset: 0, stance: 'together' },
      { offset: 1, stance: 'open' },
      { offset: 1, stance: 'tap-left' }
    ]);
    // Every eight ends where it began, so the dancers never drift off their marks.
    expect(BACHATA_LESSON_FOOTWORK.at(-1)?.offset).toBe(BACHATA_REST.offset);
  });

  it('steadies the driver as you keep the count', () => {
    const lesson = createBachataLesson(0.3);
    while (lesson.nextPendingNote()) playNextNotePerfectly(lesson);
    lesson.finish();
    expect(lesson.hype).toBeGreaterThan(0.9);
    expect(lesson.grade).toBe('legendary');
  });

  it('never fails: letting it play out still ends the lesson', () => {
    const lesson = createBachataLesson();
    lesson.finish();
    expect(lesson.phase).toBe('finished');
    expect(lesson.grade).toBe('rough');
  });
});
