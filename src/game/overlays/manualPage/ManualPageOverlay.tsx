import { Button } from '@/shared/ui';
import { getMessages } from '@/shared/i18n';
import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import type { ManualPageOverlayParams } from './types';

function isManualPageOverlayParams(params: unknown): params is ManualPageOverlayParams {
  if (!params || typeof params !== 'object') return false;
  const candidate = params as Partial<Record<keyof ManualPageOverlayParams, unknown>>;
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.cluePanel === 'string' &&
    typeof candidate.marginNote === 'string'
  );
}

export default function ManualPageOverlay({
  params,
  close,
  titleId,
  descriptionId
}: OverlayControllerProps) {
  const messages = getMessages();
  const manualPage = isManualPageOverlayParams(params)
    ? params
    : {
        title: messages.manualPage.fallbackTitle,
        cluePanel: messages.manualPage.fallbackClue,
        marginNote: messages.manualPage.fallbackMarginNote
      };

  return (
    <OverlayDialogFrame
      title={manualPage.title}
      close={close}
      titleId={titleId}
      descriptionId={descriptionId}
    >
      <div className="grid gap-3 text-[#1a1a1a]">
        <section
          aria-label={messages.manualPage.clue}
          className="relative min-h-36 overflow-hidden rounded border border-[#1a1a1a]/35 bg-[#fffdf4] px-4 py-5"
        >
          <div className="absolute left-4 top-4 h-[calc(100%-2rem)] w-px bg-[#dd6b4d]/45" />
          <div className="absolute inset-x-4 top-1/2 border-t border-dashed border-[#1a1a1a]/20" />
          <p className="relative pl-5 text-sm font-bold leading-relaxed">{manualPage.cluePanel}</p>
        </section>

        <aside className="rounded border border-dashed border-[#1a1a1a]/40 bg-[#f4f1ea]/75 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">
            {messages.manualPage.marginNote}
          </p>
          <p className="text-xs font-bold uppercase tracking-wide">{manualPage.marginNote}</p>
        </aside>

        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={close}>
            {messages.manualPage.close}
          </Button>
        </div>
      </div>
    </OverlayDialogFrame>
  );
}
