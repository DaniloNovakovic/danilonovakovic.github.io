/** A hand-ruled bar that fills as a mini-game warms up (the crowd, the driver's nerve, a cat's curiosity). */
export function WarmthMeter({ value, label }: { value: number; label: string }) {
  const percent = Math.round(value * 100);
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="flex items-center gap-1.5 rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-1.5 py-1 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
    >
      <span className="text-[10px] font-black uppercase tracking-wider text-[#1a1a1a]">{label}</span>
      <span className="relative h-2.5 w-20 overflow-hidden rounded-sm border-2 border-[#1a1a1a] sm:w-28">
        <span
          className="absolute inset-y-0 left-0 bg-[#1a1a1a] transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </span>
    </div>
  );
}
