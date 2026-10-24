import { useCallback, useState } from 'react';
import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { useMessages } from '@/shared/i18n';
import { useOverlayKeys } from '@/shared/hooks/useOverlayKeys';
import { Panel } from '@/shared/ui';
import { SparePartSticker } from '../shared/SparePartSticker';
import { useSparePartReward } from '../shared/useSparePartReward';
import { hobbyBoardClass } from '../shared/hobbyStyles';
import {
  CAMPFIRE,
  CHORD_GRIPS,
  PICK_ROWS,
  STRING_PICKS,
  chordName,
  fretsFor,
  fretsInKey,
  homeCapo,
  noteLabel,
  pickForKey,
  slideFrets,
  type ChordColor,
  type GripId,
  type HomeKeyId,
  type Voicing
} from './grips';
import { GripBar, inkKeyClass } from './GripBar';
import { GuitarSettings } from './GuitarSettings';
import { advanceProgression } from './progression';
import { RiffNote } from './RiffNote';
import { StringBoard } from './StringBoard';
import { GUITAR_STRINGS, useGuitarSynth, type GuitarStringSpec, type StrumDirection } from './useGuitarSynth';

const NO_PLUCKS: readonly number[] = GUITAR_STRINGS.map(() => 0);
const START_GRIP: GripId = 'g';

function freshKey(handler: (event: KeyboardEvent) => void) {
  return (event: KeyboardEvent) => {
    if (event.repeat) return;
    handler(event);
  };
}

export default function GuitarStrings({ close, titleId, descriptionId }: OverlayControllerProps) {
  const messages = useMessages();
  const copy = messages.miniGames.guitar;
  const { pluck, strumShape, holdChord, glide, pluckLowest } = useGuitarSynth();
  const reward = useSparePartReward('copper-string');
  const claimReward = reward.claim;

  const [gripId, setGripId] = useState<GripId>(START_GRIP);
  const [voicing, setVoicing] = useState<Voicing>('low');
  const [color, setColor] = useState<ChordColor>('scale');
  const [capo, setCapo] = useState(0);
  const [homeKey, setHomeKey] = useState<HomeKeyId>('G');
  const [bassOnChord, setBassOnChord] = useState(true);
  const [palm, setPalm] = useState(false);
  const [plucks, setPlucks] = useState(NO_PLUCKS);
  const [progress, setProgress] = useState(0);
  const [songDone, setSongDone] = useState(false);

  const keyCapo = homeCapo(homeKey);
  const frets = fretsInKey(gripId, voicing, color, keyCapo + capo);
  const sounding = chordName(gripId, color, keyCapo + capo);

  const vibrate = useCallback((number: number | 'all') => {
    setPlucks((current) =>
      current.map((count, index) => (number === 'all' || GUITAR_STRINGS[index]?.number === number ? count + 1 : count))
    );
  }, []);

  const voiceChord = useCallback(
    (shapeFrets: readonly (number | null)[]) => {
      if (bassOnChord) {
        const number = pluckLowest(shapeFrets, palm);
        if (number !== null) vibrate(number);
        return;
      }
      holdChord(shapeFrets);
    },
    [bassOnChord, holdChord, palm, pluckLowest, vibrate]
  );

  const selectGrip = useCallback(
    (id: GripId, nextVoicing: Voicing, nextColor: ChordColor) => {
      const shape = id === 'open' ? 'low' : nextVoicing;
      const next = id === 'open' ? 'scale' : nextColor;
      setGripId(id);
      setVoicing(shape);
      setColor(next);
      setCapo(0);
      voiceChord(fretsInKey(id, shape, next, keyCapo));
    },
    [keyCapo, voiceChord]
  );

  const chooseKey = useCallback(
    (id: HomeKeyId) => {
      setHomeKey(id);
      setCapo(0);
      voiceChord(fretsInKey(gripId, voicing, color, homeCapo(id)));
    },
    [color, gripId, voiceChord, voicing]
  );

  const slide = useCallback(
    (delta: number) => {
      const next = capo + delta;
      const moved = slideFrets(fretsFor(gripId, voicing, color), keyCapo + next);
      if (!moved) return;
      setCapo(next);
      glide(moved);
    },
    [capo, color, glide, gripId, keyCapo, voicing]
  );

  const commitStrum = useCallback(
    (id: GripId) => {
      const inKey = color === 'scale' && capo === 0;
      const next = advanceProgression(progress, inKey ? id : 'open', CAMPFIRE);
      const completed = next === CAMPFIRE.length;
      setProgress(completed ? 0 : next);
      setSongDone(completed);
      if (completed) claimReward();
    },
    [capo, claimReward, color, progress]
  );

  const playString = useCallback(
    (spec: GuitarStringSpec, velocity = 1) => {
      const fret = frets[spec.number - 1] ?? null;
      pluck(spec, fret === null ? 0.8 : velocity, { fret, palm });
      vibrate(spec.number);
    },
    [frets, palm, pluck, vibrate]
  );

  const strum = useCallback(
    (direction: StrumDirection) => {
      strumShape(frets, direction, palm);
      vibrate('all');
      commitStrum(gripId);
    },
    [commitStrum, frets, gripId, palm, strumShape, vibrate]
  );

  const togglePalm = useCallback(() => setPalm((muted) => !muted), []);

  useOverlayKeys({
    ...Object.fromEntries(
      STRING_PICKS.flatMap((pick) => {
        const spec = GUITAR_STRINGS.find((string) => string.number === pick.string);
        if (!spec) return [];
        const handler = freshKey(() => playString(spec, 0.9));
        return [
          [pick.key, handler],
          [pick.key.toUpperCase(), handler]
        ];
      })
    ),
    ...Object.fromEntries(
      CHORD_GRIPS.flatMap((shape) => {
        const handler = freshKey((event) =>
          selectGrip(shape.id, event.shiftKey ? 'high' : 'low', event.altKey ? 'alt' : 'scale')
        );
        return [
          [shape.key, handler],
          [shape.key.toUpperCase(), handler]
        ];
      })
    ),
    ' ': freshKey(() => strum('down')),
    ';': freshKey(() => strum('up')),
    ArrowUp: freshKey(() => strum('up')),
    ArrowDown: freshKey(() => strum('down')),
    '-': freshKey(() => slide(-1)),
    '=': freshKey(() => slide(1)),
    '+': freshKey(() => slide(1)),
    k: freshKey(togglePalm),
    K: freshKey(togglePalm)
  });

  const stepNames = CAMPFIRE.map((id) => chordName(id, 'scale', keyCapo));

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
          hint={copy.riffHint(stepNames.join(', '))}
          progressLabel={copy.riffProgress(progress, CAMPFIRE.length)}
          doneLabel={copy.riffDone}
          steps={stepNames}
          progress={progress}
          done={songDone}
        />

        <div className="flex w-full items-start gap-1.5">
          <div className="min-w-0 flex-1">
            <GripBar
              label={copy.gripsLabel}
              activeId={gripId}
              gripName={(id) => (id === gripId ? sounding : chordName(id, 'scale', keyCapo))}
              gripLabel={copy.gripLabel}
              onSelect={selectGrip}
            />
          </div>
          <GuitarSettings
            openLabel={copy.settingsLabel}
            bassLabel={copy.bassNote}
            bassHint={copy.bassNoteHint}
            keyGroupLabel={copy.homeKey}
            keyLabel={copy.homeKeyLabel}
            bass={bassOnChord}
            onBass={setBassOnChord}
            homeKey={homeKey}
            onHomeKey={chooseKey}
          />
        </div>

        <Panel border="thick" className={`${hobbyBoardClass} p-2`}>
          <StringBoard
            label={copy.boardLabel(sounding, palm)}
            gripName={sounding}
            frets={frets}
            palm={palm}
            stringKeys={STRING_PICKS.map((pick) => pick.key.toUpperCase())}
            plucks={plucks}
            onPick={(spec) => playString(spec, 0.9)}
            onStrum={(spec) => playString(spec, 0.62)}
            onRake={() => commitStrum(gripId)}
          />
          <SparePartSticker
            key={reward.stickerKey}
            partId="copper-string"
            outcome={reward.outcome === 'replay' ? null : reward.outcome}
            onDismiss={reward.dismiss}
          />
        </Panel>

        <div className="flex flex-col items-center gap-1.5">
          {PICK_ROWS.map((row) => (
            <div key={row[0]} className="flex justify-center gap-1.5">
              {row.map((key) => {
                const pick = pickForKey(key);
                const spec = pick ? GUITAR_STRINGS.find((string) => string.number === pick.string) : undefined;
                if (!spec) return null;
                const fret = frets[spec.number - 1] ?? null;
                const note = fret === null ? '×' : noteLabel(spec.frequency, fret);
                const keyLabel = key.toUpperCase();
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => playString(spec, 0.9)}
                    aria-label={fret === null ? copy.mutedStringLabel(keyLabel) : copy.stringLabel(note, keyLabel)}
                    className={`${inkKeyClass} w-11 bg-[#fbfbf9] text-[#1a1a1a]`}
                  >
                    <span className="font-mono text-sm font-black">{keyLabel}</span>
                    <span className="text-[9px] font-bold opacity-60">{note}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-1.5">
          <button type="button" onClick={() => strum('down')} aria-label={copy.strumDownLabel} className={`${inkKeyClass} bg-[#fbfbf9] px-3 text-[#1a1a1a]`}>
            <span className="font-black">{copy.strumDown}</span>
            <span className="font-mono text-[9px] opacity-60">space</span>
          </button>
          <button type="button" onClick={() => strum('up')} aria-label={copy.strumUpLabel} className={`${inkKeyClass} bg-[#fbfbf9] px-3 text-[#1a1a1a]`}>
            <span className="font-black">{copy.strumUp}</span>
            <span className="font-mono text-[9px] opacity-60">;</span>
          </button>
          <button
            type="button"
            onClick={togglePalm}
            aria-pressed={palm}
            aria-label={copy.palmLabel(palm)}
            className={`${inkKeyClass} px-3 ${palm ? 'bg-[#1a1a1a] text-[#fbfbf9]' : 'bg-[#fbfbf9] text-[#1a1a1a]'}`}
          >
            <span className="font-black">{copy.palm}</span>
            <span className={`font-mono text-[9px] ${palm ? 'opacity-70' : 'opacity-60'}`}>K</span>
          </button>
        </div>

        <p className="text-center text-sm font-bold text-[#1a1a1a] opacity-60">{copy.instruction}</p>
        <p className="text-center text-[11px] italic opacity-45">{copy.marginNote}</p>
      </div>
    </OverlayDialogFrame>
  );
}
