import { useState, useRef } from 'react';

const NOTES = [
  { note: 'E4', freq: 329.63 },
  { note: 'B3', freq: 246.94 },
  { note: 'G3', freq: 196.00 },
  { note: 'D3', freq: 146.83 },
  { note: 'A2', freq: 110.00 },
  { note: 'E2', freq: 82.41 }
];

export default function GuitarStrings() {
  const [activeString, setActiveString] = useState<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playNote = (index: number, freq: number) => {
    setActiveString(index);
    setTimeout(() => setActiveString(null), 150);

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle'; // Sounds a bit more plucked than sine
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-[200px] border-4 border-[#1a1a1a] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] bg-[#fbfbf9] p-4 flex flex-col justify-center gap-4 relative">
        {NOTES.map((n, i) => (
          <div 
            key={n.note} 
            className="w-full h-4 relative cursor-pointer group"
            onMouseEnter={() => playNote(i, n.freq)}
            onClick={() => playNote(i, n.freq)}
          >
            <div className={`absolute top-1/2 left-0 w-full h-[2px] bg-[#1a1a1a] transition-transform duration-100 ${activeString === i ? 'scale-y-300 translate-y-1' : ''}`}></div>
            <div className={`absolute -left-2 top-0 text-xs font-bold ${activeString === i ? 'text-black' : 'text-transparent group-hover:text-black'} transition-colors`}>{n.note}</div>
          </div>
        ))}
        
        {/* Decorative Guitar Hole */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-4 border-[#1a1a1a] opacity-20 pointer-events-none"></div>
      </div>
      <div className="mt-4 text-sm font-bold text-[#1a1a1a] opacity-60">
        Hover or tap the strings to play!
      </div>
    </div>
  );
}
