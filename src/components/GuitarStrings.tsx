import { useState, useRef, useEffect, useCallback } from 'react';
import { TEXTS } from '../config/content';
import { useOverlayKeys } from './overlays/useOverlayKeys';

const NOTES = [
  { note: 'E4', freq: 329.63, key: '1' },
  { note: 'B3', freq: 246.94, key: '2' },
  { note: 'G3', freq: 196.0, key: '3' },
  { note: 'D3', freq: 146.83, key: '4' },
  { note: 'A2', freq: 110.0, key: '5' },
  { note: 'E2', freq: 82.41, key: '6' }
];

export default function GuitarStrings() {
  const [activeString, setActiveString] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeStringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearActiveStringTimer = useCallback(() => {
    if (activeStringTimeoutRef.current != null) {
      clearTimeout(activeStringTimeoutRef.current);
      activeStringTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => clearActiveStringTimer(), [clearActiveStringTimer]);

  const playNote = useCallback((index: number, freq: number) => {
    clearActiveStringTimer();
    setActiveString(index);
    activeStringTimeoutRef.current = setTimeout(() => {
      activeStringTimeoutRef.current = null;
      setActiveString(null);
    }, 150);

    if (!audioCtxRef.current) {
      type WindowWithWebKitAudio = Window & { webkitAudioContext?: typeof AudioContext };
      const w = window as WindowWithWebKitAudio;
      const AudioCtx = window.AudioContext ?? w.webkitAudioContext;
      if (!AudioCtx) return;
      audioCtxRef.current = new AudioCtx();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') void ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  }, [clearActiveStringTimer]);

  useOverlayKeys(
    Object.fromEntries(
      NOTES.map((n, i) => [n.key, () => playNote(i, n.freq)])
    )
  );

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-[200px] border-4 border-[#1a1a1a] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] bg-[#fbfbf9] p-4 flex flex-col justify-center gap-4 relative">
        {NOTES.map((n, i) => (
          <div
            key={n.note}
            className="w-full h-4 relative cursor-pointer group outline-none"
            onMouseEnter={() => playNote(i, n.freq)}
            onClick={() => playNote(i, n.freq)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && playNote(i, n.freq)}
            tabIndex={0}
            role="button"
            aria-label={`String ${n.note} (Press ${n.key})`}
          >
            <div
              className={`absolute top-1/2 left-0 w-full h-[2px] bg-[#1a1a1a] transition-transform duration-100 ${activeString === i ? 'scale-y-300 translate-y-1' : ''} group-focus:bg-blue-500`}
            ></div>
            <div
              className={`absolute -left-2 top-0 text-xs font-bold ${activeString === i ? 'text-black' : 'text-transparent group-hover:text-black group-focus:text-black'} transition-colors`}
            >
              {n.note}
            </div>
            <div className="absolute -right-2 top-0 text-[10px] font-mono opacity-30 group-hover:opacity-100 group-focus:opacity-100">
              [{n.key}]
            </div>
          </div>
        ))}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-4 border-[#1a1a1a] opacity-20 pointer-events-none"></div>
      </div>
      <div className="mt-4 text-sm font-bold text-[#1a1a1a] opacity-60">
        {TEXTS.miniGames.guitar.instruction}
      </div>
    </div>
  );
}
