import { useState, useEffect } from 'react';
import { TEXTS } from '../config/content';

export default function GamesMini() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    let timer: any;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(10);
    setIsPlaying(true);
    moveTarget();
  };

  const moveTarget = () => {
    setTargetPos({
      x: Math.random() * 80 + 10, // 10% to 90%
      y: Math.random() * 70 + 10
    });
  };

  const hitTarget = () => {
    if (!isPlaying) return;
    setScore(s => s + 1);
    moveTarget();
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-[200px] border-4 border-[#1a1a1a] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] bg-[#fbfbf9] relative overflow-hidden flex flex-col items-center">
        
        <div className="w-full flex justify-between px-4 py-2 border-b-4 border-[#1a1a1a] font-bold text-lg">
          <span>{TEXTS.common.score} {score}</span>
          <span>{TEXTS.common.time} {timeLeft}s</span>
        </div>

        {!isPlaying && timeLeft === 10 && (
          <button onClick={startGame} className="m-auto px-6 py-3 bg-[#1a1a1a] text-[#fbfbf9] font-bold text-xl hover:scale-105 transition-transform">
            {TEXTS.miniGames.arcade.startLabel}
          </button>
        )}

        {!isPlaying && timeLeft === 0 && (
          <div className="m-auto flex flex-col items-center">
            <span className="font-bold text-2xl mb-2">{TEXTS.common.gameOver}</span>
            <button onClick={startGame} className="px-4 py-2 border-2 border-[#1a1a1a] hover:bg-[#e8e5df] font-bold transition-colors">
              {TEXTS.common.playAgain}
            </button>
          </div>
        )}

        {isPlaying && (
          <div 
            onClick={hitTarget}
            className="absolute w-12 h-12 rounded-full border-4 border-[#1a1a1a] bg-[#1a1a1a] flex justify-center items-center cursor-crosshair hover:bg-red-500 transition-colors"
            style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-4 h-4 rounded-full bg-[#fbfbf9]"></div>
          </div>
        )}

      </div>
      <div className="mt-4 text-sm font-bold text-[#1a1a1a] opacity-60">
        {TEXTS.miniGames.arcade.instruction}
      </div>
    </div>
  );
}

