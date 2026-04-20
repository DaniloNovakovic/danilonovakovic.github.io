import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { TEXTS } from '../config/content';
import { useOverlayKeys } from './overlays/useOverlayKeys';

const ARROWS = ['UP', 'RIGHT', 'DOWN', 'LEFT'] as const;

function pickRandomArrow(): (typeof ARROWS)[number] {
  return ARROWS[Math.floor(Math.random() * ARROWS.length)]!;
}

function ArrowButton({
  dir,
  label,
  activeArrow,
  onPress
}: {
  dir: string;
  label: string;
  activeArrow: string | null;
  onPress: (dir: string) => void;
}) {
  const isActive = activeArrow === dir;
  return (
    <button
      type="button"
      onClick={() => onPress(dir)}
      className={`w-16 h-16 border-4 border-[#1a1a1a] font-bold text-2xl flex justify-center items-center transition-colors ${isActive ? 'bg-[#1a1a1a] text-[#fbfbf9]' : 'bg-[#f4f1ea] hover:bg-[#e8e5df]'}`}
    >
      {label}
    </button>
  );
}

export default function DancingMini() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerSeq, setPlayerSeq] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [activeArrow, setActiveArrow] = useState<string | null>(null);
  const [message, setMessage] = useState(TEXTS.miniGames.dancing.startMessage);

  const sequenceRef = useRef<string[]>([]);
  const playerSeqRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const isWatchingRef = useRef(false);

  useLayoutEffect(() => { sequenceRef.current = sequence; }, [sequence]);
  useLayoutEffect(() => { playerSeqRef.current = playerSeq; }, [playerSeq]);
  useLayoutEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useLayoutEffect(() => { isWatchingRef.current = isWatching; }, [isWatching]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const playSequence = useCallback(
    (seq: string[]) => {
      clearTimers();
      let i = 0;
      setIsWatching(true);
      setMessage(TEXTS.miniGames.dancing.watchMessage);
      intervalRef.current = setInterval(() => {
        const idx = i;
        setActiveArrow(seq[idx] ?? null);
        const t1 = setTimeout(() => setActiveArrow(null), 400);
        timeoutsRef.current.push(t1);
        i++;
        if (i >= seq.length) {
          if (intervalRef.current != null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          const t2 = setTimeout(() => {
            setIsWatching(false);
            setMessage(TEXTS.miniGames.dancing.turnMessage);
          }, 500);
          timeoutsRef.current.push(t2);
        }
      }, 800);
    },
    [clearTimers]
  );

  const nextRound = useCallback(
    (currentSeq: string[]) => {
      const nextArrow = pickRandomArrow();
      const newSeq = [...currentSeq, nextArrow];
      setSequence(newSeq);
      setPlayerSeq([]);
      playSequence(newSeq);
    },
    [playSequence]
  );

  const startGame = () => {
    clearTimers();
    setSequence([]);
    setPlayerSeq([]);
    setIsPlaying(true);
    setIsWatching(true);
    setMessage(TEXTS.miniGames.dancing.watchMessage);
    nextRound([]);
  };

  const handleArrowClick = useCallback((arrow: string) => {
    if (!isPlayingRef.current || isWatchingRef.current) return;

    setActiveArrow(arrow);
    const tFlash = setTimeout(() => setActiveArrow(null), 200);
    timeoutsRef.current.push(tFlash);

    const seq = sequenceRef.current;
    const newPlayerSeq = [...playerSeqRef.current, arrow];
    setPlayerSeq(newPlayerSeq);

    const isCorrect = newPlayerSeq.every((val, index) => val === seq[index]);

    if (!isCorrect) {
      clearTimers();
      setMessage(`${TEXTS.common.gameOver} ${TEXTS.common.score} ${seq.length - 1}`);
      setIsPlaying(false);
      setIsWatching(false);
    } else if (newPlayerSeq.length === seq.length) {
      setMessage(TEXTS.miniGames.dancing.successMessage);
      const tNext = setTimeout(() => nextRound(seq), 1000);
      timeoutsRef.current.push(tNext);
    }
  }, [clearTimers, nextRound]);

  useOverlayKeys({
    ArrowUp: () => handleArrowClick('UP'),
    ArrowDown: () => handleArrowClick('DOWN'),
    ArrowLeft: () => handleArrowClick('LEFT'),
    ArrowRight: () => handleArrowClick('RIGHT')
  });

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-[250px] border-4 border-[#1a1a1a] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] bg-[#fbfbf9] flex flex-col items-center justify-center relative">
        <div className="absolute top-4 font-bold text-lg">{message}</div>

        <div className="grid grid-cols-3 gap-2 mt-8">
          <div></div>
          <ArrowButton dir="UP" label="↑" activeArrow={activeArrow} onPress={handleArrowClick} />
          <div></div>
          <ArrowButton dir="LEFT" label="←" activeArrow={activeArrow} onPress={handleArrowClick} />
          <ArrowButton dir="DOWN" label="↓" activeArrow={activeArrow} onPress={handleArrowClick} />
          <ArrowButton dir="RIGHT" label="→" activeArrow={activeArrow} onPress={handleArrowClick} />
        </div>

        {!isPlaying && (
          <button
            type="button"
            onClick={startGame}
            className="absolute bottom-4 px-4 py-1 border-2 border-[#1a1a1a] font-bold hover:bg-[#e8e5df]"
          >
            {sequence.length > 0 ? TEXTS.common.restart : TEXTS.common.start}
          </button>
        )}
      </div>
      <div className="mt-4 text-sm font-bold text-[#1a1a1a] opacity-60">
        {TEXTS.miniGames.dancing.instruction}
      </div>
    </div>
  );
}
