import type { ReactNode } from 'react';
import { useMessages } from '@/shared/i18n';
import { hobbyFocusRing } from '../shared/hobbyStyles';
import type { DoodleTool } from './useDoodleCanvas';

const TOOL_ORDER: readonly DoodleTool[] = ['thin', 'thick', 'eraser'];

const TOOL_GLYPHS: Record<DoodleTool, ReactNode> = {
  thin: <path d="M4 16 C9 6 15 18 20 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />,
  thick: <path d="M4 16 C9 6 15 18 20 8" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />,
  eraser: (
    <>
      <rect x="5" y="7" width="14" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(-20 12 12)" />
      <path d="M6 14 L12 18" stroke="currentColor" strokeWidth="1.2" transform="rotate(-20 12 12)" />
    </>
  )
};

/** Paper tab row for pen / marker / eraser (keys 1-3). */
export function ToolPicker({ tool, onSelect }: { tool: DoodleTool; onSelect: (tool: DoodleTool) => void }) {
  const copy = useMessages().miniGames.drawing;
  return (
    <div role="radiogroup" aria-label={copy.toolGroupLabel} className="flex gap-2 self-start">
      {TOOL_ORDER.map((id, index) => {
        const selected = id === tool;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(id)}
            className={`flex cursor-pointer items-center gap-1 rounded border-2 border-[#1a1a1a] px-2 py-1 text-xs font-bold ${selected ? 'bg-[#1a1a1a] text-[#fbfbf9]' : 'bg-[#fbfbf9] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]'} ${hobbyFocusRing}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              {TOOL_GLYPHS[id]}
            </svg>
            {copy.tools[id]}
            <span className="font-mono text-[9px] opacity-60">{index + 1}</span>
          </button>
        );
      })}
    </div>
  );
}
