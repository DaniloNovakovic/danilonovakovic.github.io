import { useState } from 'react';

const ARROWS = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

export default function DancingMini() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerSeq, setPlayerSeq] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeArrow, setActiveArrow] = useState<string | null>(null);
  const [message, setMessage] = useState('Press Start to Dance!');

  const startGame = () => {
    setSequence([]);
    setPlayerSeq([]);
    setIsPlaying(true);
    setMessage('Watch the sequence...');
    nextRound([]);
  };

  const nextRound = (currentSeq: string[]) => {
    const nextArrow = ARROWS[Math.floor(Math.random() * ARROWS.length)];
    const newSeq = [...currentSeq, nextArrow];
    setSequence(newSeq);
    setPlayerSeq([]);
    playSequence(newSeq);
  };

  const playSequence = (seq: string[]) => {
    let i = 0;
    setMessage('Watch the sequence...');
    const interval = setInterval(() => {
      setActiveArrow(seq[i]);
      setTimeout(() => setActiveArrow(null), 400);
      i++;
      if (i >= seq.length) {
        clearInterval(interval);
        setTimeout(() => setMessage('Your turn!'), 500);
      }
    }, 800);
  };

  const handleArrowClick = (arrow: string) => {
    if (!isPlaying || message === 'Watch the sequence...') return;

    setActiveArrow(arrow);
    setTimeout(() => setActiveArrow(null), 200);

    const newPlayerSeq = [...playerSeq, arrow];
    setPlayerSeq(newPlayerSeq);

    // Check if correct so far
    const isCorrect = newPlayerSeq.every((val, index) => val === sequence[index]);

    if (!isCorrect) {
      setMessage(`Game Over! Score: ${sequence.length - 1}`);
      setIsPlaying(false);
    } else if (newPlayerSeq.length === sequence.length) {
      setMessage('Nice Moves! Next Round...');
      setTimeout(() => nextRound(sequence), 1000);
    }
  };

  const ArrowButton = ({ dir, label }: { dir: string, label: string }) => {
    const isActive = activeArrow === dir;
    return (
      <button 
        onClick={() => handleArrowClick(dir)}
        className={`w-16 h-16 border-4 border-[#1a1a1a] font-bold text-2xl flex justify-center items-center transition-colors ${isActive ? 'bg-[#1a1a1a] text-[#fbfbf9]' : 'bg-[#f4f1ea] hover:bg-[#e8e5df]'}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-[250px] border-4 border-[#1a1a1a] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] bg-[#fbfbf9] flex flex-col items-center justify-center relative">
        
        <div className="absolute top-4 font-bold text-lg">{message}</div>

        <div className="grid grid-cols-3 gap-2 mt-8">
          <div></div>
          <ArrowButton dir="UP" label="↑" />
          <div></div>
          <ArrowButton dir="LEFT" label="←" />
          <ArrowButton dir="DOWN" label="↓" />
          <ArrowButton dir="RIGHT" label="→" />
        </div>

        {!isPlaying && (
          <button onClick={startGame} className="absolute bottom-4 px-4 py-1 border-2 border-[#1a1a1a] font-bold hover:bg-[#e8e5df]">
            {sequence.length > 0 ? 'RESTART' : 'START'}
          </button>
        )}

      </div>
      <div className="mt-4 text-sm font-bold text-[#1a1a1a] opacity-60">
        Repeat the dance moves!
      </div>
    </div>
  );
}
