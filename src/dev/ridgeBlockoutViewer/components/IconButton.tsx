import type { ReactNode } from 'react';

export function IconButton({
  ariaLabel,
  children,
  onClick
}: {
  ariaLabel: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="flex h-8 w-8 items-center justify-center border-2 border-[#1a1a1a] bg-[#fbfbf9] transition-colors hover:bg-[#1a1a1a] hover:text-[#fbfbf9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
