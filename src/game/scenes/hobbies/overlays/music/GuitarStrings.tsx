import { useCallback, useState } from 'react';
import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { useMessages } from '@/shared/i18n';
import { useOverlayKeys } from '@/shared/hooks/useOverlayKeys';
import { Panel } from '@/shared/ui';
import { SparePartSticker } from '../shared/SparePartSticker';
import { useSparePartReward } from '../shared/useSparePartReward';
import { hobbyBoardClass } from '../shared/hobbyStyles';
import { CAMPFIRE, CHORD_GRIPS, gripById, noteLabel, type GripId } from './grips';
import { GripBar, inkKeyClass } from './GripBar';
import { advanceProgression } from './progression';
import { RiffNote } from './RiffNote';
import { StringBoard } from './StringBoard';
import { GUITAR_STRINGS, useGuitarSynth, type GuitarStringSpec, type StrumDirection } from './useGuitarSynth';

const NO_PLUCKS: readonly number[] = GUITAR_STRINGS.map(() => 0);
const START_GRIP: GripId = 'em';

function freshKey(handler: (event: KeyboardEvent) => void) {
  return (event: KeyboardEvent) => {
    if (event.repeat) return;
    handler(event);
  };
}

export default function GuitarStrings({ close, titleId, descriptionId }: OverlayControllerProps) {
  const messages = useMessages();
  const copy = messages.miniGames.guitar;
  const { pluck, strumShape, retune } = useGuitarSynth();
  const reward = useSparePartReward('copper-string');
  const claimReward = reward.claim;

  const [gripId, setGripId] = useState<GripId>(START_GRIP);
  const [palm, setPalm] = useState(false);
  const [plucks, setPlucks] = useState(NO_PLUCKS);
  const [progress, setProgress] = useState(0);
  const [songDone, setSongDone] = useState(false);

  const grip = gripById(gripId);

  const vibrate = useCallback((number: number | 'all') => {
    setPlucks((current) =>
      current.map((count, index) => (number === 'all' || GUITAR_STRINGS[index]?.number === number ? count + 1 : count))
    );
  }, []);

  const selectGrip = useCallback(
    (id: GripId) => {
      setGripId(id);
      retune(gripById(id).frets);
    },
    [retune]
  );

  const commitStrum = useCallback(
    (id: GripId) => {
      const next = advanceProgression(progress, id, CAMPFIRE);
      const completed = next === CAMPFIRE.length;
      setProgress(completed ? 0 : next);
      setSongDone(completed);
      if (completed) claimReward();
    },
    [claimReward, progress]
  );

  const playString = useCallback(
    (spec: GuitarStringSpec, velocity = 1) => {
      const fret = grip.frets[spec.number - 1] ?? null;
      pluck(spec, fret === null ? 0.5 : velocity, { fret, palm });
      vibrate(spec.number);
    },
    [grip, palm, pluck, vibrate]
  );

  const strum = useCallback(
    (direction: StrumDirection) => {
      strumShape(grip.frets, direction, palm);
      vibrate('all');
      commitStrum(grip.id);
    },
    [commitStrum, grip, palm, strumShape, vibrate]
  );

  const togglePalm = useCallback(() => setPalm((muted) => !muted), []);

  useOverlayKeys({
    ...Object.fromEntries(
      GUITAR_STRINGS.map((spec) => [String(spec.number), freshKey(() => playString(spec, 0.9))])
    ),
    ...Object.fromEntries(
      CHORD_GRIPS.flatMap((shape) => {
        const handler = freshKey(() => selectGrip(shape.id));
        return [
          [shape.key, handler],
          [shape.key.toUpperCase(), handler]
        ];
      })
    ),
    ' ': freshKey((event) => strum(event.shiftKey ? 'up' : 'down')),
    ArrowUp: freshKey(() => strum('up')),
    ArrowDown: freshKey(() => strum('down')),
    m: freshKey(togglePalm),
    M: freshKey(togglePalm)
  });

  const stepNames = CAMPFIRE.map((id) => copy.grips[id]);

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
          progressLabel={copy.riffProgress(progress, CAMPFIRE.length)}
          doneLabel={copy.riffDone}
          steps={stepNames}
          progress={progress}
          done={songDone}
        />

        <GripBar
          label={copy.gripsLabel}
          activeId={gripId}
          gripName={(id) => copy.grips[id]}
          gripLabel={copy.gripLabel}
          onSelect={selectGrip}
        />

        <Panel border="thick" className={`${hobbyBoardClass} p-2`}>
          <StringBoard
            label={copy.boardLabel(copy.grips[gripId], palm)}
            gripName={copy.grips[gripId]}
            frets={grip.frets}
            palm={palm}
            plucks={plucks}
            onPick={(spec) => playString(spec, 0.9)}
            onStrum={(spec) => playString(spec, 0.62)}
            onRake={() => commitStrum(grip.id)}
          />
          <SparePartSticker key={reward.stickerKey} partId="copper-string" outcome={reward.outcome} onDismiss={reward.dismiss} />
        </Panel>

        <div className="flex w-full flex-wrap justify-center gap-1.5">
          {GUITAR_STRINGS.map((spec) => {
            const fret = grip.frets[spec.number - 1] ?? null;
            const note = fret === null ? '×' : noteLabel(spec.frequency, fret);
            return (
              <button
                key={spec.number}
                type="button"
                onClick={() => playString(spec, 0.9)}
                aria-label={fret === null ? copy.mutedStringLabel(String(spec.number)) : copy.stringLabel(note, String(spec.number))}
                className={`${inkKeyClass} w-11 bg-[#fbfbf9] text-[#1a1a1a]`}
              >
                <span className="font-mono text-sm font-black">{spec.number}</span>
                <span className="text-[9px] font-bold opacity-60">{note}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-center gap-1.5">
          <button type="button" onClick={() => strum('down')} aria-label={copy.strumDownLabel} className={`${inkKeyClass} bg-[#fbfbf9] px-3 text-[#1a1a1a]`}>
            <span className="font-black">{copy.strumDown}</span>
            <span className="font-mono text-[9px] opacity-60">space</span>
          </button>
          <button type="button" onClick={() => strum('up')} aria-label={copy.strumUpLabel} className={`${inkKeyClass} bg-[#fbfbf9] px-3 text-[#1a1a1a]`}>
            <span className="font-black">{copy.strumUp}</span>
            <span className="font-mono text-[9px] opacity-60">⇧</span>
          </button>
          <button
            type="button"
            onClick={togglePalm}
            aria-pressed={palm}
            aria-label={copy.palmLabel(palm)}
            className={`${inkKeyClass} px-3 ${palm ? 'bg-[#1a1a1a] text-[#fbfbf9]' : 'bg-[#fbfbf9] text-[#1a1a1a]'}`}
          >
            <span className="font-black">{copy.palm}</span>
            <span className={`font-mono text-[9px] ${palm ? 'opacity-70' : 'opacity-60'}`}>M</span>
          </button>
        </div>

        <p className="text-center text-sm font-bold text-[#1a1a1a] opacity-60">{copy.instruction}</p>
        <p className="text-center text-[11px] italic opacity-45">{copy.marginNote}</p>
      </div>
    </OverlayDialogFrame>
  );
}
