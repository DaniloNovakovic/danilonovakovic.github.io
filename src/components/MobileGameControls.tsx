import { useEffect } from 'react';
import { bridgeActions } from '../shared/bridge/store';

interface MobileGameControlsProps {
  visible: boolean;
}

export function MobileGameControls({ visible }: MobileGameControlsProps) {
  useEffect(() => {
    if (!visible) bridgeActions.resetTouch();
  }, [visible]);

  if (!visible) return null;

  const btn =
    'pointer-events-auto select-none touch-manipulation rounded-md border-2 border-[#1a1a1a] bg-[#fbfbf9]/95 px-6 py-3 text-sm font-bold text-[#1a1a1a] shadow-[4px_4px_0_0_#1a1a1a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all';

  return (
    <div className="flex w-full justify-center gap-6 px-4 py-2 md:hidden">
      <button
        type="button"
        className={btn}
        aria-label="Jump"
        onPointerDown={(e) => {
          e.preventDefault();
          bridgeActions.queueJump();
        }}
      >
        JUMP
      </button>
      <button
        type="button"
        className={btn}
        aria-label="Interact"
        onPointerDown={(e) => {
          e.preventDefault();
          bridgeActions.tapInteract();
        }}
      >
        INTERACT (E)
      </button>
    </div>
  );
}
