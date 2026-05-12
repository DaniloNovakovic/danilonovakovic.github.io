import type { HTMLAttributes } from 'react';
import { cn } from '../../utils';

export interface ControlMatDragIndicatorState {
  anchorX: number;
  anchorY: number;
  currentX: number;
  currentY: number;
}

interface ControlMatDragIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  maxDistance?: number;
  state: ControlMatDragIndicatorState | null;
}

/**
 * Visual-only drag affordance for shell-level control mats.
 * The owning scene still receives gameplay input through its normal bridge.
 */
export function ControlMatDragIndicator({
  className,
  maxDistance = 44,
  state,
  ...props
}: ControlMatDragIndicatorProps) {
  if (!state) return null;

  const deltaX = state.currentX - state.anchorX;
  const deltaY = state.currentY - state.anchorY;
  const distance = Math.hypot(deltaX, deltaY);
  const scale = distance > maxDistance ? maxDistance / distance : 1;
  const knobX = state.anchorX + deltaX * scale;
  const knobY = state.anchorY + deltaY * scale;
  const lineLength = distance * scale;
  const angle = Math.atan2(deltaY, deltaX);

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 z-30', className)}
      {...props}
      data-anchor-x={Math.round(state.anchorX)}
      data-anchor-y={Math.round(state.anchorY)}
      data-current-x={Math.round(state.currentX)}
      data-current-y={Math.round(state.currentY)}
    >
      <div
        className="absolute h-[68px] w-[68px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#1a1a1a]/70 bg-[#fbfbf9]/70 shadow-[5px_5px_0px_0px_rgba(26,26,26,0.18)]"
        style={{ left: state.anchorX, top: state.anchorY }}
      />
      <div
        className="absolute left-0 top-0 h-1 origin-left rounded-full bg-[#1a1a1a]/55"
        style={{
          transform: `translate(${state.anchorX}px, ${state.anchorY}px) rotate(${angle}rad)`,
          width: lineLength
        }}
      />
      <div
        className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1a1a1a]/75 shadow-[3px_3px_0px_0px_rgba(26,26,26,0.12)]"
        style={{ left: knobX, top: knobY }}
      />
    </div>
  );
}
