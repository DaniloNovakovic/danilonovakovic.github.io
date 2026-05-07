import { Button } from '@/shared/ui';
import { getMessages } from '@/shared/i18n';
import { bridgeActions } from '@/game/bridge/store';
import { isSceneId } from '@/game/scenes/sceneIds';
import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import type { TrailCardOverlayParams } from './types';

function isTrailCardOverlayParams(params: unknown): params is TrailCardOverlayParams {
  if (!params || typeof params !== 'object') return false;
  const candidate = params as Partial<Record<keyof TrailCardOverlayParams, unknown>>;
  return (
    typeof candidate.title === 'string' &&
    typeof candidate.mood === 'string' &&
    typeof candidate.timeEstimate === 'string' &&
    typeof candidate.rewardPreview === 'string' &&
    (candidate.unavailableReason === undefined || typeof candidate.unavailableReason === 'string') &&
    (candidate.enterSceneId === undefined || (typeof candidate.enterSceneId === 'string' && isSceneId(candidate.enterSceneId)))
  );
}

export default function TrailCardOverlay({
  params,
  close,
  titleId,
  descriptionId
}: OverlayControllerProps) {
  const messages = getMessages();
  const trailCard = isTrailCardOverlayParams(params)
    ? params
    : {
        title: messages.trailCard.fallbackTitle,
        mood: '',
        timeEstimate: '',
        rewardPreview: '',
        unavailableReason: messages.trailCard.unavailableFallback
      };
  const enterSceneId = trailCard.enterSceneId;
  const canEnter = !trailCard.unavailableReason && enterSceneId !== undefined;
  const enterTrail = () => {
    if (!canEnter || !enterSceneId) return;
    bridgeActions.enterScene(enterSceneId);
  };

  return (
    <OverlayDialogFrame
      title={trailCard.title}
      close={close}
      titleId={titleId}
      descriptionId={descriptionId}
    >
      <div className="grid gap-3 text-[#1a1a1a] [overflow-wrap:anywhere]">
        <dl className="grid gap-2">
          <div className="rounded border border-[#1a1a1a]/30 bg-white/45 px-3 py-2">
            <dt className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">
              {messages.trailCard.mood}
            </dt>
            <dd className="text-sm font-bold leading-relaxed">{trailCard.mood}</dd>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded border border-[#1a1a1a]/30 bg-white/45 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">
                {messages.trailCard.time}
              </dt>
              <dd className="text-xs font-bold uppercase leading-relaxed tracking-wide">
                {trailCard.timeEstimate}
              </dd>
            </div>
            <div className="rounded border border-[#1a1a1a]/30 bg-white/45 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">
                {messages.trailCard.reward}
              </dt>
              <dd className="text-xs font-bold uppercase leading-relaxed tracking-wide">
                {trailCard.rewardPreview}
              </dd>
            </div>
          </div>
          {trailCard.unavailableReason && (
            <div className="rounded border border-dashed border-[#1a1a1a]/40 bg-[#f4f1ea]/75 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">
                {messages.trailCard.unavailable}
              </dt>
              <dd className="text-xs font-bold uppercase leading-relaxed tracking-wide">
                {trailCard.unavailableReason}
              </dd>
            </div>
          )}
        </dl>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={close}>
            {messages.trailCard.back}
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
            disabled={!canEnter}
            onClick={enterTrail}
          >
            {messages.trailCard.enter}
          </Button>
        </div>
      </div>
    </OverlayDialogFrame>
  );
}
