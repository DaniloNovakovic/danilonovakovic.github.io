import { useCallback, useRef, useState } from 'react';
import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { useMessages } from '@/shared/i18n';
import { useOverlayKeys } from '@/shared/hooks/useOverlayKeys';
import { Panel } from '@/shared/ui';
import { SparePartSticker } from '../shared/SparePartSticker';
import { useSparePartReward } from '../shared/useSparePartReward';
import { hobbyBoardClass, hobbyFocusRing } from '../shared/hobbyStyles';
import { appendPick, MARGIN_RIFF, riffProgress, type StringNumber } from './riff';
import { RiffNote } from './RiffNote';
import { StringBoard } from './StringBoard';
import { GUITAR_STRINGS, useGuitarSynth, type GuitarStringSpec } from './useGuitarSynth';

const NO_PLUCKS: readonly number[] = GUITAR_STRINGS.map(() => 0);

export default function GuitarStrings({ close, titleId, descriptionId }: OverlayControllerProps) {
  const messages = useMessages();
  const copy = messages.miniGames.guitar;
  const { pluck, strumAll } = useGuitarSynth();
  const reward = useSparePartReward('copper-string');
  const claimReward = reward.claim;

  const [plucks, setPlucks] = useState(NO_PLUCKS);
  const [progress, setProgress] = useState(0);
  const [riffDone, setRiffDone] = useState(false);
  const historyRef = useRef<StringNumber[]>([]);

  const vibrate = useCallback((number: StringNumber | 'all') => {
    setPlucks((current) =>
      current.map((count, index) => (number === 'all' || GUITAR_STRINGS[index]?.number === number ? count + 1 : count))
    );
  }, []);

  const strum = useCallback(
    (spec: GuitarStringSpec) => {
      pluck(spec, 0.7);
      vibrate(spec.number);
    },
    [pluck, vibrate]
  );

  const pick = useCallback(
    (spec: GuitarStringSpec) => {
      pluck(spec);
      vibrate(spec.number);
      const history = appendPick(historyRef.current, spec.number);
      const matched = riffProgress(history);
      const completed = matched === MARGIN_RIFF.length;
      historyRef.current = completed ? [] : history;
      setProgress(completed ? 0 : matched);
      setRiffDone(completed);
      if (!completed) return;
      strumAll();
      vibrate('all');
      claimReward();
    },
    [claimReward, pluck, strumAll, vibrate]
  );

  useOverlayKeys(
    Object.fromEntries(GUITAR_STRINGS.map((spec) => [String(spec.number), () => pick(spec)]))
  );

  return (
    <OverlayDialogFrame
      title={messages.catalog.hobbies.music.name}
      description={messages.catalog.hobbies.music.description}
      close={close}
      titleId={titleId}
      descriptionId={descriptionId}
    >
      <div className="flex w-full flex-col items-center gap-3">
        <RiffNote
          title={copy.riffTitle}
          hint={copy.riffHint}
          progressLabel={copy.riffProgress(progress, MARGIN_RIFF.length)}
          doneLabel={copy.riffDone}
          progress={progress}
          done={riffDone}
        />

        <Panel border="thick" className={`${hobbyBoardClass} p-2`}>
          <StringBoard label={copy.stringsLabel} plucks={plucks} onPick={pick} onStrum={strum} />
          <SparePartSticker key={reward.stickerKey} partId="copper-string" outcome={reward.outcome} onDismiss={reward.dismiss} />
        </Panel>

        <div className="flex w-full justify-center gap-1.5">
          {GUITAR_STRINGS.map((spec) => (
            <button
              key={spec.number}
              type="button"
              onClick={() => pick(spec)}
              aria-label={copy.stringLabel(spec.note, String(spec.number))}
              className={`flex h-11 w-11 cursor-pointer flex-col items-center justify-center rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] leading-none shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${hobbyFocusRing}`}
            >
              <span className="font-mono text-sm font-black">{spec.number}</span>
              <span className="text-[9px] font-bold opacity-60">{spec.note}</span>
            </button>
          ))}
        </div>

        <p className="text-sm font-bold text-[#1a1a1a] opacity-60">{copy.instruction}</p>
        <p className="text-[11px] italic opacity-45">{copy.marginNote}</p>
      </div>
    </OverlayDialogFrame>
  );
}
