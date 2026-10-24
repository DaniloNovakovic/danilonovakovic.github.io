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
  CHORD_GRIPS,
  PICK_ROWS,
  STRING_PICKS,
  chordName,
  gripById,
  gripForLetter,
  rootLetter,
  homeCapo,
  noteLabel,
  pickForKey,
  stepHomeKey,
  type ChordColor,
  type GripId,
  type HomeKeyId,
  type Voicing
} from './grips';
import { fretsForPosition, nextVoicing, cagedVoicings, positionForm } from './caged';
import { chordLabel, playedFrets, type Extension } from './extensions';
import { GripBar, inkKeyClass } from './GripBar';
import { GuitarSettings } from './GuitarSettings';
import { advanceProgression } from './progression';
import { sketchById, stepSketch, type SketchId } from './sketches';
import { RiffNote } from './RiffNote';
import { StringBoard } from './StringBoard';
import { GUITAR_STRINGS, useGuitarSynth, type GuitarStringSpec, type StrumDirection } from './useGuitarSynth';

const NO_PLUCKS: readonly number[] = GUITAR_STRINGS.map(() => 0);
const NO_CHOPS: readonly boolean[] = GUITAR_STRINGS.map(() => false);
const START_GRIP: GripId = 'g';

function chordQuality(id: GripId, shown: ChordColor) {
  if (id === 'open') return 'major' as const;
  const grip = gripById(id);
  return shown === 'alt' ? grip.altQuality : grip.scaleQuality;
}

function pickCopy<T>(rewarded: boolean, prize: T, sketch: T): T {
  return rewarded ? prize : sketch;
}

function freshKey(handler: (event: KeyboardEvent) => void) {
  return (event: KeyboardEvent) => {
    if (event.repeat) return;
    handler(event);
  };
}

export default function GuitarStrings({ close, titleId, descriptionId }: OverlayControllerProps) {
  const messages = useMessages();
  const copy = messages.miniGames.guitar;
  const { pluck, strumShape, holdChord, pluckLowest } = useGuitarSynth();
  const reward = useSparePartReward('copper-string');
  const claimReward = reward.claim;

  const [gripId, setGripId] = useState<GripId>(START_GRIP);
  const [voicing, setVoicing] = useState<Voicing>('low');
  const [color, setColor] = useState<ChordColor>('scale');
  const [homeKey, setHomeKey] = useState<HomeKeyId>('G');
  const [extensions, setExtensions] = useState<readonly Extension[]>([]);
  const [sketchId, setSketchId] = useState<SketchId>('campfire');
  const [bassOnChord, setBassOnChord] = useState(true);
  const [palm, setPalm] = useState(false);
  const [shortStrum, setShortStrum] = useState(false);
  const [plucks, setPlucks] = useState(NO_PLUCKS);
  const [chops, setChops] = useState(NO_CHOPS);
  /** Neck region shared by the scale. Null keeps the open fingering. */
  const [anchor, setAnchor] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [songDone, setSongDone] = useState(false);

  const keyCapo = homeCapo(homeKey);
  const sketch = sketchById(sketchId);
  const plain = fretsForPosition(gripId, voicing, color, keyCapo, 0, anchor);
  const frets = playedFrets(gripId, voicing, color, keyCapo, anchor, extensions);
  const quality = chordQuality(gripId, color);
  const sounding = chordLabel(chordName(gripId, color, keyCapo), quality, extensions);
  const form = positionForm(gripId, color, keyCapo, 0, plain);

  const vibrate = useCallback((number: number | 'all', chop: boolean) => {
    const touched = (index: number) => number === 'all' || GUITAR_STRINGS[index]?.number === number;
    setPlucks((current) => current.map((count, index) => (touched(index) ? count + 1 : count)));
    setChops((current) => current.map((value, index) => (touched(index) ? chop : value)));
  }, []);

  const voiceChord = useCallback(
    (shapeFrets: readonly (number | null)[]) => {
      if (bassOnChord) {
        const number = pluckLowest(shapeFrets, palm);
        if (number !== null) vibrate(number, false);
        return;
      }
      holdChord(shapeFrets);
    },
    [bassOnChord, holdChord, palm, pluckLowest, vibrate]
  );

  const selectGrip = useCallback(
    (id: GripId, requestedVoicing: Voicing, requestedColor: ChordColor) => {
      const shape = id === 'open' ? 'low' : requestedVoicing;
      const nextColor = id === 'open' ? 'scale' : requestedColor;
      const nextAnchor = shape === 'high' ? null : anchor;
      setAnchor(nextAnchor);
      setGripId(id);
      setVoicing(shape);
      setColor(nextColor);
      voiceChord(playedFrets(id, shape, nextColor, homeCapo(homeKey), nextAnchor, extensions));
    },
    [anchor, extensions, homeKey, voiceChord]
  );

  const chooseKey = useCallback(
    (id: HomeKeyId) => {
      setHomeKey(id);
      setAnchor(null);
      voiceChord(playedFrets(gripId, voicing, color, homeCapo(id), null, extensions));
    },
    [color, extensions, gripId, voiceChord, voicing]
  );

  const movePosition = useCallback(() => {
    const transposed = homeCapo(homeKey);
    const current = fretsForPosition(gripId, voicing, color, transposed, 0, anchor);
    const following = nextVoicing(cagedVoicings(gripId, color, transposed), current);
    if (!following) return;
    setAnchor(following.center);
    voiceChord(playedFrets(gripId, voicing, color, transposed, following.center, extensions));
  }, [anchor, color, extensions, gripId, homeKey, voiceChord, voicing]);

  const commitStrum = useCallback(
    (id: GripId) => {
      const next = advanceProgression(progress, color === 'scale' ? id : 'open', sketch.steps);
      const completed = next === sketch.steps.length;
      setProgress(completed ? 0 : next);
      setSongDone(completed);
      if (completed && sketch.reward) claimReward();
    },
    [claimReward, color, progress, sketch]
  );

  const playString = useCallback(
    (spec: GuitarStringSpec, velocity = 1, short = false) => {
      const shape = playedFrets(gripId, voicing, color, homeCapo(homeKey), anchor, extensions);
      const fret = shape[spec.number - 1] ?? null;
      pluck(spec, fret === null ? 0.8 : velocity, { fret, palm, short });
      vibrate(spec.number, short);
    },
    [anchor, color, extensions, gripId, homeKey, palm, pluck, vibrate, voicing]
  );

  const strum = useCallback(
    (direction: StrumDirection) => {
      const shape = playedFrets(gripId, voicing, color, homeCapo(homeKey), anchor, extensions);
      strumShape(shape, direction, palm, shortStrum);
      vibrate('all', shortStrum);
      commitStrum(gripId);
    },
    [anchor, color, commitStrum, extensions, gripId, homeKey, palm, shortStrum, strumShape, vibrate, voicing]
  );

  const togglePalm = useCallback(() => setPalm((muted) => !muted), []);
  const toggleShort = useCallback(() => setShortStrum((short) => !short), []);
  const toggleExtension = useCallback(
    (tone: Extension) => {
      const next = extensions.includes(tone) ? extensions.filter((item) => item !== tone) : [...extensions, tone];
      setExtensions(next);
      voiceChord(playedFrets(gripId, voicing, color, homeCapo(homeKey), anchor, next));
    },
    [anchor, color, extensions, gripId, homeKey, voiceChord, voicing]
  );
  const cycleSketch = useCallback((delta: number) => {
    setSketchId((current) => stepSketch(current, delta).id);
    setProgress(0);
    setSongDone(false);
  }, []);
  const nameGrip = (id: GripId) => {
    const shown = id === gripId ? color : 'scale';
    return chordLabel(chordName(id, shown, keyCapo), chordQuality(id, shown), extensions);
  };

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
        const handler = freshKey((event) => {
          const id = shape.id === 'open' ? 'open' : gripForLetter(shape.key, keyCapo);
          if (!id) return;
          selectGrip(id, event.shiftKey ? 'high' : 'low', event.altKey ? 'alt' : 'scale');
        });
        return [
          [shape.key, handler],
          [shape.key.toUpperCase(), handler]
        ];
      })
    ),
    ' ': freshKey(() => strum('down')),
    v: freshKey(() => strum('up')),
    V: freshKey(() => strum('up')),
    ArrowUp: freshKey(() => strum('up')),
    ArrowDown: freshKey(() => strum('down')),
    '-': freshKey(() => chooseKey(stepHomeKey(homeKey, -1))),
    '=': freshKey(() => chooseKey(stepHomeKey(homeKey, 1))),
    '+': freshKey(() => chooseKey(stepHomeKey(homeKey, 1))),
    x: freshKey(togglePalm),
    X: freshKey(togglePalm),
    s: freshKey(toggleShort),
    S: freshKey(toggleShort),
    p: freshKey(movePosition),
    P: freshKey(movePosition),
    '2': freshKey(() => toggleExtension(2)),
    '4': freshKey(() => toggleExtension(4)),
    '6': freshKey(() => toggleExtension(6)),
    '7': freshKey(() => toggleExtension(7)),
    '[': freshKey(() => cycleSketch(-1)),
    ']': freshKey(() => cycleSketch(1))
  });

  const stepNames = sketch.steps.map((id) => chordName(id, 'scale', keyCapo));

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
          title={copy.sketches[sketch.id]}
          figures={sketch.figures}
          hint={pickCopy(sketch.reward, copy.riffHint(stepNames.join(', ')), copy.sketchHint(stepNames.join(', ')))}
          progressLabel={copy.riffProgress(progress, sketch.steps.length)}
          doneLabel={pickCopy(sketch.reward, copy.riffDone, copy.sketchDone)}
          nextLabel={copy.nextSketch}
          rewarded={sketch.reward}
          steps={stepNames}
          progress={progress}
          done={songDone}
          onNext={() => cycleSketch(1)}
        />

        <div className="flex w-full items-start gap-1.5">
          <div className="min-w-0 flex-1">
            <GripBar
              label={copy.gripsLabel}
              activeId={gripId}
              gripName={nameGrip}
              gripKey={(id) => (id === 'open' ? 'Z' : rootLetter(id, keyCapo).toUpperCase())}
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
            extensionGroupLabel={copy.extensionGroup}
            extensionHint={copy.extensionHint}
            extensionLabel={copy.extensionLabel}
            extensions={extensions}
            onExtension={toggleExtension}
          />
        </div>

        <Panel border="thick" className={`${hobbyBoardClass} p-2`}>
          <StringBoard
            label={copy.boardLabel(sounding, palm, shortStrum)}
            gripName={sounding}
            frets={frets}
            palm={palm}
            shortStrum={shortStrum}
            stringKeys={STRING_PICKS.map((pick) => pick.key.toUpperCase())}
            plucks={plucks}
            chops={chops}
            onPick={(spec) => playString(spec, 0.9)}
            onStrum={(spec) => playString(spec, 0.62, shortStrum)}
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
                    className={`${inkKeyClass} w-10 bg-[#fbfbf9] text-[#1a1a1a]`}
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
            <span className="font-mono text-[9px] opacity-60">V</span>
          </button>
          <button
            type="button"
            onClick={togglePalm}
            aria-pressed={palm}
            aria-label={copy.palmLabel(palm)}
            className={`${inkKeyClass} px-3 ${palm ? 'bg-[#1a1a1a] text-[#fbfbf9]' : 'bg-[#fbfbf9] text-[#1a1a1a]'}`}
          >
            <span className="font-black">{copy.palm}</span>
            <span className={`font-mono text-[9px] ${palm ? 'opacity-70' : 'opacity-60'}`}>X</span>
          </button>
          <button
            type="button"
            onClick={toggleShort}
            aria-pressed={shortStrum}
            aria-label={copy.shortLabel(shortStrum)}
            className={`${inkKeyClass} px-3 ${shortStrum ? 'bg-[#1a1a1a] text-[#fbfbf9]' : 'bg-[#fbfbf9] text-[#1a1a1a]'}`}
          >
            <span className="font-black">{copy.shortStrum}</span>
            <span className={`font-mono text-[9px] ${shortStrum ? 'opacity-70' : 'opacity-60'}`}>S</span>
          </button>
          <button
            type="button"
            onClick={movePosition}
            aria-label={copy.positionLabel(form ?? '')}
            className={`${inkKeyClass} bg-[#fbfbf9] px-3 text-[#1a1a1a]`}
          >
            <span className="font-black">{form ?? copy.position}</span>
            <span className="font-mono text-[9px] opacity-60">P</span>
          </button>
        </div>

        <p className="text-center text-sm font-bold text-[#1a1a1a] opacity-60">{copy.instruction}</p>
        <p className="text-center text-[11px] italic opacity-45">{copy.marginNote}</p>
      </div>
    </OverlayDialogFrame>
  );
}
