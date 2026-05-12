import type { HTMLAttributes } from 'react';
import { notebookShadowRoles } from '../../tokens';
import { cn } from '../../utils';

interface SceneStatusSlipProps extends HTMLAttributes<HTMLDivElement> {
  metric: string;
  label: string;
  detail?: string;
  meterValue?: number;
  variant?: 'bar' | 'chip' | 'footer';
}

/**
 * Compact live status surface for timer, score, phase, or meter state.
 * Use as the scene's primary live-state readout; keep hint text in `SceneHintSlip`.
 */
export function SceneStatusSlip({
  metric,
  label,
  detail,
  meterValue = 0,
  variant = 'bar',
  className,
  ...props
}: SceneStatusSlipProps) {
  const meterWidth = `${Math.max(0, Math.min(100, meterValue))}%`;
  return (
    <div
      className={cn(
        'grid items-center gap-2 border-2 border-[#1a1a1a] bg-[#fbfbf9]/90 px-3 py-2 font-mono uppercase tracking-widest text-[#1a1a1a]',
        notebookShadowRoles.control,
        variant === 'chip'
          ? 'w-fit min-w-32 rounded-md text-left text-xs'
          : 'w-[min(38rem,100%)] grid-cols-[auto_minmax(0,1fr)_auto] rounded-xl text-center text-xs',
        className
      )}
      {...props}
    >
      <strong className="text-xl leading-none">{metric}</strong>
      <span className="min-w-0 truncate font-bold text-[#5a554f]">{label}</span>
      <span
        aria-label={`Meter ${Math.round(Math.max(0, Math.min(100, meterValue)))} percent`}
        className="h-3 w-20 border-2 border-[#1a1a1a] bg-[#fbfbf9] p-0.5"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.max(0, Math.min(100, meterValue)))}
      >
        <span className="block h-full bg-[#1a1a1a]/75" style={{ width: meterWidth }} />
      </span>
      {detail ? <span className="col-span-full text-[10px] text-[#5a554f]">{detail}</span> : null}
    </div>
  );
}
