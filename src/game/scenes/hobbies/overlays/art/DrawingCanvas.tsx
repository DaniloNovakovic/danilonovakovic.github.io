import { useState } from 'react';
import { Pin, PinOff, Trash2 } from 'lucide-react';
import { bridgeActions, useBridgeState } from '@/game/bridge/store';
import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { useMessages } from '@/shared/i18n';
import { useOverlayKeys } from '@/shared/hooks/useOverlayKeys';
import { Button, Panel } from '@/shared/ui';
import { RewardSticker } from '../shared/RewardSticker';
import { hobbyBoardClass } from '../shared/hobbyStyles';
import { canvasHasInk, exportSignedDoodle } from './doodleExport';
import { ToolPicker } from './ToolPicker';
import { useDoodleCanvas } from './useDoodleCanvas';

export default function DrawingCanvas({ close, titleId, descriptionId }: OverlayControllerProps) {
  const messages = useMessages();
  const copy = messages.miniGames.drawing;
  const pinnedDoodle = useBridgeState().progress.streetDoodle;
  const {
    canvasRef,
    tool,
    setTool,
    keyboardCursor,
    clear,
    moveKeyboardCursor,
    toggleKeyboardPen,
    pointerHandlers
  } = useDoodleCanvas();
  const [pinStickerKey, setPinStickerKey] = useState(0);
  const [showEmptyNotice, setShowEmptyNotice] = useState(false);

  const moveCursor = (event: KeyboardEvent) => moveKeyboardCursor(event.key, event.shiftKey);
  useOverlayKeys({
    ArrowUp: moveCursor,
    ArrowDown: moveCursor,
    ArrowLeft: moveCursor,
    ArrowRight: moveCursor,
    ' ': toggleKeyboardPen,
    '1': () => setTool('thin'),
    '2': () => setTool('thick'),
    '3': () => setTool('eraser')
  });

  const pin = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas && canvasHasInk(canvas) ? exportSignedDoodle(canvas, copy.signature) : null;
    setShowEmptyNotice(!dataUrl);
    if (!dataUrl) return;
    bridgeActions.pinStreetDoodle(dataUrl);
    setPinStickerKey((key) => key + 1);
  };

  const unpin = () => {
    bridgeActions.pinStreetDoodle(null);
    setPinStickerKey(0);
  };

  return (
    <OverlayDialogFrame
      title={messages.catalog.hobbies.art.name}
      description={messages.catalog.hobbies.art.description}
      close={close}
      titleId={titleId}
      descriptionId={descriptionId}
    >
      <div className="flex w-full flex-col items-center gap-3">
        <ToolPicker tool={tool} onSelect={setTool} />

        <Panel border="thick" className={`${hobbyBoardClass} group h-[250px] p-0`}>
          <canvas
            ref={canvasRef}
            aria-label={copy.canvasLabel}
            className="h-full w-full cursor-crosshair touch-none"
            {...pointerHandlers}
          />
          {keyboardCursor ? (
            <div
              className={`pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#1a1a1a] ${keyboardCursor.penDown ? 'bg-[#1a1a1a]/30' : 'border-dashed'}`}
              style={{ left: keyboardCursor.point.x, top: keyboardCursor.point.y }}
            >
              <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1a1a1a]" />
            </div>
          ) : null}
          <CornerMarks />
          {pinStickerKey > 0 && pinnedDoodle ? (
            <RewardSticker
              key={pinStickerKey}
              icon="pin"
              title={copy.pinnedTitle}
              body={copy.pinnedBody}
              dismissLabel={messages.miniGames.sparePart.dismiss}
              onDismiss={() => setPinStickerKey(0)}
            />
          ) : null}
        </Panel>

        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#1a1a1a] opacity-60">{copy.instruction}</span>
            <span className="font-mono text-[10px] opacity-40">{copy.keyboardHint}</span>
            {showEmptyNotice ? (
              <span role="alert" className="text-xs font-black">
                {copy.emptyCanvas}
              </span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={clear} icon={<Trash2 size={14} />}>
              {copy.clear}
            </Button>
            <Button variant="primary" size="sm" onClick={pin} icon={<Pin size={14} />}>
              {copy.pin}
            </Button>
          </div>
        </div>

        {pinnedDoodle ? (
          <div className="flex w-full items-center gap-3 border-t-2 border-dashed border-[#1a1a1a]/40 pt-2">
            <span className="text-[11px] font-bold opacity-60">{copy.pinnedPreview}</span>
            <img src={pinnedDoodle} alt="" className="h-10 w-auto -rotate-2 border-2 border-[#1a1a1a] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]" />
            <Button variant="ghost" size="sm" onClick={unpin} icon={<PinOff size={14} />}>
              {copy.unpin}
            </Button>
          </div>
        ) : null}

        <p className="text-[11px] italic opacity-45">{copy.marginNote}</p>
      </div>
    </OverlayDialogFrame>
  );
}

function CornerMarks() {
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 h-4 w-4 border-b-2 border-r-2 border-[#1a1a1a] opacity-30" />
      <div className="pointer-events-none absolute right-0 top-0 h-4 w-4 border-b-2 border-l-2 border-[#1a1a1a] opacity-30" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-r-2 border-t-2 border-[#1a1a1a] opacity-30" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-l-2 border-t-2 border-[#1a1a1a] opacity-30" />
    </>
  );
}
