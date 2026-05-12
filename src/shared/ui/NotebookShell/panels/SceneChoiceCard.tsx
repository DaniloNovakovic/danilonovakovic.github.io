import type { ButtonHTMLAttributes } from 'react';
import { notebookShadowRoles, sketchFocusVisible } from '../../tokens';
import { cn } from '../../utils';
import { choiceToneClasses } from '../styles';
import type { NotebookChoiceTone } from '../types';

interface SceneChoiceCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  description: string;
  tone?: NotebookChoiceTone;
  selected?: boolean;
}

/**
 * Selectable paper option for upgrades, routes, or result choices.
 * Use inside `SceneChoiceGrid` when each option needs a title and short explanation.
 */
export function SceneChoiceCard({
  title,
  description,
  tone = 'ink',
  selected = false,
  className,
  ...props
}: SceneChoiceCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'grid min-h-32 cursor-pointer gap-3 rounded-md border-2 border-[#1a1a1a] bg-[#fbfbf9] p-4 text-center font-mono transition-colors',
        'hover:bg-[#f4f1ea] active:bg-[#e8e5df]',
        sketchFocusVisible,
        selected ? 'bg-[#f8f2d8] ring-2 ring-inset ring-[#1a1a1a]/75' : '',
        notebookShadowRoles.control,
        className
      )}
      {...props}
    >
      <strong className={cn('text-xl font-black leading-tight', choiceToneClasses[tone])}>
        {title}
      </strong>
      <span className="self-end text-sm font-bold leading-relaxed text-[#1a1a1a]">
        {description}
      </span>
    </button>
  );
}
