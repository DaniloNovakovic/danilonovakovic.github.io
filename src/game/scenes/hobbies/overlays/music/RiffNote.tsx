import { MARGIN_RIFF } from './riff';
import '../shared/hobbyMotion.css';

interface RiffNoteProps {
  title: string;
  hint: string;
  progressLabel: string;
  doneLabel: string;
  progress: number;
  done: boolean;
}

function noteClass(index: number, progress: number, done: boolean): string {
  if (done || index < progress) return 'bg-[#1a1a1a] text-[#fbfbf9]';
  if (index === progress) return 'border-b-[3px] border-[#1a1a1a]';
  return 'opacity-55';
}

/** Taped sticky note with the margin riff; played notes are inked in as you go. */
export function RiffNote({ title, hint, progressLabel, doneLabel, progress, done }: RiffNoteProps) {
  return (
    <div className="hobby-wobble relative w-full max-w-[17rem] rotate-1 border-2 border-[#1a1a1a] bg-[#f4f1ea] px-3 pb-2 pt-3 shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
      <div className="hobby-hatch-light absolute -top-2 left-4 h-4 w-12 -rotate-3 border border-[#1a1a1a]/40 bg-[#fbfbf9]/80" />
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-black uppercase tracking-wider">{title}</p>
        <p className="font-mono text-[10px] opacity-60" aria-live="polite">
          {done ? doneLabel : progressLabel}
        </p>
      </div>
      <ol className="mt-1 flex gap-1 font-mono text-base font-black">
        {MARGIN_RIFF.map((stringNumber, index) => (
          <li key={index} className={`w-6 rounded-sm text-center ${noteClass(index, progress, done)}`}>
            {stringNumber}
          </li>
        ))}
      </ol>
      <p className="mt-1 text-[10px] italic opacity-60">{hint}</p>
    </div>
  );
}
