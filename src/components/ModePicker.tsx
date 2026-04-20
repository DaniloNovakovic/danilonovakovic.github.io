import { useEffect, useState } from 'react';
import { Gamepad2, BookOpen } from 'lucide-react';

export type AppMode = 'interactive' | 'static';

interface ModePickerProps {
  onChoose: (mode: AppMode) => void;
}

function useIsTouchLike(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(hover: none) and (pointer: coarse)');
    const update = () => setIsTouch(mql.matches);
    update();
    mql.addEventListener?.('change', update);
    return () => mql.removeEventListener?.('change', update);
  }, []);

  return isTouch;
}

interface ChoiceCardProps {
  title: string;
  blurb: string;
  icon: React.ReactNode;
  recommended: boolean;
  cta: string;
  onClick: () => void;
}

function ChoiceCard({ title, blurb, icon, recommended, cta, onClick }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border-4 border-[#1a1a1a] bg-[#fbfbf9] p-6 text-left shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[10px_10px_0px_0px_rgba(26,26,26,1)] focus:outline-none focus-visible:-translate-x-0.5 focus-visible:-translate-y-0.5 focus-visible:shadow-[10px_10px_0px_0px_rgba(26,26,26,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] sm:p-8"
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border-2 border-[#1a1a1a] bg-yellow-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
          Recommended
        </span>
      )}
      <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-[#1a1a1a] bg-[#f4f1ea] text-[#1a1a1a] sm:h-20 sm:w-20">
        {icon}
      </div>
      <h2 className="text-center text-2xl font-bold text-[#1a1a1a] sm:text-3xl">{title}</h2>
      <p className="text-center text-sm leading-relaxed text-[#1a1a1a]/80 sm:text-base">{blurb}</p>
      <span className="mt-2 inline-block border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-[#fbfbf9] transition-colors group-hover:bg-[#fbfbf9] group-hover:text-[#1a1a1a]">
        {cta}
      </span>
    </button>
  );
}

export default function ModePicker({ onChoose }: ModePickerProps) {
  const isTouch = useIsTouchLike();

  return (
    <div
      className="relative flex min-h-[100dvh] min-h-dvh w-full flex-col items-center justify-center overflow-x-hidden bg-[#f4f1ea] px-4 py-[max(1.5rem,env(safe-area-inset-top,0px))]"
      style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-[0.05]" />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8">
        <header className="flex flex-col items-center gap-2 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#1a1a1a]/60">
            Danilo Novakovic — Portfolio
          </p>
          <h1 className="text-4xl font-bold text-[#1a1a1a] sm:text-5xl">Pick your path</h1>
          <p className="max-w-md text-sm text-[#1a1a1a]/80 sm:text-base">
            Two ways to explore: walk around a sketchbook city, or flip through a quiet paper version.
          </p>
        </header>

        <div className="grid w-full grid-cols-1 place-items-center gap-8 pt-2 sm:grid-cols-2 sm:gap-6">
          <ChoiceCard
            title="Interactive"
            blurb="Walk a hand-drawn street, peek into buildings, play little mini-games. Works best with a keyboard."
            icon={<Gamepad2 className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={2} aria-hidden />}
            recommended={!isTouch}
            cta="Start walking"
            onClick={() => onChoose('interactive')}
          />
          <ChoiceCard
            title="Static"
            blurb="A calm, scrollable version of the portfolio. Fast to load, easy to read, great on phones."
            icon={<BookOpen className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={2} aria-hidden />}
            recommended={isTouch}
            cta="Read the page"
            onClick={() => onChoose('static')}
          />
        </div>

        <p className="max-w-md text-center text-xs text-[#1a1a1a]/60">
          You can switch between the two at any time.
        </p>
      </div>
    </div>
  );
}
