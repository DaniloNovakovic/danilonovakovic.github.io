import { useCallback, useEffect, useRef, useState } from 'react';
import { useHobbyAudio } from '../shared/useHobbyAudio';
import {
  BEAT_SECONDS,
  COUNT_IN_BEATS,
  demoLengthBeats,
  isRewardClear,
  judgeMove,
  pickMove,
  type DanceInputResult,
  type DanceMove
} from './danceRound';
import { playMissStep, playMoveStep, playRoundCleared, scheduleDemoAudio } from './danceSound';
import type { DancerPose } from './StickDancer';

export type DancePhase = 'idle' | 'demo' | 'input' | 'cleared' | 'over';

export interface DanceState {
  phase: DancePhase;
  sequence: readonly DanceMove[];
  inputIndex: number;
  /** Highest round cleared this session. */
  best: number;
  /** Demo beat counter (count-in beats first), or null outside the demo. */
  beat: number | null;
  pose: DancerPose;
  activeMove: DanceMove | null;
}

const BEAT_MS = BEAT_SECONDS * 1000;
const DEMO_LEAD_SECONDS = 0.15;
const MOVE_HOLD_MS = 380;
const INPUT_FLASH_MS = 220;
const CHEER_DELAY_MS = 300;
const NEXT_ROUND_DELAY_MS = 1200;

const INITIAL_STATE: DanceState = {
  phase: 'idle',
  sequence: [],
  inputIndex: 0,
  best: 0,
  beat: null,
  pose: 'idle',
  activeMove: null
};

/**
 * Dance memory game loop. Metronome and move sounds are scheduled on the audio
 * clock; the matching dancer poses use timeouts against the same start offset
 * so the game stays fully playable while muted.
 */
export function useDanceGame(onRewardClear: () => void) {
  const getAudio = useHobbyAudio();
  const [state, setState] = useState(INITIAL_STATE);
  const stateRef = useRef(INITIAL_STATE);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const commit = useCallback((patch: Partial<DanceState>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setState(stateRef.current);
  }, []);

  const later = useCallback((ms: number, run: () => void) => {
    timersRef.current.push(setTimeout(run, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(function clearDanceTimersOnUnmount() {
    return clearTimers;
  }, [clearTimers]);

  const playRound = useCallback(
    (sequence: readonly DanceMove[]) => {
      clearTimers();
      commit({ phase: 'demo', sequence, inputIndex: 0, beat: null, pose: 'idle', activeMove: null });
      const audio = getAudio();
      if (audio) scheduleDemoAudio(audio, sequence, audio.currentTime + DEMO_LEAD_SECONDS);
      const leadMs = DEMO_LEAD_SECONDS * 1000;
      const beats = demoLengthBeats(sequence.length);
      for (let beat = 0; beat < beats; beat++) {
        const move = sequence[beat - COUNT_IN_BEATS] ?? null;
        const at = leadMs + beat * BEAT_MS;
        later(at, () => commit({ beat, activeMove: move, pose: move ?? 'idle' }));
        if (move) later(at + MOVE_HOLD_MS, () => commit({ activeMove: null, pose: 'idle' }));
      }
      later(leadMs + beats * BEAT_MS, () => commit({ phase: 'input', beat: null }));
    },
    [clearTimers, commit, getAudio, later]
  );

  const resolvers: Record<DanceInputResult, (current: DanceState) => void> = {
    wrong: () => {
      clearTimers();
      commit({ phase: 'over', pose: 'slump', activeMove: null });
      const audio = getAudio();
      if (audio) playMissStep(audio);
    },
    continue: (current) => commit({ inputIndex: current.inputIndex + 1 }),
    cleared: (current) => {
      const round = current.sequence.length;
      commit({ phase: 'cleared', best: Math.max(current.best, round) });
      const audio = getAudio();
      if (audio) playRoundCleared(audio);
      if (isRewardClear(round)) onRewardClear();
      later(CHEER_DELAY_MS, () => commit({ pose: 'cheer' }));
      later(NEXT_ROUND_DELAY_MS, () => playRound([...current.sequence, pickMove()]));
    }
  };

  const press = (move: DanceMove) => {
    const current = stateRef.current;
    if (current.phase === 'demo') return;
    const audio = getAudio();
    if (audio) playMoveStep(audio, move);
    commit({ pose: move, activeMove: move });
    later(INPUT_FLASH_MS, () => {
      if (stateRef.current.activeMove === move) commit({ activeMove: null, pose: 'idle' });
    });
    if (current.phase !== 'input') return;
    resolvers[judgeMove(current.sequence, current.inputIndex, move)](current);
  };

  const start = () => {
    const phase = stateRef.current.phase;
    if (phase === 'idle' || phase === 'over') playRound([pickMove()]);
  };

  return { state, press, start };
}
