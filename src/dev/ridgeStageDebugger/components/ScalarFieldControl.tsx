import { useId } from 'react';

export function ScalarFieldControl({
  inputMax,
  inputMin,
  label,
  max,
  min,
  onChange,
  step = 1,
  value
}: {
  inputMax?: number;
  inputMin?: number;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  const numberMin = inputMin ?? min;
  const numberMax = inputMax ?? max;
  const inputId = useId();

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="font-mono text-[10px] font-black uppercase tracking-widest text-[#5a554f]" htmlFor={inputId}>
          {label}
        </label>
        <div className="flex items-center gap-1">
          <StepButton
            ariaLabel={`Decrease ${label}`}
            onClick={() => onChange(clamp(value - step, numberMin, numberMax))}
          >
            -
          </StepButton>
          <input
            className="h-8 w-20 border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2 text-right font-mono text-xs font-black"
            id={inputId}
            max={numberMax}
            min={numberMin}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) onChange(clamp(next, numberMin, numberMax));
            }}
            step={step}
            type="number"
            value={Number.isFinite(value) ? value : 0}
          />
          <StepButton
            ariaLabel={`Increase ${label}`}
            onClick={() => onChange(clamp(value + step, numberMin, numberMax))}
          >
            +
          </StepButton>
        </div>
      </div>
      <input
        aria-label={`${label} slider`}
        className="h-2 w-full accent-[#1a1a1a]"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={clamp(value, min, max)}
      />
    </div>
  );
}

function StepButton({
  ariaLabel,
  children,
  onClick
}: {
  ariaLabel: string;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="flex h-8 w-8 items-center justify-center border-2 border-[#1a1a1a] bg-[#fbfbf9] text-xs font-black transition-colors hover:bg-[#1a1a1a] hover:text-[#fbfbf9]"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
