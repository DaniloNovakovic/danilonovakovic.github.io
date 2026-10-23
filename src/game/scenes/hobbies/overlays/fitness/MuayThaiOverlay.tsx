import { useCallback, useRef, useState, type PointerEvent } from 'react';
import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { useMessages } from '@/shared/i18n';
import { useOverlayKeys } from '@/shared/hooks/useOverlayKeys';
import { Panel } from '@/shared/ui';
import { SparePartSticker } from '../shared/SparePartSticker';
import { useHobbyAudio } from '../shared/useHobbyAudio';
import { useSparePartReward } from '../shared/useSparePartReward';
import { hobbyBoardClass, hobbyFocusRing } from '../shared/hobbyStyles';
import { HeavyBag } from './HeavyBag';
import { ComboTracker, TimingBar } from './StrikeHud';
import {
  COMBO_LENGTH,
  INITIAL_COMBO,
  resolveStrike,
  strikeZone,
  sweepPeriodMs,
  type StrikeResult
} from './strikeCombo';
import { playRoundBell, playStrikeSound } from './strikeSound';
import { useSweepMarker } from './useSweepMarker';
import '../shared/hobbyMotion.css';

const STRIKE_COOLDOWN_MS = 140;

interface StrikeFx extends StrikeResult {
  id: number;
}

export default function MuayThaiOverlay({ close, titleId, descriptionId }: OverlayControllerProps) {
  const messages = useMessages();
  const copy = messages.miniGames.muayThai;
  const getAudio = useHobbyAudio();
  const reward = useSparePartReward('battery-cell');
  const claimReward = reward.claim;
  const { markerRef, readPosition, restart } = useSweepMarker(sweepPeriodMs(0));

  const [combo, setCombo] = useState(INITIAL_COMBO);
  const [fx, setFx] = useState<StrikeFx | null>(null);
  const comboRef = useRef(INITIAL_COMBO);
  const lastStrikeAtRef = useRef(-Infinity);
  const fxIdRef = useRef(0);

  const strike = useCallback(() => {
    const now = performance.now();
    if (now - lastStrikeAtRef.current < STRIKE_COOLDOWN_MS) return;
    lastStrikeAtRef.current = now;

    const result = resolveStrike(comboRef.current, readPosition());
    comboRef.current = result.state;
    setCombo(result.state);
    restart(sweepPeriodMs(result.state.step));
    fxIdRef.current += 1;
    setFx({ ...result, id: fxIdRef.current });

    const audio = getAudio();
    if (audio) playStrikeSound(audio, result.grade);
    if (result.completed) {
      if (audio) playRoundBell(audio);
      claimReward();
    }
  }, [claimReward, getAudio, readPosition, restart]);

  const strikeFromPointer = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    strike();
  };

  useOverlayKeys({
    ' ': (event) => {
      if (!event.repeat) strike();
    },
    Enter: (event) => {
      if (!event.repeat) strike();
    }
  });

  return (
    <OverlayDialogFrame
      title={messages.catalog.hobbies.fitness.name}
      description={messages.catalog.hobbies.fitness.description}
      close={close}
      titleId={titleId}
      descriptionId={descriptionId}
    >
      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex w-full items-center justify-between gap-2 text-xs font-black uppercase tracking-wider">
          <span aria-live="polite">{copy.comboLabel(combo.step, COMBO_LENGTH)}</span>
          <span className="opacity-60">{copy.best(combo.best)}</span>
        </div>
        <ComboTracker step={combo.step} names={copy.strikes} />

        <div className="relative w-full">
          <div className="flex w-full flex-col items-center gap-3">
            <Panel border="thick" className={`${hobbyBoardClass} flex h-[230px] items-start justify-center p-2`}>
              <div className="hobby-hatch-light absolute inset-x-0 bottom-0 h-8 border-t-2 border-[#1a1a1a]" />
              <HeavyBag print={copy.bagPrint} hitId={fx?.id ?? 0} grade={fx?.grade ?? null} />
              {fx ? <StrikeStamp key={fx.id} fx={fx} /> : null}
            </Panel>
            <div className="w-full">
              <TimingBar label={copy.timingBar} zone={strikeZone(combo.step)} markerRef={markerRef} />
            </div>
          </div>
          {/* Transparent pad over the page around the bag and the timing bar. */}
          <button
            type="button"
            aria-label={copy.heavyBag}
            onPointerDown={strikeFromPointer}
            className={`absolute inset-0 z-10 cursor-pointer touch-manipulation select-none rounded-lg ${hobbyFocusRing}`}
          />
          <div className="pointer-events-none absolute inset-0 z-20">
            <SparePartSticker key={reward.stickerKey} partId="battery-cell" outcome={reward.outcome} onDismiss={reward.dismiss} />
          </div>
        </div>

        <p className="text-sm font-bold text-[#1a1a1a] opacity-60">{copy.instruction}</p>
        <p className="text-[11px] italic opacity-45">{copy.marginNote}</p>
      </div>
    </OverlayDialogFrame>
  );
}

function StrikeStamp({ fx }: { fx: StrikeFx }) {
  const copy = useMessages().miniGames.muayThai;
  const headline = fx.completed ? copy.fullCombo : copy.grades[fx.grade];
  const isMiss = fx.grade === 'miss';
  return (
    <div
      aria-live="polite"
      className="hobby-stamp-pop pointer-events-none absolute left-3 top-6 -rotate-6 text-left sm:left-6"
    >
      <p
        className={`inline-block border-[3px] border-[#1a1a1a] px-2 py-0.5 text-lg font-black tracking-widest ${isMiss ? 'hobby-shake border-dashed bg-[#fbfbf9]' : 'bg-[#1a1a1a] text-[#fbfbf9]'}`}
      >
        {headline}
      </p>
      {isMiss ? null : <p className="mt-1 text-2xl font-black tracking-wider">{copy.strikes[fx.strike]}</p>}
    </div>
  );
}
