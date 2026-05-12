import type { HTMLAttributes } from 'react';
import { notebookShadowRoles } from '../../tokens';
import { cn } from '../../utils';

interface SceneHintSlipProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  detail?: string;
}

/**
 * Compact footer or edge hint for current controls/context.
 * Use for instructional text only; live score/timer state belongs in `SceneStatusSlip`.
 */
export function SceneHintSlip({
  label,
  detail,
  className,
  ...props
}: SceneHintSlipProps) {
  return (
    <div
      className={cn(
        'grid w-[min(38rem,100%)] gap-1 rounded-xl border-2 border-[#1a1a1a] bg-[#fbfbf9]/95 px-4 py-2 text-center font-mono uppercase tracking-widest text-[#5a554f]',
        notebookShadowRoles.control,
        className
      )}
      {...props}
    >
      <strong className="text-xs leading-tight">{label}</strong>
      {detail ? <span className="text-[10px] leading-tight text-[#5a554f]/80">{detail}</span> : null}
    </div>
  );
}
