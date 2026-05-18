import type { ReactNode } from 'react';

export function ViewTab({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={[
        'flex h-9 items-center gap-2 border-2 px-3 text-xs font-black uppercase tracking-widest transition-colors',
        active
          ? 'border-[#1a1a1a] bg-[#1a1a1a] text-[#fbfbf9]'
          : 'border-transparent bg-transparent text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#fbfbf9]'
      ].join(' ')}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
