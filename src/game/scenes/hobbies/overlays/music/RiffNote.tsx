import { hobbyFocusRing } from '../shared/hobbyStyles';
import '../shared/hobbyMotion.css';

interface RiffNoteProps {
  title: string;
  figures: string;
  hint: string;
  progressLabel: string;
  doneLabel: string;
  nextLabel: string;
  rewarded: boolean;
  steps: readonly string[];
  progress: number;
  done: boolean;
  onNext: () => void;
}

function noteClass(index: number, progress: number, done: boolean): string {
  if (done || index < progress) return 'bg-[#1a1a1a] text-[#fbfbf9]';
  if (index === progress) return 'border-b-[3px] border-[#1a1a1a]';
  return 'opacity-55';
}

/** Taped sticky note. The campfire sketch is ink; the others are pencil, and pay nothing. */
export function RiffNote({
  title,
  figures,
  hint,
  progressLabel,
  doneLabel,
  nextLabel,
  rewarded,
  steps,
  progress,
  done,
  onNext
}: RiffNoteProps) {
  const paper = rewarded
    ? 'border-[#1a1a1a] bg-[#f4f1ea]'
    : 'border-dashed border-[#1a1a1a] bg-[#e6e2d8]';
  return (
    <div className={`hobby-wobble relative w-full max-w-[22rem] rotate-1 border-2 px-3 pb-2 pt-3 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] ${paper}`}>
      <div className="hobby-hatch-light absolute -top-2 left-4 h-4 w-12 -rotate-3 border border-[#1a1a1a]/40 bg-[#fbfbf9]/80" />
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onNext} aria-label={nextLabel} className={`text-left ${hobbyFocusRing}`}>
          <span className="block text-[11px] font-black uppercase tracking-wider">{title}</span>
          <span className="mt-0.5 block font-mono text-[10px] tracking-wide opacity-70">{figures}</span>
        </button>
        <p className="font-mono text-[10px] opacity-60" aria-live="polite">
          {done ? doneLabel : progressLabel}
        </p>
      </div>
      <ol className="mt-1 flex flex-wrap gap-1 font-mono text-base font-black">
        {steps.map((step, index) => (
          <li key={`${step}-${index}`} className={`min-w-6 rounded-sm px-1 text-center ${noteClass(index, progress, done)}`}>
            {step}
          </li>
        ))}
      </ol>
      <p className="mt-1 text-[10px] italic opacity-60">{hint}</p>
    </div>
  );
}
